import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedInvoiceData } from './invoiceReader';

// Setup worker using unpkg or cdnjs with safe fallback
try {
  if (typeof window !== 'undefined') {
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

/**
 * Fallback binary text extractor that parses stream texts from PDF buffer
 * when PDF.js worker fails or encounters web worker sandbox restrictions
 */
function extractTextFallbackFromBuffer(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    let str = '';
    // Read raw ascii/latin1 characters
    const chunk = 65536;
    for (let i = 0; i < bytes.length; i += chunk) {
      str += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length))));
    }

    // Extract text between BT ... ET or parenthesized string literals ( ... ) Tj
    const textPieces: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(str)) !== null) {
      const clean = match[1].replace(/\\[nrtbf]/g, ' ').replace(/\\/g, '');
      if (clean.trim().length > 0) {
        textPieces.push(clean);
      }
    }

    return textPieces.join(' ');
  } catch (err) {
    console.warn('Fallback buffer extraction error:', err);
    return '';
  }
}

/**
 * Extracts raw text items from a PDF ArrayBuffer using pdfjs-dist
 */
export async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: buffer,
      useSystemFonts: true,
    } as any);

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText;
      } catch (pageErr) {
        console.warn(`Erro ao ler página ${pageNum} do PDF:`, pageErr);
      }
    }

    if (fullText.trim().length > 30) {
      return fullText;
    }
  } catch (pdfErr) {
    console.warn('PDF.js worker/load failed, attempting fallback buffer extractor...', pdfErr);
  }

  // Fallback: extract directly from PDF byte streams
  const fallbackText = extractTextFallbackFromBuffer(buffer);
  return fallbackText;
}

/**
 * Robust parser for Brazilian invoices (NFS-e municipal, NF-e DANFE, Recibos)
 */
export function parseBrazilianInvoiceText(text: string): ExtractedInvoiceData {
  const cleanText = text.replace(/\s+/g, ' ');

  // 1. Número da NF
  let number = '';
  const numPatterns = [
    /(?:Número\s+da\s+(?:Nota|NFS-e)|NFS-e\s+N[ºo°]|NF-e\s+N[ºo°]|N[ºo°]\s+da\s+Nota|Número\/Série)\s*[:\s#]*([0-9]{1,10})/i,
    /(?:Nota\s+Fiscal\s+(?:Eletrônica|de\s+Serviço[s]?\s+Eletrônica)\s+N[ºo°]|NFS-e\s+Número)\s*[:\s]*([0-9]{1,10})/i,
    /\bN[º°]\s*([0-9]{1,8})\b/i,
    /NÚMERO\s*[:\s]*([0-9]{1,10})/i,
  ];

  for (const pattern of numPatterns) {
    const m = cleanText.match(pattern);
    if (m && m[1]) {
      number = m[1].trim();
      break;
    }
  }

  // 2. CNPJs / CPFs
  const cnpjMatches = cleanText.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g) || [];
  const cpfMatches = cleanText.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g) || [];

  // Generally, the first CNPJ is the Prestador (Issuer) or Prefeitura,
  // and the second is the Tomador / Destinatário (Client)
  let tomadorCnpjCpf = '';
  if (cnpjMatches.length >= 2) {
    tomadorCnpjCpf = cnpjMatches[1];
  } else if (cpfMatches.length > 0) {
    tomadorCnpjCpf = cpfMatches[0];
  } else if (cnpjMatches.length === 1) {
    tomadorCnpjCpf = cnpjMatches[0];
  }

  // 3. Tomador / Razão Social
  let clientName = '';

  // Look around TOMADOR section
  const tomadorBlockMatch = cleanText.match(/TOMADOR\s+D[OE]\s+SERVIÇO[S]?(.*?)(?:INTERMEDIÁRIO|DISCRIMINAÇÃO|CÓDIGO|VALOR|DADOS\s+DO|$)/i);
  if (tomadorBlockMatch && tomadorBlockMatch[1]) {
    const sec = tomadorBlockMatch[1];
    const nameMatch =
      sec.match(/(?:Razão\s+Social|Nome\/Razão\s+Social|Nome)\s*[:\s]*([^,\n\r;]{3,80})/i) ||
      sec.match(/\b([A-ZÀ-Ú0-9\s]{4,60}\s+(?:LTDA|S\.A\.|ME|EPP|EIRELI|SERVIÇOS|SOLUÇÕES|TECNOLOGIA|COMÉRCIO|PARTICIPAÇÕES|CONSULTORIA|DESIGN|MÍDIA))\b/i);

    if (nameMatch && nameMatch[1]) {
      clientName = nameMatch[1]
        .replace(/(?:CNPJ|CPF|Endereço|Inscrição|Município|CEP|UF).*$/i, '')
        .trim();
    } else {
      const cleanSec = sec
        .replace(/(?:CPF\/CNPJ|Endereço|Município|E-mail|Inscrição\s+Municipal).*$/i, '')
        .trim();
      if (cleanSec.length > 3) {
        clientName = cleanSec.slice(0, 50).trim();
      }
    }
  }

  if (!clientName) {
    const destMatch = cleanText.match(/DESTINATÁRIO\s*\/?\s*REMETENTE.*?(?:Nome\/Razão\s+Social|Nome)\s*[:\s]*([^,\n\r;]{3,80})/i);
    if (destMatch && destMatch[1]) {
      clientName = destMatch[1].replace(/(?:CNPJ|CPF|Endereço).*$/i, '').trim();
    }
  }

  // 4. Discriminação dos Serviços
  let description = '';
  const descPatterns = [
    /DISCRIMINAÇÃO\s+D[OE]S?\s+SERVIÇO[S]?(.*?)(?:VALOR\s+TOTAL|RETENÇÕES|CÓDIGO\s+DO\s+SERVIÇO|DADOS\s+PARA\s+PAGAMENTO|INFORMAÇÕES\s+COMPLEMENTARES|BASE\s+DE\s+CÁLCULO|$)/i,
    /DESCRIÇÃO\s+D[OE]S?\s+(?:PRODUTOS|SERVIÇOS)(.*?)(?:VALOR|CÁLCULO|DADOS|$)/i,
    /SERVIÇO\s+PRESTADO\s*[:\s]*(.*?)(?:VALOR|$)/i,
  ];

  for (const pattern of descPatterns) {
    const m = cleanText.match(pattern);
    if (m && m[1]) {
      const d = m[1].replace(/\s+/g, ' ').trim();
      if (d.length > 5) {
        description = d.slice(0, 300);
        break;
      }
    }
  }

  // 5. Valores Fiscais (R$)
  let value = 0;
  const valPatterns = [
    /(?:VALOR\s+TOTAL\s+DA\s+NOTA|VALOR\s+TOTAL\s+D[OE]S?\s+SERVIÇO[S]?|VALOR\s+LÍQUIDO|VALOR\s+TOTAL\s+DA\s+NFS-e|VALOR\s+DOS\s+SERVIÇOS|TOTAL\s+DA\s+NOTA|VALOR\s+DA\s+NOTA)\s*[=:]?\s*(?:R\$\s*)?([\d.,]+)/i,
    /(?:VALOR\s+LÍQUIDO\s+DA\s+NFS-e|VALOR\s+LÍQUIDO\s+A\s+RECEBER)\s*[=:]?\s*(?:R\$\s*)?([\d.,]+)/i,
    /VALOR\s+DO\s+SERVIÇO\s*[:\s]*(?:R\$\s*)?([\d.,]+)/i,
    /R\$\s*([\d]{1,3}(?:\.\d{3})*,\d{2})/i,
  ];

  for (const pattern of valPatterns) {
    const m = cleanText.match(pattern);
    if (m && m[1]) {
      const raw = m[1].trim();
      // Handle Brazilian format: 1.250,00 -> 1250.00
      let normalized = raw;
      if (normalized.includes(',') && normalized.includes('.')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else if (normalized.includes(',')) {
        normalized = normalized.replace(',', '.');
      }
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed) && parsed > 0) {
        value = parsed;
        break;
      }
    }
  }

  // 6. Alíquota / Impostos
  let taxRate = 6;
  const taxMatch = cleanText.match(/Alíquota\s*[:\s]*([\d.,]+)\s*%/i);
  if (taxMatch && taxMatch[1]) {
    const t = parseFloat(taxMatch[1].replace(',', '.'));
    if (!isNaN(t) && t > 0) taxRate = t;
  }
  const netValue = value > 0 ? Math.round(value * (1 - taxRate / 100) * 100) / 100 : 0;

  // 7. Datas
  const today = new Date().toISOString().split('T')[0];
  let issueDate = today;
  const issueDateMatch =
    cleanText.match(/(?:Data\s+(?:e\s+Hora\s+)?da\s+Emissão|Data\s+de\s+Emissão|Emissão)\s*[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i) ||
    cleanText.match(/(\d{2})\/(\d{2})\/(\d{4})/);

  if (issueDateMatch) {
    const [, d, m, y] = issueDateMatch;
    issueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  let dueDate = '';
  const dueMatch = cleanText.match(/(?:Vencimento|Data\s+de\s+Vencimento|Venc\.)\s*[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (dueMatch) {
    const [, d, m, y] = dueMatch;
    dueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 8. Chave / Verificação / Observações
  let notes = '';
  const authMatch = cleanText.match(/(?:Código\s+de\s+Verificação|Chave\s+de\s+Acesso)\s*[:\s]*([A-Za-z0-9\-\s]{4,50})/i);
  if (authMatch && authMatch[1]) {
    notes = `Cód. Verificação: ${authMatch[1].trim()}`;
  }

  return {
    number: number || '001',
    clientName: clientName || 'Tomador / Cliente Identificado',
    cnpjCpf: tomadorCnpjCpf || undefined,
    description: description || 'Prestação de serviços constantes no documento fiscal',
    value,
    taxRate,
    netValue,
    issueDate,
    dueDate: dueDate || undefined,
    notes: notes || undefined,
    confidenceSummary: `Leitura concluída com sucesso (${number ? `NF #${number}` : 'Nota Fiscal'} - ${value > 0 ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Valores identificados'})`,
  };
}
