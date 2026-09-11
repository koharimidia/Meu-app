import React, { useState } from 'react';
import { Task, Priority, Category } from '../types';
import { formatDateBR, formatRelativeDate, CATEGORY_COLORS, PRIORITY_STYLES, todayISO } from '../lib/formatters';
import {
  CheckSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onOpenModal: (type: 'task', item?: Task) => void;
  onDeleteTask: (id: string) => void;
  onQuickAddTask: (title: string, priority: Priority, category: Category, due: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onToggleTask,
  onOpenModal,
  onDeleteTask,
  onQuickAddTask,
}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState<number>(now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(now.getMonth());
  const [onlySelectedMonth, setOnlySelectedMonth] = useState<boolean>(true); // default true: strictly show only tasks of selected month

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [quickTitle, setQuickTitle] = useState('');

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const today = todayISO();
    const isCurrentMonth = today.startsWith(monthPrefix);
    const dueDate = isCurrentMonth ? today : `${monthPrefix}-01`;
    onQuickAddTask(quickTitle.trim(), 'Média', 'Trabalho', dueDate);
    setQuickTitle('');
  };

  let filtered = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.due || '').localeCompare(b.due || '');
  });

  // Filter strictly by the selected month by default
  if (onlySelectedMonth) {
    filtered = filtered.filter((t) => (t.due || '').startsWith(monthPrefix));
  }

  if (statusFilter === 'open') filtered = filtered.filter((t) => !t.done);
  if (statusFilter === 'done') filtered = filtered.filter((t) => t.done);
  if (priorityFilter) filtered = filtered.filter((t) => t.priority === priorityFilter);
  if (categoryFilter) filtered = filtered.filter((t) => t.category === categoryFilter);

  // Month-specific task counts
  const monthTasks = tasks.filter((t) => (t.due || '').startsWith(monthPrefix));
  const pendingMonthCount = monthTasks.filter((t) => !t.done).length;
  const completedMonthCount = monthTasks.filter((t) => t.done).length;

  const totalPending = tasks.filter((t) => !t.done).length;
  const totalCompleted = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#14283a]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <CheckSquare size={20} className="text-blue-400" />
              <span>Gerenciador de Tarefas</span>
            </h2>
            <p className="text-xs text-[#8194a8] mt-0.5">
              {onlySelectedMonth ? (
                <>
                  Tarefas de <span className="text-blue-300 font-semibold capitalize">{monthName}</span>: {pendingMonthCount} pendente{pendingMonthCount === 1 ? '' : 's'} · {completedMonthCount} concluída{completedMonthCount === 1 ? '' : 's'}
                </>
              ) : (
                <>
                  Total geral: {totalPending} pendente{totalPending === 1 ? '' : 's'} · {totalCompleted} concluída{totalCompleted === 1 ? '' : 's'}
                </>
              )}
            </p>
          </div>

          <button
            id="btn-tasks-new-task"
            onClick={() => onOpenModal('task')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Nova Tarefa</span>
          </button>
        </div>

        {/* Month Selector Bar */}
        <div className="mt-4 p-3 bg-[#081522] rounded-xl border border-[#162a3d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-blue-400" />
              <span className="text-sm font-bold text-white capitalize tracking-wide">
                {monthName}
              </span>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg bg-[#0e2133] hover:bg-[#16334f] text-[#8194a8] hover:text-white border border-[#203a53] transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
            {(viewMonth !== now.getMonth() || viewYear !== now.getFullYear()) && (
              <button
                type="button"
                onClick={goToCurrentMonth}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2 py-0.5 rounded bg-[#0e2133] border border-blue-500/30 transition-colors"
              >
                Mês Atual
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlySelectedMonth(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                onlySelectedMonth
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-[#0e2133] text-[#8194a8] hover:text-white border-[#203a53]'
              }`}
            >
              <Calendar size={13} />
              <span>Somente Mês Selecionado</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlySelectedMonth(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                !onlySelectedMonth
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-[#0e2133] text-[#8194a8] hover:text-white border-[#203a53]'
              }`}
            >
              <Layers size={13} />
              <span>Todos os Meses</span>
            </button>
          </div>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleQuickSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={`Adicionar tarefa rápida para ${monthName} (pressione Enter)...`}
            className="flex-1 bg-[#0b1a29] border border-[#20374b] rounded-lg px-3.5 py-2 text-xs text-[#dce7f2] placeholder-[#6f8498] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="bg-[#102233] hover:bg-[#16304a] text-blue-300 border border-[#28445b] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
          >
            + Adicionar
          </button>
        </form>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#14283a]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0b1a29] p-0.5 rounded-lg border border-[#20374b]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Todas ({onlySelectedMonth ? monthTasks.length : tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === 'open' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Pendentes ({onlySelectedMonth ? pendingMonthCount : totalPending})
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === 'done' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Concluídas ({onlySelectedMonth ? completedMonthCount : totalCompleted})
              </button>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0b1a29] border border-[#20374b] text-[#dce7f2] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500"
            >
              <option value="">Todas prioridades</option>
              <option value="Alta">Alta prioridade</option>
              <option value="Média">Média prioridade</option>
              <option value="Baixa">Baixa prioridade</option>
            </select>

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
          </div>

          <span className="text-xs text-[#8194a8]">
            {filtered.length} tarefa{filtered.length === 1 ? '' : 's'} exibida{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-[#14283a] bg-[#071320] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={15} className="text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {onlySelectedMonth ? `Tarefas de ${monthName}` : 'Todas as Tarefas'}
            </span>
          </div>
          {onlySelectedMonth ? (
            <button
              type="button"
              onClick={() => setOnlySelectedMonth(false)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
            >
              Ver todos os meses →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOnlySelectedMonth(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
            >
              ← Filtrar por {monthName}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8194a8]">
            {onlySelectedMonth
              ? `Nenhuma tarefa cadastrada para o mês de ${monthName}.`
              : 'Nenhuma tarefa encontrada com os filtros selecionados.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1b3043] bg-[#071320] text-[#71879b] text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Tarefa</th>
                  <th className="py-3 px-3">Prazo</th>
                  <th className="py-3 px-3">Prioridade</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14283a]">
                {filtered.map((item) => {
                  const prio = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.Média;
                  const cat = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Trabalho;
                  const rel = formatRelativeDate(item.due);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#0c1c2a] transition-colors ${
                        item.done ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleTask(item.id)}
                          className={`w-4 h-4 rounded mx-auto flex items-center justify-center border transition-colors ${
                            item.done
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-[#28445b] hover:border-blue-400 bg-[#07121d]'
                          }`}
                        >
                          {item.done && <Check size={11} strokeWidth={3} />}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${
                            item.done ? 'line-through text-[#8194a8]' : 'text-[#eef5fb]'
                          }`}
                        >
                          {item.title}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#a9b9c8] font-medium">{formatDateBR(item.due)}</span>
                          {!item.done && rel.isPast && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center gap-1">
                              <AlertTriangle size={10} /> Atrasada
                            </span>
                          )}
                          {!item.done && rel.isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                              Hoje
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${prio.bg} ${prio.text}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenModal('task', item)}
                            className="p-1.5 rounded bg-[#13283a] hover:bg-[#1a3851] text-[#b9cad9] hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteTask(item.id)}
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
