import React, { useState } from 'react';
import { Task, Priority, Category } from '../types';
import { formatDateBR, formatRelativeDate, CATEGORY_COLORS, PRIORITY_STYLES, todayISO } from '../lib/formatters';
import { CheckSquare, Plus, Trash2, Edit2, Check, AlertTriangle, Filter } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(quickTitle.trim(), 'Média', 'Trabalho', todayISO());
    setQuickTitle('');
  };

  let filtered = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.due || '').localeCompare(b.due || '');
  });

  if (statusFilter === 'open') filtered = filtered.filter((t) => !t.done);
  if (statusFilter === 'done') filtered = filtered.filter((t) => t.done);
  if (priorityFilter) filtered = filtered.filter((t) => t.priority === priorityFilter);
  if (categoryFilter) filtered = filtered.filter((t) => t.category === categoryFilter);

  const pendingCount = tasks.filter((t) => !t.done).length;
  const completedCount = tasks.filter((t) => t.done).length;

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
              {pendingCount} pendente{pendingCount === 1 ? '' : 's'} · {completedCount} concluída{completedCount === 1 ? '' : 's'}
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

        {/* Quick Add Bar */}
        <form onSubmit={handleQuickSubmit} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Adicionar tarefa rápida para hoje (pressione Enter)..."
            className="flex-1 bg-[#0b1a29] border border-[#20374b] rounded-lg px-3.5 py-2 text-xs text-[#dce7f2] placeholder-[#6f8498] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="bg-[#102233] hover:bg-[#16304a] text-blue-300 border border-[#28445b] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 shrink-0"
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
                Todas ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === 'open' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Pendentes ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('done')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  statusFilter === 'done' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Concluídas ({completedCount})
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
            {filtered.length} listada{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8194a8]">
            Nenhuma tarefa encontrada com os filtros selecionados.
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
