import * as pdfjsLib from 'pdfjs-dist';
import { ExtractedInvoiceData } from './invoiceReader';

// Configure pdfjs worker to reliable CDN matching the installed version
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker setup fallback:', e);
}

/**
 * Extracts raw text items from a PDF ArrayBuffer
 */
export async function extractTextFromPdfBuffer(buffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: buffer,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText;
  }

  return fullText;
}

/**
 * Parses structured Brazilian invoice fields from raw text
 */
export function parseBrazilianInvoiceText(text: string): ExtractedInvoiceData {
  const normalized = text.replace(/\s+/g, ' ');

  // 1. Número da NF
  let number = '';
  const numMatch =
    text.match(/(?:Número\s+da\s+(?:Nota|NFS-e)|NFS-e\s+N[ºo]|NF-e\s+N[ºo]|N[ºo]\s+da\s+Nota)\s*[:\s]*([0-9]{1,10})/i) ||
    text.match(/(?:Nota\s+Fiscal\s+(?:Eletrônica\s+)?N[ºo]|Número)\s*[:\s]*([0-9]{1,10})/i) ||
    text.match(/N[º°]\s*([0-9]{1,8})/i);
  if (numMatch && numMatch[1]) {
    number = numMatch[1].trim();
  }

  // 2. CNPJs / CPFs
  const cnpjMatches = text.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g) || [];
  const cpfMatches = text.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g) || [];
  // Usually the second CNPJ/CPF is the Tomador (first is Prestador/Prefeitura)
  let tomadorCnpjCpf = '';
  if (cnpjMatches.length > 1) {
    tomadorCnpjCpf = cnpjMatches[1];
  } else if (cpfMatches.length > 0) {
    tomadorCnpjCpf = cpfMatches[0];
  } else if (cnpjMatches.length === 1) {
    tomadorCnpjCpf = cnpjMatches[0];
  }

  // 3. Tomador / Razão Social
  let clientName = '';
  const tomadorSection = text.match(/TOMADOR\s+D[OE]\s+SERVIÇO[S]?(.*?)(?:INTERMEDIÁRIO|DISCRIMINAÇÃO|CÓDIGO|VALOR|$)/i);
  if (tomadorSection && tomadorSection[1]) {
    const sec = tomadorSection[1];
    const nameMatch =
      sec.match(/(?:Razão\s+Social|Nome\/Razão\s+Social|Nome)\s*[:\s]*([^,\n\r;]{3,80})/i) ||
      sec.match(/\b([A-ZÀ-Ú0-9\s]{4,60}\s+(?:LTDA|S\.A\.|ME|EPP|EIRELI|SERVIÇOS|SOLUÇÕES|TECNOLOGIA|COMÉRCIO|PARTICIPAÇÕES|CONSULTORIA))\b/i);
    if (nameMatch && nameMatch[1]) {
      clientName = nameMatch[1].replace(/(?:CNPJ|CPF|Endereço|Inscrição).*$/i, '').trim();
    } else {
      // Fallback first significant words in tomador block
      const cleanSec = sec.replace(/(?:CPF\/CNPJ|Endereço|Município|E-mail|Inscrição Municipal).*$/i, '').trim();
      if (cleanSec.length > 3) {
        clientName = cleanSec.slice(0, 50).trim();
      }
    }
  }

  if (!clientName) {
    const destMatch = text.match(/DESTINATÁRIO\s*\/?\s*REMETENTE.*?(?:Nome\/Razão\s+Social)\s*[:\s]*([^,\n\r;]{3,80})/i);
    if (destMatch && destMatch[1]) {
      clientName = destMatch[1].trim();
    }
  }

  // 4. Discriminação dos Serviços
  let description = '';
  const descMatch =
    text.match(/DISCRIMINAÇÃO\s+D[OE]S?\s+SERVIÇO[S]?(.*?)(?:VALOR\s+TOTAL|RETENÇÕES|CÓDIGO\s+DO\s+SERVIÇO|DADOS\s+PARA\s+PAGAMENTO|INFORMAÇÕES\s+COMPLEMENTARES|$)/i) ||
    text.match(/DESCRIÇÃO\s+D[OE]S?\s+(?:PRODUTOS|SERVIÇOS)(.*?)(?:VALOR|CÁLCULO|$)/i);
  if (descMatch && descMatch[1]) {
    description = descMatch[1].trim().slice(0, 250);
  }

  // 5. Valores Fiscais
  let value = 0;
  const valMatch =
    text.match(/(?:VALOR\s+TOTAL\s+DA\s+NOTA|VALOR\s+TOTAL\s+D[OE]S?\s+SERVIÇO[S]?|VALOR\s+LÍQUIDO|VALOR\s+TOTAL\s+DA\s+NFS-e|TOTAL\s+DA\s+NOTA)\s*[=:]?\s*(?:R\$\s*)?([\d.,]+)/i) ||
    text.match(/VALOR\s+DO\s+SERVIÇO\s*[:\s]*(?:R\$\s*)?([\d.,]+)/i);

  if (valMatch && valMatch[1]) {
    const cleanNum = valMatch[1].replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleanNum);
    if (!isNaN(parsed)) value = parsed;
  }

  // 6. Alíquota / Impostos
  let taxRate = 6;
  const taxMatch = text.match(/Alíquota\s*[:\s]*([\d.,]+)\s*%/i);
  if (taxMatch && taxMatch[1]) {
    const t = parseFloat(taxMatch[1].replace(',', '.'));
    if (!isNaN(t) && t > 0) taxRate = t;
  }
  const netValue = value > 0 ? Math.round(value * (1 - taxRate / 100) * 100) / 100 : 0;

  // 7. Datas
  const today = new Date().toISOString().split('T')[0];
  let issueDate = today;
  const dateMatch =
    text.match(/(?:Data\s+(?:e\s+Hora\s+)?da\s+Emissão|Emissão)\s*[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i) ||
    text.match(/(\d{2})\/(\d{2})\/(\d{4})/);

  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    issueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  let dueDate = '';
  const dueMatch = text.match(/(?:Vencimento|Data\s+de\s+Vencimento)\s*[:\s]*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (dueMatch) {
    const [, d, m, y] = dueMatch;
    dueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 8. Chave / Verificação
  let notes = '';
  const authMatch = text.match(/(?:Código\s+de\s+Verificação|Chave\s+de\s+Acesso)\s*[:\s]*([A-Za-z0-9\-\s]{4,50})/i);
  if (authMatch && authMatch[1]) {
    notes = `Cód. Verificação: ${authMatch[1].trim()}`;
  }

  return {
    number: number || 'S/N',
    clientName: clientName || 'Tomador / Cliente Identificado',
    cnpjCpf: tomadorCnpjCpf || undefined,
    description: description || 'Prestação de serviços descritos no documento fiscal em anexo',
    value,
    taxRate,
    netValue,
    issueDate,
    dueDate: dueDate || undefined,
    notes: notes || undefined,
    confidenceSummary: `Leitura do PDF local concluída (${number ? `NF #${number}` : 'Documento Fiscal'} - ${value > 0 ? `R$ ${value.toFixed(2)}` : 'Valores identificados'})`,
  };
}
