import { extractTextFromPdfBuffer, parseBrazilianInvoiceText } from './pdfLocalExtractor';

export interface ExtractedInvoiceData {
  number: string;
  clientName: string;
  cnpjCpf?: string;
  description: string;
  value: number;
  taxRate?: number;
  netValue?: number;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  confidenceSummary?: string;
}

export interface ExtractInvoiceResult {
  success: boolean;
  fileName: string;
  data: ExtractedInvoiceData;
  error?: string;
}

/**
 * Client-side fallback extraction when backend /api/invoice/extract returns 404 or is unavailable
 */
async function extractInvoiceLocally(file: File): Promise<ExtractInvoiceResult> {
  const arrayBuffer = await file.arrayBuffer();
  const rawText = await extractTextFromPdfBuffer(arrayBuffer);
  const parsedData = parseBrazilianInvoiceText(rawText);

  return {
    success: true,
    fileName: file.name,
    data: parsedData,
  };
}

export async function extractInvoiceFromFile(file: File): Promise<ExtractInvoiceResult> {
  // 1. Basic validation
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/jpg',
  ];

  if (!allowedMimes.includes(file.type) && !isPdf) {
    throw new Error('Formato não suportado. Por favor, envie um arquivo PDF ou imagem (PNG, JPG).');
  }

  // Max 20MB
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. O tamanho máximo permitido é de 20MB.');
  }

  // 2. Read file as base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erro ao ler os bytes do arquivo'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Erro na leitura do arquivo'));
    reader.readAsDataURL(file);
  });

  // 3. Call backend API with seamless local fallback
  try {
    const response = await fetch('/api/invoice/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileBase64: base64Data,
        mimeType: file.type || 'application/pdf',
        fileName: file.name,
      }),
    });

    if (!response.ok) {
      // If 404 (common on Vercel static deployments or unconfigured serverless routes)
      if (response.status === 404 && isPdf) {
        console.info('Endpoint /api/invoice/extract retornou 404 na hospedagem. Ativando leitor local de PDF...');
        return await extractInvoiceLocally(file);
      }

      // If server error (e.g. missing API key on server), also try local parser
      if (isPdf) {
        try {
          const localResult = await extractInvoiceLocally(file);
          if (localResult.data.value > 0 || localResult.data.number !== 'S/N') {
            return localResult;
          }
        } catch (localErr) {
          console.warn('Falha no fallback local:', localErr);
        }
      }

      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erro ${response.status} ao processar a nota fiscal.`);
    }

    const result: ExtractInvoiceResult = await response.json();
    return result;
  } catch (err: any) {
    // If network error (offline, endpoint not found, blocked) and is PDF, try local parser
    if (isPdf) {
      try {
        console.info('Tentando leitura local do PDF em fallback...');
        return await extractInvoiceLocally(file);
      } catch (localErr) {
        console.warn('Fallback local falhou:', localErr);
      }
    }
    throw err;
  }
}

