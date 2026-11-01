import React, { useState, useMemo } from 'react';
import { FinanceItem } from '../types';
import { formatMoney, formatDateBR, toISODate } from '../lib/formatters';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';

interface FinanceViewProps {
  finance: FinanceItem[];
  onOpenModal: (type: 'finance' | 'course', item?: FinanceItem) => void;
  onDeleteFinance: (id: string) => void;
  isPrivacyMode?: boolean;
  onTogglePrivacyMode?: () => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const FinanceView: React.FC<FinanceViewProps> = ({
  finance,
  onOpenModal,
  onDeleteFinance,
  isPrivacyMode = false,
  onTogglePrivacyMode,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'courses' | 'recurring'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('current_and_next');

  const isPaid = (status: string) => ['paid', 'pago', 'recebido', 'received'].includes((status || '').toLowerCase().trim());
  const isPending = (status: string) => ['pending', 'pendente', 'a receber'].includes((status || '').toLowerCase().trim());

  // Date and month references
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();

  const padZero = (n: number) => String(n).padStart(2, '0');
  const getYMString = (year: number, monthIndex: number) => {
    const d = new Date(year, monthIndex, 1);
    return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}`;
  };

  const currentYM = getYMString(currentYear, currentMonthIdx);
  const nextYM = getYMString(currentYear, currentMonthIdx + 1);
  const monthPlus2YM = getYMString(currentYear, currentMonthIdx + 2);
  const prevYM = getYMString(currentYear, currentMonthIdx - 1);
  const prev2YM = getYMString(currentYear, currentMonthIdx - 2);

  const getMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const idx = parseInt(m, 10) - 1;
    return `${MONTH_NAMES[idx] || m}/${y}`;
  };

  const getMonthShortLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const idx = parseInt(m, 10) - 1;
    return `${MONTH_NAMES_SHORT[idx] || m}/${y}`;
  };

  // Available unique months from all finance entries
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYM);
    set.add(nextYM);
    finance.forEach((item) => {
      const ym = toISODate(item.date).slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym)) {
        set.add(ym);
      }
    });
    return Array.from(set).sort().reverse();
  }, [finance, currentYM, nextYM]);

  // Description of current period filter
  const periodDescription = useMemo(() => {
    if (periodFilter === 'current_and_next') {
      return `${getMonthLabel(currentYM)} e ${getMonthLabel(nextYM)} (Padrão)`;
    }
    if (periodFilter === 'current') {
      return `${getMonthLabel(currentYM)} (Mês Atual)`;
    }
    if (periodFilter === 'next') {
      return `${getMonthLabel(nextYM)} (Próximo Mês)`;
    }
    if (periodFilter === 'next_3') {
      return `Próximos 3 Meses (${getMonthShortLabel(currentYM)} a ${getMonthShortLabel(monthPlus2YM)})`;
    }
    if (periodFilter === 'past_3') {
      return `Últimos 3 Meses (${getMonthShortLabel(prev2YM)} a ${getMonthShortLabel(currentYM)})`;
    }
    if (periodFilter === 'current_year') {
      return `Ano Vigente de ${currentYear}`;
    }
    if (periodFilter === 'all') {
      return 'Todos os Meses (Histórico Geral)';
    }
    return getMonthLabel(periodFilter);
  }, [periodFilter, currentYM, nextYM, currentYear, monthPlus2YM, prev2YM]);

  // Metrics
  const incomePaid = finance
    .filter((f) => f.type === 'income' && isPaid(f.status) && toISODate(f.date) >= `${currentYear}-01-01`)
    .reduce((acc, f) => acc + Number(f.value || 0), 0);

  const expensePaid = finance
    .filter((f) => f.type === 'expense' && isPaid(f.status))
    .reduce((acc, f) => acc + Number(f.value || 0), 0);

  const balance = incomePaid - expensePaid;

  const receivableTotal = finance
    .filter((f) => f.type === 'income' && isPending(f.status))
    .reduce((acc, f) => acc + Number(f.value || 0), 0);

  // Filter list by date period first
  let filtered = [...finance].sort((a, b) => toISODate(b.date).localeCompare(toISODate(a.date)));

  if (periodFilter === 'current_and_next') {
    filtered = filtered.filter((f) => {
      const ym = toISODate(f.date).slice(0, 7);
      return ym === currentYM || ym === nextYM;
    });
  } else if (periodFilter === 'current') {
    filtered = filtered.filter((f) => toISODate(f.date).slice(0, 7) === currentYM);
  } else if (periodFilter === 'next') {
    filtered = filtered.filter((f) => toISODate(f.date).slice(0, 7) === nextYM);
  } else if (periodFilter === 'next_3') {
    filtered = filtered.filter((f) => {
      const ym = toISODate(f.date).slice(0, 7);
      return ym >= currentYM && ym <= monthPlus2YM;
    });
  } else if (periodFilter === 'past_3') {
    filtered = filtered.filter((f) => {
      const ym = toISODate(f.date).slice(0, 7);
      return ym <= currentYM && ym >= prev2YM;
    });
  } else if (periodFilter === 'current_year') {
    filtered = filtered.filter((f) => toISODate(f.date).startsWith(String(currentYear)));
  } else if (periodFilter !== 'all') {
    // Specific month selected
    filtered = filtered.filter((f) => toISODate(f.date).slice(0, 7) === periodFilter);
  }

  // Filter list by type
  if (typeFilter === 'recurring') {
    filtered = filtered.filter((f) => !!f.is_recurring);
  } else if (typeFilter === 'courses') {
    filtered = filtered.filter((f) => f.category === 'Cursos' || !!f.is_course);
  } else if (typeFilter !== 'all') {
    filtered = filtered.filter((f) => f.type === typeFilter);
  }

  // Filter list by status
  if (statusFilter === 'paid') {
    filtered = filtered.filter((f) => isPaid(f.status));
  } else if (statusFilter === 'pending') {
    filtered = filtered.filter((f) => isPending(f.status));
  }

  // Summary for current filtered period
  const periodIncome = filtered
    .filter((f) => f.type === 'income')
    .reduce((acc, f) => acc + Number(f.value || 0), 0);

  const periodExpense = filtered
    .filter((f) => f.type === 'expense')
    .reduce((acc, f) => acc + Number(f.value || 0), 0);

  const periodBalance = periodIncome - periodExpense;

  // Receivables list
  const receivables = finance
    .filter((f) => f.type === 'income' && isPending(f.status))
    .sort((a, b) => b.value - a.value);

  // Expense categories breakdown
  const expenseCategories: Record<string, number> = {};
  finance
    .filter((f) => f.type === 'expense' && isPaid(f.status))
    .forEach((f) => {
      const cat = f.category || 'Outros';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + Number(f.value || 0);
    });

  const totalExpenses = Object.values(expenseCategories).reduce((a, b) => a + b, 0);
  const palette = ['#2787ff', '#a57bff', '#ffb83e', '#18c99a', '#3ac9ff', '#ff5c76', '#8da0b3'];
  const categoryEntries = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      {/* Financial KPI Banner */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#14283a]">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-400" />
                <span>Controle Financeiro</span>
              </h2>
              <p className="text-xs text-[#8194a8] mt-0.5">Fluxo de caixa, recebíveis e conciliação</p>
            </div>

            {onTogglePrivacyMode && (
              <button
                onClick={onTogglePrivacyMode}
                title={isPrivacyMode ? 'Mostrar valores' : 'Ocultar valores (Modo Privacidade)'}
                className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPrivacyMode
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-[#0f2336] text-[#8194a8] hover:text-white border border-[#1b344b]'
                }`}
              >
                {isPrivacyMode ? <EyeOff size={13} /> : <Eye size={13} />}
                <span className="hidden sm:inline">{isPrivacyMode ? 'Oculto' : 'Discreto'}</span>
              </button>
            )}
          </div>

          <button
            id="btn-finance-new-entry"
            onClick={() => onOpenModal('finance')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 self-start sm:self-auto cursor-pointer"
          >
            <Plus size={14} />
            <span>Novo Lançamento</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <small className="text-[11px] text-[#8194a8] font-medium">Saldo Líquido Real</small>
              <span className={`p-1 rounded-full ${balance >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                <DollarSign size={14} />
              </span>
            </div>
            <strong className={`text-xl block mt-2 font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatMoney(balance, isPrivacyMode)}
            </strong>
          </div>

          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <small className="text-[11px] text-[#8194a8] font-medium">Receitas Realizadas ({currentYear})</small>
              <span className="p-1 rounded-full bg-blue-500/20 text-blue-300">
                <ArrowUpRight size={14} />
              </span>
            </div>
            <strong className="text-xl block mt-2 font-bold text-blue-400">
              {formatMoney(incomePaid, isPrivacyMode)}
            </strong>
          </div>

          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <small className="text-[11px] text-[#8194a8] font-medium">Despesas Pagas</small>
              <span className="p-1 rounded-full bg-rose-500/20 text-rose-300">
                <ArrowDownLeft size={14} />
              </span>
            </div>
            <strong className="text-xl block mt-2 font-bold text-rose-400">
              {formatMoney(expensePaid, isPrivacyMode)}
            </strong>
          </div>

          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <small className="text-[11px] text-[#8194a8] font-medium">Contas a Receber</small>
              <span className="p-1 rounded-full bg-amber-500/20 text-amber-300">
                <Clock size={14} />
              </span>
            </div>
            <strong className="text-xl block mt-2 font-bold text-amber-400">
              {formatMoney(receivableTotal, isPrivacyMode)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Finance Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lançamentos Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#14283a]">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>📒 Lançamentos Financeiros</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
                </span>
              </h3>
              <p className="text-[11px] text-[#7d93a8] mt-0.5">
                Período: <span className="text-[#c8d8e8] font-medium">{periodDescription}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Period Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#0b1a29] border border-[#20374b] rounded-lg px-2.5 py-1 text-xs">
                <Calendar size={13} className="text-blue-400 shrink-0" />
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="bg-transparent border-none text-[#dce7f2] text-xs outline-none cursor-pointer pr-1 font-medium"
                  title="Filtrar por período de datas"
                >
                  <optgroup label="Filtros Rápidos de Período">
                    <option value="current_and_next" className="bg-[#0b1a29] text-white">
                      Mês Atual + Próximo (Padrão)
                    </option>
                    <option value="current" className="bg-[#0b1a29] text-white">
                      Apenas Mês Atual ({getMonthShortLabel(currentYM)})
                    </option>
                    <option value="next" className="bg-[#0b1a29] text-white">
                      Apenas Próximo Mês ({getMonthShortLabel(nextYM)})
                    </option>
                    <option value="next_3" className="bg-[#0b1a29] text-white">
                      Próximos 3 Meses
                    </option>
                    <option value="past_3" className="bg-[#0b1a29] text-white">
                      Últimos 3 Meses
                    </option>
                    <option value="current_year" className="bg-[#0b1a29] text-white">
                      Ano Vigente ({currentYear})
                    </option>
                    <option value="all" className="bg-[#0b1a29] text-white">
                      Todos os Meses (Sem filtro)
                    </option>
                  </optgroup>
                  <optgroup label="Mês Específico">
                    {availableMonths.map((ym) => (
                      <option key={ym} value={ym} className="bg-[#0b1a29] text-white">
                        {getMonthLabel(ym)} {ym === currentYM ? '(Atual)' : ym === nextYM ? '(Próximo)' : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Type Filter buttons */}
              <div className="flex items-center bg-[#0b1a29] p-0.5 rounded-lg border border-[#20374b] text-xs">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                    typeFilter === 'all' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                    typeFilter === 'income' ? 'bg-emerald-600/30 text-emerald-300' : 'text-[#8194a8] hover:text-white'
                  }`}
                >
                  Entradas
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                    typeFilter === 'expense' ? 'bg-rose-600/30 text-rose-300' : 'text-[#8194a8] hover:text-white'
                  }`}
                >
                  Despesas
                </button>
                <button
                  onClick={() => setTypeFilter('courses')}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'courses' ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-500/40' : 'text-[#8194a8] hover:text-white'
                  }`}
                  title="Filtrar cursos e treinamentos"
                >
                  <GraduationCap size={11} />
                  <span>Cursos</span>
                </button>
                <button
                  onClick={() => setTypeFilter('recurring')}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    typeFilter === 'recurring' ? 'bg-blue-600/40 text-blue-200 border border-blue-500/40' : 'text-[#8194a8] hover:text-white'
                  }`}
                  title="Filtrar despesas recorrentes mensais"
                >
                  <RefreshCw size={11} className={typeFilter === 'recurring' ? 'animate-spin' : ''} />
                  <span>Recorrentes</span>
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0b1a29] border border-[#20374b] text-[#dce7f2] rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500"
              >
                <option value="">Todos status</option>
                <option value="paid">Pagos / Recebidos</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          </div>

          {/* Period Summary & Quick Reset Bar */}
          <div className="mb-4 px-3 py-2 rounded-lg bg-[#071727] border border-[#162d42] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-[#8196a8] flex items-center gap-1 text-[11px]">
                <Calendar size={12} className="text-blue-400" />
                <span>No Período:</span>
              </span>
              <span className="text-emerald-400 font-medium">
                Entradas: <strong>{formatMoney(periodIncome, isPrivacyMode)}</strong>
              </span>
              <span className="text-rose-400 font-medium">
                Despesas: <strong>{formatMoney(periodExpense, isPrivacyMode)}</strong>
              </span>
              <span className={`font-semibold ${periodBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                Saldo: {formatMoney(periodBalance, isPrivacyMode)}
              </span>
            </div>

            {periodFilter !== 'current_and_next' ? (
              <button
                onClick={() => setPeriodFilter('current_and_next')}
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
              >
                Voltar ao padrão (Mês atual + próximo)
              </button>
            ) : (
              <span className="text-[11px] text-[#637d95]">Filtro padrão ativo</span>
            )}
          </div>

          {typeFilter === 'courses' && (
            <div className="mb-4 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between text-xs text-cyan-200">
              <span className="flex items-center gap-1.5">
                <GraduationCap size={14} className="text-cyan-400" />
                Exibindo cursos e treinamentos ({filtered.length} lançamentos registrados)
              </span>
              <button
                onClick={() => onOpenModal('course')}
                className="text-[11px] underline text-cyan-300 hover:text-white font-medium"
              >
                + Novo Curso
              </button>
            </div>
          )}

          {typeFilter === 'recurring' && (
            <div className="mb-4 p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between text-xs text-blue-200">
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className="text-blue-400" />
                Exibindo despesas mensais programadas / recorrentes ({filtered.length} lançamentos)
              </span>
              <button
                onClick={() => onOpenModal('finance')}
                className="text-[11px] underline text-blue-300 hover:text-white"
              >
                + Nova Recorrente
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8194a8]">
              <p>Nenhum lançamento encontrado para {periodDescription}.</p>
              {periodFilter !== 'all' && (
                <button
                  onClick={() => setPeriodFilter('all')}
                  className="mt-2.5 inline-block text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Ver lançamentos de todos os meses
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1b3043] bg-[#071320] text-[#71879b] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Valor</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14283a]">
                  {filtered.map((item) => {
                    const isInc = item.type === 'income';
                    const pending = isPending(item.status);

                    return (
                      <tr key={item.id} className="hover:bg-[#0c1c2a] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-[#c7d7e6]">{formatDateBR(item.date)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-white">{item.description}</span>
                            {item.is_recurring && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 flex items-center gap-0.5 shrink-0"
                                title={item.installment_total ? `Parcela ${item.installment_current} de ${item.installment_total}` : 'Despesa Mensal Recorrente'}
                              >
                                <RefreshCw size={9} />
                                {item.installment_total ? `${item.installment_current}/${item.installment_total}` : 'Mensal'}
                              </span>
                            )}
                            {(item.is_course || item.category === 'Cursos') && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 flex items-center gap-0.5 shrink-0"
                                title={item.course_status ? `Status: ${item.course_status}` : 'Curso & Educação'}
                              >
                                <GraduationCap size={9} />
                                {item.course_platform || 'Curso'}
                              </span>
                            )}
                            {item.course_link && (
                              <a
                                href={item.course_link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#8194a8] hover:text-cyan-300 transition-colors p-0.5 inline-flex items-center"
                                title="Acessar plataforma do curso"
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isInc
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            }`}
                          >
                            {isInc ? 'Entrada' : 'Despesa'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#9bb0c4]">{item.category}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              pending
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                            }`}
                          >
                            {pending ? 'Pendente' : isInc ? 'Recebido' : 'Pago'}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 font-bold ${isInc ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isInc ? '+' : '-'} {formatMoney(item.value, isPrivacyMode)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenModal('finance', item)}
                              className="p-1 rounded bg-[#13283a] hover:bg-[#1a3851] text-[#b9cad9] hover:text-white transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => onDeleteFinance(item.id)}
                              className="p-1 rounded bg-[#13283a] hover:bg-rose-500/20 text-[#b9cad9] hover:text-rose-400 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column: A Receber + Category breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Contas a receber */}
          <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">💵 A Receber</h3>
              <span className="text-xs font-bold text-amber-400">{formatMoney(receivableTotal, isPrivacyMode)}</span>
            </div>

            {receivables.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8194a8]">Nenhum valor a receber pendente.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {receivables.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg bg-[#0b1d2d] border border-[#183147] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{r.description}</p>
                      <span className="text-[10px] text-[#8194a8]">Venc.: {formatDateBR(r.date)}</span>
                    </div>
                    <strong className="text-amber-400 shrink-0 font-bold">{formatMoney(r.value, isPrivacyMode)}</strong>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onOpenModal('finance')}
              className="w-full mt-3 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] text-xs font-semibold transition-colors cursor-pointer"
            >
              + Cadastrar Recebimento
            </button>
          </div>

          {/* Despesas por categoria */}
          <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">📊 Despesas por Categoria</h3>
              <span className="text-xs font-bold text-rose-400">{formatMoney(totalExpenses, isPrivacyMode)}</span>
            </div>

            <div className="flex items-center justify-center my-3">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-inner"
                style={{
                  background:
                    totalExpenses > 0
                      ? `conic-gradient(${categoryEntries
                          .reduce<{ stops: string[]; current: number }>(
                            (acc, [_, val], i) => {
                              const pct = (val / totalExpenses) * 100;
                              const col = palette[i % palette.length];
                              acc.stops.push(`${col} ${acc.current}% ${acc.current + pct}%`);
                              acc.current += pct;
                              return acc;
                            },
                            { stops: [], current: 0 }
                          )
                          .stops.join(', ')})`
                      : '#152536',
                }}
              >
                <div className="w-16 h-16 rounded-full bg-[#0a1724] flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] text-[#8194a8]">Total</span>
                  <span className="text-[10px] font-bold text-white">{formatMoney(totalExpenses, isPrivacyMode)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {categoryEntries.map(([cat, val], i) => {
                const pct = totalExpenses > 0 ? Math.round((val / totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: palette[i % palette.length] }}
                      />
                      <span className="text-[#9eb0c0] truncate">{cat}</span>
                    </div>
                    <span className="font-semibold text-white pl-2">
                      {pct}% <span className="text-[10px] text-[#6f8498]">({formatMoney(val, isPrivacyMode)})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
