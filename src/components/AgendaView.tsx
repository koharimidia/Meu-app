import React, { useState } from 'react';
import { CalendarEvent, Category } from '../types';
import { formatDateBR, CATEGORY_COLORS, todayISO } from '../lib/formatters';
import { Calendar as CalendarIcon, Plus, Link, Trash2, Edit2, Clock, CheckCircle, RefreshCw } from 'lucide-react';

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

  const handleDateChange = (val: string) => {
    setDateFilter(val);
    if (onSelectDateFilter) onSelectDateFilter(val);
  };

  const handleClear = () => {
    setDateFilter('');
    setCategoryFilter('');
    if (onSelectDateFilter) onSelectDateFilter('');
  };

  // Filter events
  let filtered = [...events].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  if (dateFilter) {
    filtered = filtered.filter((e) => e.date === dateFilter);
  }
  if (categoryFilter) {
    filtered = filtered.filter((e) => e.category === categoryFilter);
  }

  // Monthly Calendar preview in Agenda
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = todayISO();

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
        <div className="mt-4 p-3 bg-[#081522] rounded-xl border border-[#162a3d]">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#6f8498] mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`cal-empty-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isSelected = dateFilter === dateStr;
              const isCurrent = dateStr === today;

              return (
                <button
                  key={`agenda-day-${day}`}
                  onClick={() => handleDateChange(isSelected ? '' : dateStr)}
                  className={`h-11 p-1 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-400 bg-blue-600/25 ring-1 ring-blue-400'
                      : isCurrent
                      ? 'border-blue-500/60 bg-[#0c2236]'
                      : 'border-[#172c40] bg-[#07121d] hover:border-[#274665]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-white' : isCurrent ? 'text-blue-400' : 'text-[#8194a8]'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[9px] px-1 rounded-full bg-blue-500/20 text-blue-300 font-bold">
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
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-[#0b1a29] border border-[#20374b] text-[#dce7f2] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
            />

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
                className="text-xs text-[#8194a8] hover:text-white px-2.5 py-1.5 rounded bg-[#102233] border border-[#28445b] transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <span className="text-xs text-[#8194a8]">
            {filtered.length} compromisso{filtered.length === 1 ? '' : 's'} encontrado{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Events List / Table */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8194a8]">
            Nenhum compromisso encontrado para o filtro selecionado.
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
                  return (
                    <tr key={item.id} className="hover:bg-[#0c1c2a] transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{formatDateBR(item.date)}</td>
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
    </div>
  );
};
