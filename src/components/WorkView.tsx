import React, { useState } from 'react';
import { ClientProject, ProjectStage } from '../types';
import { formatMoney, formatDateBR, formatRelativeDate } from '../lib/formatters';
import { Briefcase, Plus, Edit2, Trash2, ArrowRight, DollarSign, CheckCircle, Clock, AlertCircle, Building, Mail } from 'lucide-react';

interface WorkViewProps {
  clients: ClientProject[];
  onOpenModal: (type: 'client', item?: ClientProject) => void;
  onDeleteClient: (id: string) => void;
  onUpdateStage: (id: string, stage: ProjectStage) => void;
  onGenerateInvoice: (client: ClientProject) => void;
}

const STAGES: { id: ProjectStage; label: string; color: string; bg: string; border: string }[] = [
  { id: 'proposta', label: 'Proposta / Lead', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { id: 'negociacao', label: 'Em Negociação', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'em_andamento', label: 'Em Andamento', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'espera', label: 'Em Espera', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'concluido', label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

export const WorkView: React.FC<WorkViewProps> = ({
  clients,
  onOpenModal,
  onDeleteClient,
  onUpdateStage,
  onGenerateInvoice,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterStage, setFilterStage] = useState<string>('');

  // Calculations
  const totalPipelineValue = clients
    .filter((c) => c.status !== 'concluido')
    .reduce((acc, c) => acc + Number(c.value || 0), 0);

  const activeProjectsCount = clients.filter((c) => c.status === 'em_andamento').length;
  const proposalCount = clients.filter((c) => c.status === 'proposta' || c.status === 'negociacao').length;
  const completedCount = clients.filter((c) => c.status === 'concluido').length;

  let filteredClients = [...clients];
  if (filterStage) {
    filteredClients = filteredClients.filter((c) => c.status === filterStage);
  }

  return (
    <div className="space-y-5">
      {/* Top Banner Card */}
      <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#14283a]">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase size={20} className="text-purple-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">Trabalho & Pipeline de Clientes</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/25">
                Módulo Integrado
              </span>
            </div>
            <p className="text-xs text-[#8194a8] mt-0.5">
              Gestão de propostas, clientes, entregas e integração financeira
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#0b1a29] p-0.5 rounded-lg border border-[#20374b] text-xs">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  viewMode === 'kanban' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                }`}
              >
                Lista
              </button>
            </div>

            <button
              id="btn-work-new-client"
              onClick={() => onOpenModal('client')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 shrink-0"
            >
              <Plus size={14} />
              <span>Novo Projeto / Cliente</span>
            </button>
          </div>
        </div>

        {/* 4 Pipeline Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <small className="text-[11px] text-[#8194a8] font-medium block">Total em Pipeline Ativo</small>
            <strong className="text-xl block mt-1 font-bold text-emerald-400">
              {formatMoney(totalPipelineValue)}
            </strong>
          </div>

          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <small className="text-[11px] text-[#8194a8] font-medium block">Em Execução</small>
            <strong className="text-xl block mt-1 font-bold text-blue-400">
              {activeProjectsCount} projetos
            </strong>
          </div>

          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <small className="text-[11px] text-[#8194a8] font-medium block">Propostas & Negociação</small>
            <strong className="text-xl block mt-1 font-bold text-amber-400">
              {proposalCount} oportunidades
            </strong>
          </div>

          <div className="bg-[#0b1d2d] border border-[#183147] rounded-xl p-3.5">
            <small className="text-[11px] text-[#8194a8] font-medium block">Projetos Concluídos</small>
            <strong className="text-xl block mt-1 font-bold text-cyan-400">
              {completedCount} entregas
            </strong>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageClients = clients.filter((c) => c.status === stage.id);
            const stageTotal = stageClients.reduce((acc, c) => acc + Number(c.value || 0), 0);

            return (
              <div
                key={stage.id}
                className="bg-[#0a1724]/90 border border-[#1b3043] rounded-xl p-3.5 flex flex-col min-w-[240px] shadow-md"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#14283a]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.bg} ring-1 ${stage.border}`} />
                    <h3 className={`text-xs font-bold ${stage.color}`}>{stage.label}</h3>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0b1a29] text-[#8194a8] border border-[#20374b]">
                    {stageClients.length}
                  </span>
                </div>

                <div className="text-[10px] text-[#8194a8] mb-3 flex items-center justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span className="text-white">{formatMoney(stageTotal)}</span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-1">
                  {stageClients.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-[#6f8498] border border-dashed border-[#162a3d] rounded-lg">
                      Nenhum projeto
                    </div>
                  ) : (
                    stageClients.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#0b1d2d] border border-[#183147] hover:border-[#274665] rounded-xl p-3.5 space-y-2.5 shadow-sm transition-all group"
                      >
                        {/* Title & Value */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                              {item.projectTitle}
                            </h4>
                            <p className="text-[11px] text-[#9bb0c4] flex items-center gap-1 mt-0.5 font-medium">
                              <Building size={11} className="text-[#8194a8]" />
                              {item.clientName} {item.company ? `(${item.company})` : ''}
                            </p>
                          </div>
                          <span className="text-xs font-black text-emerald-400 shrink-0">
                            {formatMoney(item.value)}
                          </span>
                        </div>

                        {/* Deadline & Contact */}
                        {item.deadline && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8194a8]">
                            <Clock size={11} />
                            <span>Prazo: {formatDateBR(item.deadline)}</span>
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-[10px] text-[#71879b] line-clamp-2 bg-[#081522] p-1.5 rounded border border-[#14283a]">
                            {item.notes}
                          </p>
                        )}

                        {/* Move stage selector & actions */}
                        <div className="pt-2 border-t border-[#14283a] flex items-center justify-between gap-1">
                          <select
                            value={item.status}
                            onChange={(e) => onUpdateStage(item.id, e.target.value as ProjectStage)}
                            className="bg-[#071320] border border-[#1f374e] text-[10px] text-[#b8cbe0] rounded px-1.5 py-1 outline-none font-medium"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onGenerateInvoice(item)}
                              className="p-1 rounded bg-[#102233] hover:bg-emerald-600/20 text-[#8194a8] hover:text-emerald-400 transition-colors"
                              title="Lançar valor no Financeiro"
                            >
                              <DollarSign size={12} />
                            </button>
                            <button
                              onClick={() => onOpenModal('client', item)}
                              className="p-1 rounded bg-[#102233] hover:bg-[#16304a] text-[#8194a8] hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => onDeleteClient(item.id)}
                              className="p-1 rounded bg-[#102233] hover:bg-rose-500/20 text-[#8194a8] hover:text-rose-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[#14283a] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Todos os Clientes e Projetos</h3>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-[#0b1a29] border border-[#20374b] text-[#dce7f2] rounded-lg px-3 py-1.5 text-xs outline-none"
            >
              <option value="">Todas as etapas</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1b3043] bg-[#071320] text-[#71879b] text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Projeto</th>
                  <th className="py-3 px-3">Cliente / Empresa</th>
                  <th className="py-3 px-3">Etapa</th>
                  <th className="py-3 px-3">Prazo</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14283a]">
                {filteredClients.map((item) => {
                  const stage = STAGES.find((s) => s.id === item.status) || STAGES[0];
                  return (
                    <tr key={item.id} className="hover:bg-[#0c1c2a] transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{item.projectTitle}</td>
                      <td className="py-3 px-3 text-[#b8cbe0]">
                        <span>{item.clientName}</span>
                        {item.company && <span className="text-[11px] text-[#8194a8] block">{item.company}</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stage.bg} ${stage.color} ${stage.border}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#a9b9c8]">{formatDateBR(item.deadline)}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{formatMoney(item.value)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onGenerateInvoice(item)}
                            className="px-2 py-1 rounded bg-[#13283a] hover:bg-emerald-600/20 text-[#8194a8] hover:text-emerald-400 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Lançar no Financeiro"
                          >
                            <DollarSign size={11} /> Lançar
                          </button>
                          <button
                            onClick={() => onOpenModal('client', item)}
                            className="p-1.5 rounded bg-[#13283a] hover:bg-[#1a3851] text-[#b9cad9] hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteClient(item.id)}
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
        </div>
      )}
    </div>
  );
};
