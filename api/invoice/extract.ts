import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  // CORS headers if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { fileBase64, mimeType, fileName } = req.body || {};

    if (!fileBase64) {
      return res.status(400).json({
        error: 'Arquivo não fornecido. Envie o conteúdo base64 do documento.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Chave GEMINI_API_KEY não configurada nas variáveis de ambiente da Vercel.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMimeType = mimeType || 'application/pdf';

    const documentPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: cleanBase64,
      },
    };

    const systemPrompt = `Você é um auditor especialista em leitura de notas fiscais brasileiras (NFS-e de serviços municipais, NF-e de produtos, DANFE, recibos fiscais).
Analise o documento fiscal em anexo e extraia os dados com exatidão.

Regras:
1. 'number': Número da nota fiscal (ex.: "005" ou "125").
2. 'clientName': Razão social ou nome do TOMADOR / DESTINATÁRIO dos serviços (não use o prestador/emissor).
3. 'cnpjCpf': CNPJ ou CPF do Tomador formatado.
4. 'description': Discriminação dos serviços prestados.
5. 'value': Valor bruto total da nota em reais (número decimal).
6. 'taxRate': Alíquota percentual estimada ou informada de impostos/retenção (padrão 6 se não houver).
7. 'netValue': Valor líquido da nota fiscal.
8. 'issueDate': Data de emissão no formato AAAA-MM-DD.
9. 'dueDate': Data de vencimento no formato AAAA-MM-DD ou vazio "".
10. 'notes': Código de verificação, chave de acesso de 44 dígitos ou observações da nota.
11. 'confidenceSummary': Breve frase em português resumindo os dados lidos.`;

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
            number: { type: Type.STRING },
            clientName: { type: Type.STRING },
            cnpjCpf: { type: Type.STRING },
            description: { type: Type.STRING },
            value: { type: Type.NUMBER },
            taxRate: { type: Type.NUMBER },
            netValue: { type: Type.NUMBER },
            issueDate: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            notes: { type: Type.STRING },
            confidenceSummary: { type: Type.STRING },
          },
          required: ['number', 'clientName', 'description', 'value', 'issueDate'],
        },
      },
    });

    const extractedText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(extractedText);

    return res.status(200).json({
      success: true,
      fileName: fileName || 'documento.pdf',
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Erro na extração na Vercel:', err);
    return res.status(500).json({
      error: err?.message || 'Falha ao processar o documento fiscal.',
    });
  }
}
