import React, { useState, useEffect } from 'react';
import { CalendarEvent, Category } from '../types';
import { formatDateBR, CATEGORY_COLORS, todayISO } from '../lib/formatters';
import {
  Calendar as CalendarIcon,
  Plus,
  Link,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  RefreshCw,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface AgendaViewProps {
  events: CalendarEvent[];
  isGcalConnected: boolean;
  onConnectGcal: () => void;
  onOpenModal: (type: 'event', item?: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  selectedDateFilter?: string;
  onSelectDateFilter?: (d: string) => void;
  isSyncingGcal: boolean;
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

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  isGcalConnected,
  onConnectGcal,
  onOpenModal,
  onDeleteEvent,
  selectedDateFilter = '',
  onSelectDateFilter,
  isSyncingGcal,
}) => {
  const [dateFilter, setDateFilter] = useState(selectedDateFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tableScope, setTableScope] = useState<'current_and_next' | 'viewed_month' | 'all'>('current_and_next');
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Month and Year state for the calendar view
  const initialDate = selectedDateFilter ? new Date(selectedDateFilter + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (selectedDateFilter) {
      setDateFilter(selectedDateFilter);
      const parts = selectedDateFilter.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
  }, [selectedDateFilter]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyOrigin = () => {
    if (navigator.clipboard && currentOrigin) {
      navigator.clipboard.writeText(currentOrigin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDateChange = (val: string) => {
    setDateFilter(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
    if (onSelectDateFilter) onSelectDateFilter(val);
  };

  const handleClear = () => {
    setDateFilter('');
    setCategoryFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setDateFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setDateFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  const handleSelectMonth = (m: number) => {
    setViewMonth(m);
    setDateFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  const handleSelectYear = (y: number) => {
    setViewYear(y);
    setDateFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const nextDateObj = new Date(currentYear, currentMonth + 1, 1);
  const nextYear = nextDateObj.getFullYear();
  const nextMonthIdx = nextDateObj.getMonth();
  const nextMonthPrefix = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}`;

  const currentMonthLabel = MONTH_NAMES[currentMonth];
  const nextMonthLabel = `${MONTH_NAMES[nextMonthIdx]} de ${nextYear}`;

  const goToCurrentMonth = () => {
    setViewYear(currentYear);
    setViewMonth(currentMonth);
    setDateFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  // Filter events:
  // 1. If dateFilter is selected (clicked day or date input): show exact date
  // 2. If tableScope is 'current_and_next': always show current month AND next month
  // 3. If tableScope is 'viewed_month': show the month selected in the calendar
  // 4. If tableScope is 'all': show all
  let filtered = [...events].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  if (dateFilter) {
    filtered = filtered.filter((e) => e.date === dateFilter);
  } else if (tableScope === 'current_and_next') {
    filtered = filtered.filter((e) => {
      const d = e.date || '';
      return d.startsWith(currentMonthPrefix) || d.startsWith(nextMonthPrefix);
    });
  } else if (tableScope === 'viewed_month') {
    filtered = filtered.filter((e) => (e.date || '').startsWith(monthPrefix));
  }

  if (categoryFilter) {
    filtered = filtered.filter((e) => e.category === categoryFilter);
  }

  // Monthly Calendar preview in Agenda
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const today = todayISO();

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#14283a]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <CalendarIcon size={20} className="text-amber-400" />
              <span>Agenda & Google Calendar</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isGcalConnected ? 'bg-emerald-400 animate-pulse' : 'bg-[#647b91]'
                }`}
              />
              <span className="text-xs text-[#8194a8]">
                {isGcalConnected
                  ? 'Google Agenda Conectado ✓ (Sincronização bidirecional)'
                  : 'Google Agenda desconectado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isGcalConnected && (
              <button
                type="button"
                id="btn-oauth-help"
                onClick={() => setShowOAuthHelp(true)}
                className="px-2.5 py-2 rounded-lg bg-[#0f2133] hover:bg-[#17324d] text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Como resolver Erro 400 origin_mismatch"
              >
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="hidden sm:inline">Erro 400 / Configuração</span>
              </button>
            )}

            <button
              id="btn-gcal-sync"
              onClick={onConnectGcal}
              disabled={isSyncingGcal}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                isGcalConnected
                  ? 'bg-[#102233] hover:bg-[#16304a] text-blue-300 border-[#28445b]'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-600/20'
              }`}
            >
              {isSyncingGcal ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : isGcalConnected ? (
                <>
                  <RefreshCw size={14} />
                  <span>Sincronizar Google</span>
                </>
              ) : (
                <>
                  <Link size={14} />
                  <span>Conectar Google Agenda</span>
                </>
              )}
            </button>

            <button
              id="btn-agenda-new-event"
              onClick={() => onOpenModal('event')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
            >
              <Plus size={14} />
              <span>Novo Compromisso</span>
            </button>
          </div>
        </div>

        {/* Compact interactive month view */}
        <div className="mt-4 p-3.5 bg-[#081522] rounded-xl border border-[#162a3d]">
          {/* Month Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 px-1 pb-2 border-b border-[#14283a]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="btn-agenda-prev-month"
                onClick={prevMonth}
                className="p-1.5 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Direct Month Selector */}
              <select
                id="select-agenda-month"
                value={viewMonth}
                onChange={(e) => handleSelectMonth(Number(e.target.value))}
                className="bg-[#0e2133] hover:bg-[#132c44] border border-[#203a53] text-white font-bold text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 cursor-pointer transition-colors capitalize"
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
                id="select-agenda-year"
                value={viewYear}
                onChange={(e) => handleSelectYear(Number(e.target.value))}
                className="bg-[#0e2133] hover:bg-[#132c44] border border-[#203a53] text-white font-bold text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 cursor-pointer transition-colors"
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
                id="btn-agenda-next-month"
                onClick={nextMonth}
                className="p-1.5 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(viewMonth !== currentMonth || viewYear !== currentYear) && (
                <button
                  type="button"
                  id="btn-agenda-today"
                  onClick={goToCurrentMonth}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2.5 py-1 rounded-lg bg-[#0e2133] border border-blue-500/30 hover:border-blue-500/60 transition-colors cursor-pointer"
                >
                  Mês Atual
                </button>
              )}
              {dateFilter && (
                <button
                  type="button"
                  id="btn-agenda-clear-day"
                  onClick={() => handleDateChange('')}
                  className="text-xs text-amber-300 hover:text-amber-200 font-semibold px-2.5 py-1 rounded-lg bg-[#1f2316] border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Ver mês completo</span>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#6f8498] mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`cal-empty-${i}`} className="h-11" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isSelected = dateFilter === dateStr;
              const isCurrent = dateStr === today;

              return (
                <button
                  key={`agenda-day-${day}`}
                  onClick={() => handleDateChange(isSelected ? '' : dateStr)}
                  className={`h-11 p-1 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-400 bg-blue-600/30 ring-2 ring-blue-400 shadow-md shadow-blue-500/20'
                      : isCurrent
                      ? 'border-blue-500/60 bg-[#0c2236]'
                      : 'border-[#172c40] bg-[#07121d] hover:border-[#274665]'
                  }`}
                  title={dayEvents.length > 0 ? `${dayEvents.length} compromisso(s) em ${formatDateBR(dateStr)}` : formatDateBR(dateStr)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-white font-black' : isCurrent ? 'text-blue-400' : 'text-[#8194a8]'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className={`text-[9px] px-1 rounded-full font-bold ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-300'}`}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((e) => {
                      const cat = CATEGORY_COLORS[e.category] || CATEGORY_COLORS.Trabalho;
                      return (
                        <div
                          key={e.id}
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.hex }}
                          title={e.title}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#14283a]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#8194a8] font-medium">Data:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-[#0b1a29] border border-[#20374b] text-[#dce7f2] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0b1a29] border border-[#20374b] text-[#dce7f2] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="">Todas categorias</option>
              <option value="Trabalho">Trabalho</option>
              <option value="Pessoal">Pessoal</option>
              <option value="Esporte">Esporte</option>
              <option value="Família">Família</option>
              <option value="Financeiro">Financeiro</option>
            </select>

            {(dateFilter || categoryFilter) && (
              <button
                onClick={handleClear}
                className="text-xs text-[#8194a8] hover:text-white px-2.5 py-1.5 rounded bg-[#102233] border border-[#28445b] transition-colors flex items-center gap-1"
              >
                <X size={12} />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {dateFilter ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Dia selecionado: {formatDateBR(dateFilter)} ({filtered.length})
              </span>
            ) : tableScope === 'current_and_next' ? (
              <span className="text-xs text-[#8194a8]">
                {currentMonthLabel} & {nextMonthLabel}: <strong className="text-white">{filtered.length}</strong> compromisso{filtered.length === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-xs text-[#8194a8]">
                Mês de {monthName}: <strong className="text-white">{filtered.length}</strong> compromisso{filtered.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Events List / Table */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-[#14283a] bg-[#071320] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <CalendarIcon size={15} className="text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {dateFilter ? (
                `Compromissos de ${formatDateBR(dateFilter)}`
              ) : tableScope === 'current_and_next' ? (
                <>
                  Compromissos de <span className="text-blue-300">{currentMonthLabel}</span> e{' '}
                  <span className="text-purple-300">{nextMonthLabel}</span>
                </>
              ) : tableScope === 'viewed_month' ? (
                `Compromissos de ${monthName}`
              ) : (
                'Todos os Compromissos'
              )}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#12283a] text-blue-300 font-bold border border-[#1d3c59]">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {dateFilter ? (
              <button
                type="button"
                id="btn-agenda-back-scope"
                onClick={() => handleDateChange('')}
                className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold px-2.5 py-1 rounded-lg bg-[#1f2316] border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>← Ver Mês Atual & Próximo</span>
                <X size={12} />
              </button>
            ) : (
              <div className="flex items-center bg-[#0b1a29] p-0.5 rounded-lg border border-[#1c364e] text-xs">
                <button
                  type="button"
                  id="tab-scope-current-next"
                  onClick={() => setTableScope('current_and_next')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    tableScope === 'current_and_next'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[#8194a8] hover:text-white'
                  }`}
                  title="Mostrar sempre os compromissos do mês atual e do próximo"
                >
                  Mês Atual e Próximo
                </button>
                <button
                  type="button"
                  id="tab-scope-viewed-month"
                  onClick={() => setTableScope('viewed_month')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    tableScope === 'viewed_month'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[#8194a8] hover:text-white'
                  }`}
                  title={`Mostrar somente do mês selecionado (${monthName})`}
                >
                  {MONTH_NAMES[viewMonth]}
                </button>
                <button
                  type="button"
                  id="tab-scope-all"
                  onClick={() => setTableScope('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    tableScope === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-[#8194a8] hover:text-white'
                  }`}
                  title="Mostrar todos os compromissos"
                >
                  Todos
                </button>
              </div>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8194a8]">
            {dateFilter
              ? `Nenhum compromisso agendado para o dia ${formatDateBR(dateFilter)}.`
              : tableScope === 'current_and_next'
              ? `Nenhum compromisso agendado para os meses de ${currentMonthLabel} e ${nextMonthLabel}.`
              : `Nenhum compromisso agendado para o mês de ${monthName}.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1b3043] bg-[#071320] text-[#71879b] text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-3">Hora</th>
                  <th className="py-3 px-4">Compromisso</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3">Origem</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14283a]">
                {filtered.map((item) => {
                  const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Trabalho;
                  const isCurMonth = (item.date || '').startsWith(currentMonthPrefix);
                  const isNxtMonth = (item.date || '').startsWith(nextMonthPrefix);

                  return (
                    <tr key={item.id} className="hover:bg-[#0c1c2a] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{formatDateBR(item.date)}</span>
                          {!dateFilter && tableScope === 'current_and_next' && (
                            isCurMonth ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/25">
                                Atual
                              </span>
                            ) : isNxtMonth ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-bold border border-purple-500/25">
                                Próximo
                              </span>
                            ) : null
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-blue-300 font-bold">{item.time || 'Dia todo'}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#eef5fb]">{item.title}</span>
                        {item.description && (
                          <p className="text-[11px] text-[#8194a8] mt-0.5 truncate max-w-md">{item.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {item.gcal_id ? (
                          <span className="text-[10px] text-blue-400 flex items-center gap-1 font-medium">
                            <Link size={11} /> Google Calendar
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8194a8]">Local / Supabase</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenModal('event', item)}
                            className="p-1.5 rounded bg-[#13283a] hover:bg-[#1a3851] text-[#b9cad9] hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(item.id)}
                            className="p-1.5 rounded bg-[#13283a] hover:bg-rose-500/20 text-[#b9cad9] hover:text-rose-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
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

      {/* OAuth 400 origin_mismatch Help Modal */}
      {showOAuthHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#091522] border border-[#1e3952] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-[#eef5fb]">
            <div className="flex items-start justify-between gap-3 border-b border-[#162d42] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Como resolver o Erro 400: origin_mismatch</h3>
                  <p className="text-xs text-[#8296aa]">Autorização Google Cloud para o seu domínio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOAuthHelp(false)}
                className="p-1.5 rounded-lg text-[#8296aa] hover:text-white hover:bg-[#12263a] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#cbd8e6] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                <p className="font-semibold text-blue-200">
                  Por que esse erro acontece?
                </p>
                <p className="text-[#a4bbd1]">
                  Por motivos de segurança, o Google exige que a URL exata do site onde o app está rodando esteja na lista de <strong className="text-white">Origens JavaScript autorizadas</strong> do seu Client ID no Google Cloud Console.
                </p>
              </div>

              {/* Step 1: URL to copy */}
              <div className="space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Copie a URL do seu domínio atual:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentOrigin || 'https://meu-app-orcin-two.vercel.app'}
                    className="flex-1 bg-[#060e17] border border-[#213a52] rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyOrigin}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#8296aa]">
                  (Dica: se for acessar pelo Vercel, a URL é <code className="text-blue-300">https://meu-app-orcin-two.vercel.app</code>)
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Abra o Google Cloud Console:
                </span>
                <p className="text-[#a4bbd1]">
                  Acesse a aba de Credenciais do projeto Google Cloud onde o Client ID foi criado:
                </p>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#112437] hover:bg-[#18344e] border border-[#25435e] text-blue-300 font-semibold transition-colors"
                >
                  <span>Abrir Google Cloud Console — Credenciais</span>
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Step 3 */}
              <div className="space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Adicione a URL nas Origens Autorizadas:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[#a4bbd1] pl-1">
                  <li>Clique no seu <strong>ID do cliente OAuth 2.0</strong> na lista de credenciais.</li>
                  <li>Role até o bloco <strong>Origens JavaScript autorizadas</strong>.</li>
                  <li>Clique em <strong>+ Adicionar URI</strong> e cole <code className="text-emerald-300 bg-[#060e17] px-1 py-0.5 rounded">https://meu-app-orcin-two.vercel.app</code> (sem barra <code className="text-amber-300">/</code> no final).</li>
                  <li>Clique em <strong>Salvar</strong> na parte inferior.</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90">
                ⏱ O Google costuma levar de <strong>1 a 5 minutos</strong> para propagar a nova origem autorizada. Após salvar no console do Google, atualize a página e clique novamente em <strong>Conectar Google Agenda</strong>!
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOAuthHelp(false)}
                className="px-4 py-2 rounded-lg bg-[#162d42] hover:bg-[#1f3d59] text-white text-xs font-semibold transition-colors"
              >
                Entendi, vou configurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
