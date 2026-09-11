import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large payload (PDFs and high-res images in base64)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Invoice extraction endpoint using Gemini 3.8 Flash
  app.post('/api/invoice/extract', async (req, res) => {
    try {
      const { fileBase64, mimeType, fileName } = req.body;

      if (!fileBase64) {
        return res.status(400).json({
          error: 'Arquivo não fornecido. Envie o conteúdo base64 do documento.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Chave GEMINI_API_KEY não configurada no servidor. Configure a chave no menu Secrets.',
        });
      }

      // Initialize Gemini SDK with telemetry header
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Normalize base64 data (strip data URL prefix if present)
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
      const cleanMimeType = mimeType || 'application/pdf';

      const documentPart = {
        inlineData: {
          mimeType: cleanMimeType,
          data: cleanBase64,
        },
      };

      const systemPrompt = `Você é um auditor e especialista em leitura automática de documentos fiscais e notas fiscais brasileiras (NFS-e - Nota Fiscal de Serviços Eletrônica municipal, NF-e / DANFE - Nota Fiscal Eletrônica estadual, NFC-e, Recibos e Faturas de Prestação de Serviços).
Analise com extrema precisão o documento em anexo (PDF ou imagem) e extraia os dados estruturados da nota fiscal emitida.

Regras de Extração:
1. 'number': Identifique o número da nota fiscal (somente algarismos ou código identificador, ex.: "125" ou "2026/04").
2. 'clientName': Razão Social ou Nome do TOMADOR DOS SERVIÇOS / DESTINATÁRIO / CLIENTE (Atenção: NÃO confunda com o Prestador/Emissor).
3. 'cnpjCpf': CNPJ ou CPF do Tomador / Destinatário (formatado ex.: 00.000.000/0001-00 ou 000.000.000-00).
4. 'description': Descrição ou discriminação detalhada dos serviços prestados ou itens da nota. Seja fiel ao que está escrito.
5. 'value': Valor total bruto da nota fiscal em reais (número decimal, ex.: 3500.00).
6. 'taxRate': Alíquota percentual estimada ou real de impostos/retenção (ex.: 6 se for Simples Nacional 6%, ou soma de ISS/PIS/COFINS/IR se informado). Se não constar, use 6.
7. 'netValue': Valor líquido a receber (valor bruto deduzido dos tributos retidos). Se a nota tiver campo 'Valor Líquido', use-o; senão calcule (valor * (1 - taxRate/100)).
8. 'issueDate': Data de emissão da nota no formato AAAA-MM-DD (ex.: 2026-03-15).
9. 'dueDate': Data de vencimento da fatura/boleto se informada, no formato AAAA-MM-DD. Se não houver, deduza ou deixe vazio "".
10. 'notes': Código de verificação da autenticidade da nota, chave de acesso de 44 dígitos (se NF-e), dados bancários para pagamento informados na nota, ou observações gerais.
11. 'confidenceSummary': Breve frase em português explicando o que foi lido com sucesso (ex.: "NFS-e Nº 0048 emitida para Alpha Tech Soluções no valor de R$ 4.500,00").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            documentPart,
            {
              text: systemPrompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              number: {
                type: Type.STRING,
                description: 'Número da Nota Fiscal',
              },
              clientName: {
                type: Type.STRING,
                description: 'Razão social ou nome do tomador dos serviços / cliente',
              },
              cnpjCpf: {
                type: Type.STRING,
                description: 'CNPJ ou CPF do tomador formatado',
              },
              description: {
                type: Type.STRING,
                description: 'Discriminação dos serviços ou produtos',
              },
              value: {
                type: Type.NUMBER,
                description: 'Valor total bruto da nota em reais',
              },
              taxRate: {
                type: Type.NUMBER,
                description: 'Alíquota de impostos estimada ou real (em %)',
              },
              netValue: {
                type: Type.NUMBER,
                description: 'Valor líquido da nota fiscal',
              },
              issueDate: {
                type: Type.STRING,
                description: 'Data de emissão da nota no formato YYYY-MM-DD',
              },
              dueDate: {
                type: Type.STRING,
                description: 'Data de vencimento no formato YYYY-MM-DD ou vazio',
              },
              notes: {
                type: Type.STRING,
                description: 'Código de verificação, chave de acesso ou observações',
              },
              confidenceSummary: {
                type: Type.STRING,
                description: 'Resumo em português do documento lido',
              },
            },
            required: ['number', 'clientName', 'description', 'value', 'issueDate'],
          },
        },
      });

      const extractedText = response.text?.trim() || '{}';
      const parsedData = JSON.parse(extractedText);

      return res.json({
        success: true,
        fileName: fileName || 'documento.pdf',
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Erro na extração de dados da nota com Gemini:', err);
      return res.status(500).json({
        error: err?.message || 'Falha ao processar o documento fiscal com a IA.',
      });
    }
  });

  // Vite development middleware vs production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
