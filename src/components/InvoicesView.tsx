import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Ban,
  Download,
  Link2,
  Trash2,
  Edit3,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Filter,
  Sparkles,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { InvoiceNF, InvoiceStatus } from '../types';
import { formatMoney, formatDateBR, todayISO } from '../lib/formatters';
import { extractInvoiceFromFile } from '../lib/invoiceReader';

interface InvoicesViewProps {
  invoices: InvoiceNF[];
  onOpenModal: (type: 'invoice', item?: InvoiceNF | null) => void;
  onDeleteInvoice: (id: string) => void;
  onToggleStatus: (id: string, newStatus: InvoiceStatus) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onOpenModal,
  onDeleteInvoice,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [yearFilter, setYearFilter] = useState<'all' | string>('all');

  // Google Sheets link management
  const [sheetUrl, setSheetUrl] = useState(() => {
    try {
      return localStorage.getItem('central_invoices_sheet_url') || '';
    } catch {
      return '';
    }
  });
  const [isConfiguringSheet, setIsConfiguringSheet] = useState(false);
  const [tempSheetUrl, setTempSheetUrl] = useState(sheetUrl);

  // Direct AI PDF Upload state
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDraggingDirectPdf, setIsDraggingDirectPdf] = useState(false);

  const handleUploadPdfDirect = async (file: File) => {
    try {
      setIsReadingPdf(true);
      setPdfError(null);
      const res = await extractInvoiceFromFile(file);
      if (res.success && res.data) {
        const d = res.data;
        const draftInvoice: Partial<InvoiceNF> = {
          number: d.number || '',
          clientName: d.clientName || '',
          cnpjCpf: d.cnpjCpf || '',
          description: d.description || '',
          value: d.value || 0,
          taxRate: d.taxRate !== undefined ? d.taxRate : 6,
          netValue: d.netValue !== undefined ? d.netValue : (d.value ? d.value * 0.94 : 0),
          issueDate: d.issueDate || todayISO(),
          dueDate: d.dueDate || '',
          status: 'emitida',
          notes: d.notes ? `${d.notes}${d.confidenceSummary ? ` | ${d.confidenceSummary}` : ''}` : d.confidenceSummary || '',
        };
        onOpenModal('invoice', draftInvoice as any);
      }
    } catch (err: any) {
      console.error('Invoice extraction error in InvoicesView:', err);
      setPdfError(err?.message || 'Erro ao ler o arquivo PDF da nota fiscal.');
    } finally {
      setIsReadingPdf(false);
    }
  };

  const saveSheetUrl = () => {
    const trimmed = tempSheetUrl.trim();
    setSheetUrl(trimmed);
    try {
      localStorage.setItem('central_invoices_sheet_url', trimmed);
    } catch (e) {
      console.warn('Failed to save sheet url', e);
    }
    setIsConfiguringSheet(false);
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = inv.number.toLowerCase().includes(q);
        const matchClient = inv.clientName.toLowerCase().includes(q);
        const matchDesc = inv.description.toLowerCase().includes(q);
        const matchDoc = inv.cnpjCpf?.toLowerCase().includes(q);
        if (!matchNum && !matchClient && !matchDesc && !matchDoc) return false;
      }

      // Status
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }

      // Year
      if (yearFilter !== 'all') {
        const invYear = (inv.issueDate || '').slice(0, 4);
        if (invYear !== yearFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      // Newest issue date first
      return (b.issueDate || '').localeCompare(a.issueDate || '');
    });
  }, [invoices, searchQuery, statusFilter, yearFilter]);

  // Financial calculations
  const metrics = useMemo(() => {
    let totalEmitido = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let countTotal = 0;
    let countPagas = 0;
    let countPendentes = 0;

    invoices.forEach((inv) => {
      if (inv.status !== 'cancelada') {
        totalEmitido += inv.value;
        countTotal++;
        if (inv.status === 'paga') {
          totalPago += inv.value;
          countPagas++;
        } else if (inv.status === 'emitida') {
          totalPendente += inv.value;
          countPendentes++;
        }
      }
    });

    return {
      totalEmitido,
      totalPago,
      totalPendente,
      countTotal,
      countPagas,
      countPendentes,
      percentPaid: totalEmitido > 0 ? Math.round((totalPago / totalEmitido) * 100) : 0,
    };
  }, [invoices]);

  // Export CSV for user to import/paste into Google Sheets
  const handleExportCSV = () => {
    if (invoices.length === 0) return;

    const headers = [
      'Número NF',
      'Cliente / Tomador',
      'CNPJ / CPF',
      'Descrição do Serviço',
      'Valor Bruto (R$)',
      'Alíquota (%)',
      'Valor Líquido (R$)',
      'Data de Emissão',
      'Data de Vencimento',
      'Data de Pagamento',
      'Status',
      'Observações',
    ];

    const rows = invoices.map((inv) => [
      `"${inv.number}"`,
      `"${inv.clientName.replace(/"/g, '""')}"`,
      `"${inv.cnpjCpf || ''}"`,
      `"${inv.description.replace(/"/g, '""')}"`,
      `"${inv.value.toFixed(2).replace('.', ',')}"`,
      `"${inv.taxRate ? inv.taxRate + '%' : ''}"`,
      `"${inv.netValue ? inv.netValue.toFixed(2).replace('.', ',') : ''}"`,
      `"${formatDateBR(inv.issueDate)}"`,
      `"${formatDateBR(inv.dueDate)}"`,
      `"${formatDateBR(inv.paymentDate)}"`,
      `"${inv.status.toUpperCase()}"`,
      `"${(inv.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `notas_fiscais_emitidas_${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <FileText size={20} />
            </span>
            <span>Controle de Notas Fiscais Emitidas</span>
          </h2>
          <p className="text-xs text-[#8194a8] mt-1">
            Gestão de NFs faturadas, controle de vencimentos e integração direta com sua planilha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Link to Spreadsheet Button */}
          {sheetUrl ? (
            <div className="flex items-center gap-1.5 bg-[#0a1622] border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs">
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-300 font-semibold hover:underline flex items-center gap-1"
                title="Abrir planilha vinculada no Google Sheets"
              >
                <span>Planilha Vinculada</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={() => {
                  setTempSheetUrl(sheetUrl);
                  setIsConfiguringSheet(true);
                }}
                className="text-[#8194a8] hover:text-white text-[11px] ml-1 p-1 hover:bg-[#13283c] rounded"
                title="Editar link da planilha"
              >
                <Edit3 size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempSheetUrl('');
                setIsConfiguringSheet(true);
              }}
              className="px-3 py-2 rounded-lg bg-[#0b1b2a] hover:bg-[#122a40] text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Link2 size={14} />
              <span>Vincular Planilha</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            title="Exportar todas as notas em formato CSV compatível com Google Sheets e Excel"
            className="px-3 py-2 rounded-lg bg-[#0a1622] hover:bg-[#12273b] text-[#9bb0c4] hover:text-white border border-[#1d354b] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* AI Upload Button */}
          <label className="px-3.5 py-2 rounded-lg bg-[#081e30] hover:bg-[#0f2d47] active:bg-[#143756] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
            {isReadingPdf ? (
              <>
                <Loader2 size={15} className="animate-spin text-cyan-400" />
                <span>Processando NF...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="text-cyan-400" />
                <span>Subir PDF com IA</span>
              </>
            )}
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              disabled={isReadingPdf}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadPdfDirect(file);
              }}
            />
          </label>

          {/* New Invoice Button */}
          <button
            id="btn-new-invoice-page"
            onClick={() => onOpenModal('invoice')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Nova NF Emitida</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Configuration Modal / Alert */}
      {isConfiguringSheet && (
        <div className="p-4 rounded-xl bg-[#0a1622] border border-blue-500/30 shadow-xl animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <span>Vincular Planilha Google de Notas Emitidas</span>
            </h3>
            <button
              onClick={() => setIsConfiguringSheet(false)}
              className="text-[#8194a8] hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-[#9bb0c4]">
            Cole abaixo o link da sua planilha do Google Sheets (ex: <code className="text-blue-300">https://docs.google.com/spreadsheets/d/...</code>). Você poderá abri-la diretamente da Central com 1 clique e exportar dados atualizados.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={tempSheetUrl}
              onChange={(e) => setTempSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/SEU_ID/edit..."
              className="flex-1 px-3.5 py-2 rounded-lg bg-[#07111b] border border-[#20374b] text-xs text-white placeholder-[#5a7187] focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={saveSheetUrl}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Salvar Link
              </button>
              <button
                onClick={() => setIsConfiguringSheet(false)}
                className="px-3 py-2 rounded-lg bg-[#112334] hover:bg-[#183147] text-[#8194a8] hover:text-white text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Emitido */}
        <div className="p-4 rounded-xl bg-[#091522] border border-[#162a3d] space-y-2">
          <div className="flex items-center justify-between text-[#8194a8] text-xs font-medium">
            <span>Total Faturado</span>
            <TrendingUp size={15} className="text-blue-400" />
          </div>
          <p className="text-xl lg:text-2xl font-black text-white tracking-tight">
            {formatMoney(metrics.totalEmitido)}
          </p>
          <p className="text-[11px] text-[#8194a8]">
            {metrics.countTotal} notas emitidas no total
          </p>
        </div>

        {/* Total Recebido / Pago */}
        <div className="p-4 rounded-xl bg-[#091522] border border-[#162a3d] space-y-2">
          <div className="flex items-center justify-between text-[#8194a8] text-xs font-medium">
            <span>Recebido (Pagas)</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <p className="text-xl lg:text-2xl font-black text-emerald-400 tracking-tight">
            {formatMoney(metrics.totalPago)}
          </p>
          <p className="text-[11px] text-emerald-300/80 font-medium">
            {metrics.countPagas} notas liquidadas ({metrics.percentPaid}%)
          </p>
        </div>

        {/* A Receber / Pendente */}
        <div className="p-4 rounded-xl bg-[#091522] border border-[#162a3d] space-y-2">
          <div className="flex items-center justify-between text-[#8194a8] text-xs font-medium">
            <span>A Receber (Pendentes)</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <p className="text-xl lg:text-2xl font-black text-amber-400 tracking-tight">
            {formatMoney(metrics.totalPendente)}
          </p>
          <p className="text-[11px] text-amber-300/80 font-medium">
            {metrics.countPendentes} notas aguardando pagamento
          </p>
        </div>

        {/* Status da Integração */}
        <div className="p-4 rounded-xl bg-[#091522] border border-[#162a3d] space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#8194a8] text-xs font-medium">
            <span>Planilha de Notas</span>
            <FileSpreadsheet size={15} className="text-cyan-400" />
          </div>
          {sheetUrl ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Planilha Conectada</span>
              </div>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 mt-1 font-medium"
              >
                <span>Acessar Google Sheets</span>
                <ExternalLink size={10} />
              </a>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[#8194a8]">Nenhuma planilha vinculada</p>
              <button
                onClick={() => setIsConfiguringSheet(true)}
                className="text-[11px] text-cyan-400 hover:underline mt-1 font-medium text-left"
              >
                + Adicionar link agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Invoice PDF Reader Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingDirectPdf(true);
        }}
        onDragLeave={() => setIsDraggingDirectPdf(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingDirectPdf(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadPdfDirect(file);
        }}
        className={`p-4 rounded-xl border transition-all ${
          isReadingPdf
            ? 'bg-[#091a2a] border-cyan-500/50'
            : isDraggingDirectPdf
            ? 'bg-[#0c263c] border-cyan-400 shadow-lg shadow-cyan-500/20'
            : 'bg-[#081522] border-dashed border-[#1f384f] hover:border-cyan-500/40'
        }`}
      >
        {isReadingPdf ? (
          <div className="flex items-center gap-3 py-1">
            <Loader2 size={24} className="animate-spin text-cyan-400 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Lendo e extraindo dados da Nota Fiscal com Gemini IA...</span>
                <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              </h4>
              <p className="text-xs text-cyan-200/80">
                Identificando tomador, CNPJ, serviços, vencimento e valores fiscais. O formulário será aberto em seguida para conferência.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Leitura Automática de Nota Fiscal (PDF ou Imagem)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    IA Gemini
                  </span>
                </div>
                <p className="text-xs text-[#8194a8]">
                  Arraste o arquivo PDF da NFS-e ou DANFE aqui ou clique para selecionar. Todos os dados fiscais são preenchidos automaticamente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="px-4 py-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 active:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-sm">
                <UploadCloud size={16} />
                <span>Carregar PDF da NF</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPdfDirect(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {pdfError && (
          <div className="mt-3 pt-2.5 border-t border-rose-500/20 flex items-center justify-between text-xs text-rose-400">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{pdfError}</span>
            </div>
            <button
              onClick={() => setPdfError(null)}
              className="text-rose-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-rose-500/20"
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-xl bg-[#08131e] border border-[#142638] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#12304b] text-white border border-blue-500/40'
                : 'text-[#8194a8] hover:text-white hover:bg-[#0d1d2d]'
            }`}
          >
            Todas ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('emitida')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'emitida'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-[#8194a8] hover:text-white hover:bg-[#0d1d2d]'
            }`}
          >
            A Receber ({invoices.filter((i) => i.status === 'emitida').length})
          </button>
          <button
            onClick={() => setStatusFilter('paga')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'paga'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-[#8194a8] hover:text-white hover:bg-[#0d1d2d]'
            }`}
          >
            Pagas ({invoices.filter((i) => i.status === 'paga').length})
          </button>
          <button
            onClick={() => setStatusFilter('cancelada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'cancelada'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-[#8194a8] hover:text-white hover:bg-[#0d1d2d]'
            }`}
          >
            Canceladas ({invoices.filter((i) => i.status === 'cancelada').length})
          </button>
        </div>

        {/* Search & Year Filters */}
        <div className="flex items-center gap-2">
          {/* Year selector */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-[#0b1a29] border border-[#1d354b] rounded-lg px-2.5 py-1.5 text-xs text-[#dce7f2] focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os anos</option>
            <option value="2026">Ano 2026</option>
            <option value="2025">Ano 2025</option>
          </select>

          {/* Search Input */}
          <div className="relative w-48 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8194a8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por NF, cliente ou serviço..."
              className="w-full pl-8 pr-4 py-1.5 bg-[#0b1a29] border border-[#1d354b] rounded-lg text-xs text-[#dce7f2] placeholder-[#6f8498] focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8194a8] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#08131e] border border-[#142638] space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <FileText size={22} />
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma nota fiscal encontrada</h3>
          <p className="text-xs text-[#8194a8] max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' || yearFilter !== 'all'
              ? 'Nenhum resultado corresponde aos filtros selecionados. Tente limpar a busca.'
              : 'Você ainda não possui notas fiscais emitidas cadastradas. Registre sua primeira NF ou vincule sua planilha!'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onOpenModal('invoice')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Emitir / Cadastrar Nota</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-[#08131e] border border-[#142638] shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#142638] bg-[#07111a] text-[11px] font-bold text-[#8194a8] uppercase tracking-wider">
                  <th className="py-3 px-4">NF Nº</th>
                  <th className="py-3 px-4">Cliente / Tomador</th>
                  <th className="py-3 px-4">Serviço / Descrição</th>
                  <th className="py-3 px-4">Emissão</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Valor Bruto</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#122334] text-xs">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paga';
                  const isPending = inv.status === 'emitida';
                  const isCanceled = inv.status === 'cancelada';

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#0c1c2c]/70 transition-colors group"
                    >
                      {/* NF Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-white bg-[#0e2133] border border-[#1f374e] px-2.5 py-1 rounded-md text-xs">
                          #{inv.number}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#e2edf7]">{inv.clientName}</div>
                        {inv.cnpjCpf && (
                          <div className="text-[11px] text-[#6f8498] font-mono mt-0.5">
                            {inv.cnpjCpf}
                          </div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[#a8bdcf] truncate" title={inv.description}>
                          {inv.description}
                        </p>
                        {inv.notes && (
                          <p className="text-[11px] text-[#647b91] truncate italic mt-0.5">
                            {inv.notes}
                          </p>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#9bb0c4]">
                        {formatDateBR(inv.issueDate)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inv.dueDate ? (
                          <span
                            className={`${
                              isPending && inv.dueDate < todayISO()
                                ? 'text-rose-400 font-bold'
                                : 'text-[#9bb0c4]'
                            }`}
                          >
                            {formatDateBR(inv.dueDate)}
                            {isPending && inv.dueDate < todayISO() && (
                              <span className="ml-1 text-[10px] text-rose-400">(Atrasada)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#566c80]">-</span>
                        )}
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-white text-sm">
                          {formatMoney(inv.value)}
                        </div>
                        {inv.netValue && inv.taxRate && (
                          <div className="text-[10px] text-[#6f8498]">
                            Líq: {formatMoney(inv.netValue)} ({inv.taxRate}%)
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 size={12} />
                            <span>Paga</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock size={12} />
                            <span>A Receber</span>
                          </span>
                        )}
                        {isCanceled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <Ban size={12} />
                            <span>Cancelada</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status Button */}
                          {isPending && (
                            <button
                              onClick={() => onToggleStatus(inv.id, 'paga')}
                              title="Marcar como Paga"
                              className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Recebida
                            </button>
                          )}
                          {isPaid && (
                            <button
                              onClick={() => onToggleStatus(inv.id, 'emitida')}
                              title="Reabrir como A Receber"
                              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Reabrir
                            </button>
                          )}

                          {/* External link if provided */}
                          {inv.sheetLink && (
                            <a
                              href={inv.sheetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-[#8194a8] hover:text-white hover:bg-[#12273b] transition-colors"
                              title="Abrir arquivo da nota ou documento"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => onOpenModal('invoice', inv)}
                            className="p-1.5 rounded-lg text-[#8194a8] hover:text-white hover:bg-[#12273b] transition-colors cursor-pointer"
                            title="Editar Nota Fiscal"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir o registro da NF #${inv.number}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#8194a8] hover:text-rose-400 hover:bg-[#12273b] transition-colors cursor-pointer"
                            title="Excluir NF"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
