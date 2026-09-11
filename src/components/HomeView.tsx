import React, { useState } from 'react';
import { Task, CalendarEvent, FinanceItem, SheetExpensePoint } from '../types';
import { formatMoney, formatDateBR, CATEGORY_COLORS, PRIORITY_STYLES, todayISO, toISODate } from '../lib/formatters';
import { Check, Clock, Plus, RefreshCw, ChevronRight, ChevronLeft, TrendingUp, AlertCircle } from 'lucide-react';

interface HomeViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  finance: FinanceItem[];
  sheetData: {
    points: SheetExpensePoint[];
    total: number;
    avg: number;
    highest: { date: string; amount: number };
    statusMessage: string;
    isRealData: boolean;
  };
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenModal: (type: 'task' | 'event' | 'finance' | 'client') => void;
  onRefreshSheets: () => void;
  isSheetLoading: boolean;
  onSelectDateAgenda?: (date: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tasks,
  events,
  finance,
  sheetData,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenModal,
  onRefreshSheets,
  isSheetLoading,
  onSelectDateAgenda,
}) => {
  const [hoveredBar, setHoveredBar] = useState<SheetExpensePoint | null>(null);

  const now = new Date();
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth());

  const prevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const today = todayISO();

  // Tasks due today or pending
  const todayTasks = tasks
    .filter((t) => t.due === today || (!t.done && t.due <= today))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const prioOrder: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };
      return (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1);
    });

  const pendingTodayCount = todayTasks.filter((t) => !t.done).length;

  // Events for today
  const todayEvents = events
    .filter((e) => e.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Finance calculations
  const isPaid = (status: string) => ['paid', 'pago', 'recebido', 'received'].includes((status || '').toLowerCase().trim());
  const isPending = (status: string) => ['pending', 'pendente', 'a receber'].includes((status || '').toLowerCase().trim());

  const currentYear = new Date().getFullYear();
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

  const receivablesList = finance
    .filter((f) => f.type === 'income' && isPending(f.status))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Expense breakdown by category
  const expenseCategories: Record<string, number> = {};
  finance
    .filter((f) => f.type === 'expense' && isPaid(f.status))
    .forEach((f) => {
      const cat = f.category || 'Outros';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + Number(f.value || 0);
    });

  const totalExpenseBreakdown = Object.values(expenseCategories).reduce((a, b) => a + b, 0);
  const palette = ['#2787ff', '#a57bff', '#ffb83e', '#18c99a', '#3ac9ff', '#ff5c76', '#8da0b3'];
  const categoryEntries = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);

  // Calendar rendering helper
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Max value for bar chart
  const maxSheetAmount = Math.max(...sheetData.points.map((p) => p.amount), 100);

  return (
    <div className="space-y-5">
      {/* Upper Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Today's Priorities (Card span 7) */}
        <div className="lg:col-span-7 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#14283a]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">🎯 Prioridades de Hoje</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">
                  {pendingTodayCount} pendentes
                </span>
              </div>
              <button
                onClick={() => onOpenModal('task')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Nova
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8194a8]">
                Nenhuma tarefa prioritária agendada para hoje. Tudo em dia! ✨
              </div>
            ) : (
              <div className="divide-y divide-[#14283a] max-h-[290px] overflow-y-auto pr-1">
                {todayTasks.map((t) => {
                  const prio = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Média;
                  const cat = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Trabalho;
                  return (
                    <div
                      key={t.id}
                      className={`py-2.5 flex items-center justify-between gap-3 group transition-opacity ${
                        t.done ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => onToggleTask(t.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            t.done
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-[#28445b] hover:border-blue-400 bg-[#07121d]'
                          }`}
                        >
                          {t.done && <Check size={11} strokeWidth={3} />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              t.done ? 'line-through text-[#8194a8]' : 'text-[#eef5fb]'
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                              {t.category}
                            </span>
                            <span className="text-[10px] text-[#6f8498]">
                              {formatDateBR(t.due)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${prio.bg} ${prio.text}`}>
                          {t.priority}
                        </span>
                        <button
                          onClick={() => onEditTask(t)}
                          className="text-[11px] text-[#8194a8] hover:text-white px-1.5 py-0.5 rounded bg-[#102233] hover:bg-[#16304a] transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => onDeleteTask(t.id)}
                          className="text-[11px] text-[#8194a8] hover:text-rose-400 px-1.5 py-0.5 rounded bg-[#102233] hover:bg-rose-500/10 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Financial Overview & Category Donut (Card span 5) */}
        <div className="lg:col-span-5 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">💰 Resumo Financeiro</h3>
              <span className="text-[11px] text-[#8194a8]">Ano {currentYear}</span>
            </div>

            {/* 4 Mini Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-[#0b1d2d] border border-[#183147] rounded-lg p-2.5">
                <small className="text-[10px] text-[#8194a8] block font-medium">Saldo Líquido</small>
                <strong className={`text-sm block mt-1 font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatMoney(balance)}
                </strong>
              </div>

              <div className="bg-[#0b1d2d] border border-[#183147] rounded-lg p-2.5">
                <small className="text-[10px] text-[#8194a8] block font-medium">Receitas ({currentYear})</small>
                <strong className="text-sm block mt-1 font-bold text-blue-400">
                  {formatMoney(incomePaid)}
                </strong>
              </div>

              <div className="bg-[#0b1d2d] border border-[#183147] rounded-lg p-2.5">
                <small className="text-[10px] text-[#8194a8] block font-medium">Despesas Pagas</small>
                <strong className="text-sm block mt-1 font-bold text-rose-400">
                  {formatMoney(expensePaid)}
                </strong>
              </div>

              <div className="bg-[#0b1d2d] border border-[#183147] rounded-lg p-2.5">
                <small className="text-[10px] text-[#8194a8] block font-medium">A Receber</small>
                <strong className="text-sm block mt-1 font-bold text-amber-400">
                  {formatMoney(receivableTotal)}
                </strong>
              </div>
            </div>

            {/* Expense breakdown chart */}
            <div className="flex items-center gap-4 pt-1">
              {/* CSS conic gradient donut matching original design */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center shadow-inner"
                  style={{
                    background:
                      totalExpenseBreakdown > 0
                        ? `conic-gradient(${categoryEntries
                            .reduce<{ stops: string[]; current: number }>(
                              (acc, [_, val], i) => {
                                const pct = (val / totalExpenseBreakdown) * 100;
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
                    <span className="text-[9px] text-[#8194a8] font-medium">Total</span>
                    <span className="text-[10px] font-bold text-white">{formatMoney(totalExpenseBreakdown)}</span>
                  </div>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className="flex-1 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {categoryEntries.length === 0 ? (
                  <p className="text-xs text-[#8194a8]">Nenhuma despesa paga registrada.</p>
                ) : (
                  categoryEntries.slice(0, 4).map(([cat, val], i) => {
                    const pct = totalExpenseBreakdown > 0 ? Math.round((val / totalExpenseBreakdown) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: palette[i % palette.length] }}
                          />
                          <span className="text-[#9eb0c0] truncate">{cat}</span>
                        </div>
                        <span className="font-semibold text-white pl-2">
                          {pct}% <span className="text-[10px] text-[#6f8498]">({formatMoney(val)})</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Today's Agenda + Contas a Receber + Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Today's Agenda (4 cols) */}
        <div className="md:col-span-4 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">📅 Agenda de Hoje</h3>
              <button
                onClick={() => onOpenModal('event')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus size={13} /> Novo
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8194a8]">
                Nenhum compromisso marcado para hoje.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {todayEvents.map((ev) => {
                  const cat = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.Trabalho;
                  return (
                    <div key={ev.id} className="flex items-center gap-2.5 text-xs py-1 border-b border-[#14283a]/60 last:border-0">
                      <span className="font-bold text-blue-300 w-12 shrink-0">{ev.time || '09:00'}</span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.hex }}
                      />
                      <span className="text-[#eef5fb] font-medium truncate flex-1">{ev.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cat.bg} ${cat.text} shrink-0`}>
                        {ev.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Contas a Receber (4 cols) */}
        <div className="md:col-span-4 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">💵 Contas a Receber</h3>
              <span className="text-xs font-bold text-amber-400">{formatMoney(receivableTotal)}</span>
            </div>

            {receivablesList.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8194a8]">
                Nenhuma conta pendente de recebimento.
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {receivablesList.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0b1d2d] border border-[#183147] text-xs"
                  >
                    <div className="truncate min-w-0">
                      <p className="font-semibold text-[#eef5fb] truncate">{rec.description}</p>
                      <span className="text-[10px] text-[#8194a8]">{formatDateBR(rec.date)}</span>
                    </div>
                    <span className="font-bold text-amber-400 shrink-0">{formatMoney(rec.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Shortcuts & Supabase Status (4 cols) */}
        <div className="md:col-span-4 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">⚡ Atalhos Rápidos</h3>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                id="home-btn-new-task"
                onClick={() => onOpenModal('task')}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-sm"
              >
                <span>+ Nova Tarefa</span>
                <ChevronRight size={14} />
              </button>

              <button
                id="home-btn-new-event"
                onClick={() => onOpenModal('event')}
                className="w-full py-2 px-3 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#dce7f2] border border-[#28445b] text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>+ Novo Compromisso</span>
                <ChevronRight size={14} />
              </button>

              <button
                id="home-btn-new-finance"
                onClick={() => onOpenModal('finance')}
                className="w-full py-2 px-3 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#dce7f2] border border-[#28445b] text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>+ Lançamento Financeiro</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-[#8093a7] mt-3 pt-2 border-t border-[#14283a] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Dados sincronizados em tempo real com o Supabase.
          </p>
        </div>
      </div>

      {/* 3. Google Sheets Gastos Diários Chart (Card Full) */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#14283a]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-wide">📈 Gastos Diários (Google Planilhas)</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                Aba: GASTOS DIARIOS
              </span>
            </div>
            <p className="text-[11px] text-[#8194a8] mt-0.5">{sheetData.statusMessage}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-2 hidden sm:block">
              <span className="text-[10px] text-[#8194a8] block">Média Diária</span>
              <span className="text-xs font-bold text-blue-300">{formatMoney(sheetData.avg)}</span>
            </div>

            <button
              onClick={onRefreshSheets}
              disabled={isSheetLoading}
              className="px-3 py-1.5 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#dce7f2] border border-[#28445b] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSheetLoading ? 'animate-spin text-blue-400' : ''} />
              <span>Atualizar Planilha</span>
            </button>
          </div>
        </div>

        {/* Interactive SVG Bar Chart */}
        <div className="relative pt-6 pb-2">
          {hoveredBar && (
            <div className="absolute top-0 right-4 bg-[#07121d] border border-blue-500/40 px-2.5 py-1 rounded-md text-xs shadow-xl pointer-events-none flex items-center gap-2">
              <span className="text-[#8194a8]">{hoveredBar.date}:</span>
              <strong className="text-blue-400 font-bold">{formatMoney(hoveredBar.amount)}</strong>
            </div>
          )}

          <div className="h-52 flex items-end gap-2 md:gap-3 px-2 overflow-x-auto">
            {sheetData.points.map((p, idx) => {
              const heightPct = Math.max(8, Math.min(100, (p.amount / maxSheetAmount) * 100));
              const isHovered = hoveredBar?.date === p.date;
              return (
                <div
                  key={`${p.date}-${idx}`}
                  className="flex-1 min-w-[36px] flex flex-col items-center gap-1.5 group cursor-pointer"
                  onMouseEnter={() => setHoveredBar(p)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <span className="text-[10px] text-[#8194a8] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-blue-300">
                    R${Math.round(p.amount)}
                  </span>
                  <div className="w-full bg-[#0e1d2c] rounded-t-md h-40 flex items-end p-0.5">
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isHovered
                          ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/30'
                          : 'bg-gradient-to-t from-blue-700/80 to-blue-500 hover:from-blue-600 hover:to-blue-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] tracking-tight font-medium transition-colors ${isHovered ? 'text-white font-bold' : 'text-[#8194a8]'}`}>
                    {p.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Month Calendar Overview (Full width grid) */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-[#14283a]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevCalMonth}
              className="p-1 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Calendário</span>
              <span className="text-xs font-semibold text-blue-300 capitalize">— {monthLabel}</span>
            </h3>
            <button
              type="button"
              onClick={nextCalMonth}
              className="p-1 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
            {(calMonth !== now.getMonth() || calYear !== now.getFullYear()) && (
              <button
                type="button"
                onClick={() => {
                  setCalYear(now.getFullYear());
                  setCalMonth(now.getMonth());
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-0.5 rounded bg-[#0e2133] border border-blue-500/30 transition-colors"
              >
                Mês Atual
              </button>
            )}
          </div>
          <span className="text-[11px] text-[#8194a8]">Clique em um dia para inspecionar</span>
        </div>

        {/* 7 columns grid */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#6f8498] mb-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells before month day 1 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[64px] rounded-lg border border-transparent bg-transparent" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayString = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dayString === today;

            const dayEvents = events.filter((e) => e.date === dayString);
            const dayTasks = tasks.filter((t) => t.due === dayString && !t.done);

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => onSelectDateAgenda && onSelectDateAgenda(dayString)}
                className={`min-h-[64px] p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isToday
                    ? 'border-blue-500 bg-[#0e243a] shadow-sm shadow-blue-500/20'
                    : 'border-[#172c40] bg-[#07121d]/80 hover:border-[#284969] hover:bg-[#0a1827]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isToday ? 'text-blue-400' : 'text-[#a9b9c8]'}`}>
                    {dayNum}
                  </span>
                  {(dayEvents.length > 0 || dayTasks.length > 0) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  )}
                </div>

                <div className="space-y-0.5 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((e) => {
                    const cat = CATEGORY_COLORS[e.category] || CATEGORY_COLORS.Trabalho;
                    return (
                      <div
                        key={e.id}
                        className="text-[9px] font-semibold px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: cat.hex }}
                        title={`${e.time}: ${e.title}`}
                      >
                        {e.title}
                      </div>
                    );
                  })}
                  {dayTasks.slice(0, 1).map((t) => (
                    <div
                      key={t.id}
                      className="text-[9px] font-medium px-1 py-0.5 rounded truncate bg-[#183147] text-[#c0d5e8] border border-[#234563]"
                      title={`Tarefa: ${t.title}`}
                    >
                      ✓ {t.title}
                    </div>
                  ))}
                  {dayEvents.length + dayTasks.length > 3 && (
                    <span className="text-[8px] text-[#8194a8] block text-right font-bold">
                      +{dayEvents.length + dayTasks.length - 3} mais
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
