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

export async function extractInvoiceFromFile(file: File): Promise<ExtractInvoiceResult> {
  // 1. Basic validation
  const allowedMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/jpg',
  ];

  if (!allowedMimes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
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

  // 3. Call backend API
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
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || `Erro ${response.status} ao processar a nota fiscal.`);
  }

  const result: ExtractInvoiceResult = await response.json();
  return result;
}
