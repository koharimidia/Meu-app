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
 * Client-side local extraction when backend is unavailable or lacks Gemini API key
 */
export async function extractInvoiceLocally(file: File): Promise<ExtractInvoiceResult> {
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

  // Max 25MB
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Arquivo muito grande. O tamanho máximo permitido é de 25MB.');
  }

  // 2. Read file as base64 for potential backend API call
  let base64Data = '';
  try {
    base64Data = await new Promise<string>((resolve, reject) => {
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
  } catch (err) {
    if (isPdf) {
      return await extractInvoiceLocally(file);
    }
    throw err;
  }

  // 3. Try backend Gemini API first; if unavailable, missing key, or fails, use local parser
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

    if (response.ok) {
      const result: ExtractInvoiceResult = await response.json();
      if (result && result.data) {
        return result;
      }
    }

    // If server returned non-ok (e.g. 500 missing key or 404), seamlessly fallback to local PDF reader
    if (isPdf) {
      console.info('Servidor retornou status ' + response.status + '. Ativando leitor local de PDF.');
      return await extractInvoiceLocally(file);
    }

    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || `Erro ${response.status} ao processar a nota fiscal.`);
  } catch (err: any) {
    // If network error or fetch failed and is PDF, silently fallback to local extraction
    if (isPdf) {
      console.info('Executando leitor local de PDF em fallback devido a:', err?.message);
      return await extractInvoiceLocally(file);
    }
    throw err;
  }
}
