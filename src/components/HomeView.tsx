import React, { useState } from 'react';
import { Task, CalendarEvent, FinanceItem } from '../types';
import { formatMoney, formatDateBR, formatRelativeDate, CATEGORY_COLORS, PRIORITY_STYLES, todayISO, toISODate } from '../lib/formatters';
import { Check, Clock, Plus, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

interface HomeViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  finance: FinanceItem[];
  onToggleTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenModal: (type: 'task' | 'event' | 'finance' | 'client') => void;
  onSelectDateAgenda?: (date: string) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const HomeView: React.FC<HomeViewProps> = ({
  tasks,
  events,
  finance,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenModal,
  onSelectDateAgenda,
}) => {
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

  const handleSelectCalMonth = (m: number) => {
    setCalMonth(m);
  };

  const handleSelectCalYear = (y: number) => {
    setCalYear(y);
  };

  const today = todayISO();

  // Current week bounds (Monday to Sunday)
  const currDate = new Date();
  const dayOfWeek = currDate.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const mondayDate = new Date(currDate);
  mondayDate.setDate(currDate.getDate() + diffToMonday);
  const mondayISO = `${mondayDate.getFullYear()}-${String(mondayDate.getMonth() + 1).padStart(2, '0')}-${String(mondayDate.getDate()).padStart(2, '0')}`;

  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const sundayISO = `${sundayDate.getFullYear()}-${String(sundayDate.getMonth() + 1).padStart(2, '0')}-${String(sundayDate.getDate()).padStart(2, '0')}`;

  // Tasks for the week (due this week OR overdue and still pending)
  const weekTasks = tasks
    .filter((t) => {
      const due = toISODate(t.due);
      if (!due) return !t.done;
      // Due in current week
      if (due >= mondayISO && due <= sundayISO) return true;
      // Overdue and still pending (active priorities)
      if (!t.done && due < mondayISO) return true;
      return false;
    })
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const prioOrder: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };
      const pDiff = (prioOrder[a.priority] ?? 1) - (prioOrder[b.priority] ?? 1);
      if (pDiff !== 0) return pDiff;
      return (toISODate(a.due) || '').localeCompare(toISODate(b.due) || '');
    });

  const pendingWeekCount = weekTasks.filter((t) => !t.done).length;

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

  return (
    <div className="space-y-5">
      {/* Upper Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Week's Priorities (Card span 7) */}
        <div className="lg:col-span-7 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-[#14283a]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">🎯 Prioridades da Semana</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">
                  {pendingWeekCount} pendentes
                </span>
              </div>
              <button
                onClick={() => onOpenModal('task')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Plus size={13} /> Nova
              </button>
            </div>

            {weekTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8194a8]">
                Nenhuma tarefa prioritária agendada para esta semana. Tudo em dia! ✨
              </div>
            ) : (
              <div className="divide-y divide-[#14283a] max-h-[290px] overflow-y-auto pr-1">
                {weekTasks.map((t) => {
                  const prio = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.Média;
                  const cat = CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Trabalho;
                  const rel = formatRelativeDate(t.due);
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
                            <span
                              className={`text-[10px] ${
                                rel.isToday
                                  ? 'text-cyan-400 font-semibold'
                                  : rel.isPast && !t.done
                                  ? 'text-rose-400 font-semibold'
                                  : 'text-[#6f8498]'
                              }`}
                            >
                              {rel.isToday ? 'Hoje' : formatDateBR(t.due)}
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

      {/* 3. Month Calendar Overview (Full width grid) */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-[#14283a]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              id="btn-home-prev-month"
              onClick={prevCalMonth}
              className="p-1 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Direct Month Selector */}
            <select
              id="select-home-month"
              value={calMonth}
              onChange={(e) => handleSelectCalMonth(Number(e.target.value))}
              className="bg-[#0e2133] hover:bg-[#132c44] border border-[#203a53] text-white font-bold text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer transition-colors capitalize"
              title="Mudar mês quando quiser"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx} className="bg-[#081522] text-white">
                  {name}
                </option>
              ))}
            </select>

            {/* Direct Year Selector */}
            <select
              id="select-home-year"
              value={calYear}
              onChange={(e) => handleSelectCalYear(Number(e.target.value))}
              className="bg-[#0e2133] hover:bg-[#132c44] border border-[#203a53] text-white font-bold text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer transition-colors"
              title="Mudar ano quando quiser"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                <option key={yr} value={yr} className="bg-[#081522] text-white">
                  {yr}
                </option>
              ))}
            </select>

            <button
              type="button"
              id="btn-home-next-month"
              onClick={nextCalMonth}
              className="p-1 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
            {(calMonth !== now.getMonth() || calYear !== now.getFullYear()) && (
              <button
                type="button"
                id="btn-home-today"
                onClick={() => {
                  setCalYear(now.getFullYear());
                  setCalMonth(now.getMonth());
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-1 rounded-lg bg-[#0e2133] border border-blue-500/30 transition-colors cursor-pointer"
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
