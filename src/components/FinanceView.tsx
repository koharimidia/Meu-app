import React, { useState } from 'react';
import { FinanceItem } from '../types';
import { formatMoney, formatDateBR, toISODate } from '../lib/formatters';
import { DollarSign, Plus, Trash2, Edit2, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2 } from 'lucide-react';

interface FinanceViewProps {
  finance: FinanceItem[];
  onOpenModal: (type: 'finance', item?: FinanceItem) => void;
  onDeleteFinance: (id: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  finance,
  onOpenModal,
  onDeleteFinance,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const isPaid = (status: string) => ['paid', 'pago', 'recebido', 'received'].includes((status || '').toLowerCase().trim());
  const isPending = (status: string) => ['pending', 'pendente', 'a receber'].includes((status || '').toLowerCase().trim());

  const currentYear = new Date().getFullYear();

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

  const payableTotal = finance
    .filter((f) => f.type === 'expense' && isPending(f.status))
    .reduce((acc, f) => acc + Number(f.value || 0), 0);

  // Filter list
  let filtered = [...finance].sort((a, b) => toISODate(b.date).localeCompare(toISODate(a.date)));

  if (typeFilter !== 'all') {
    filtered = filtered.filter((f) => f.type === typeFilter);
  }
  if (statusFilter === 'paid') {
    filtered = filtered.filter((f) => isPaid(f.status));
  } else if (statusFilter === 'pending') {
    filtered = filtered.filter((f) => isPending(f.status));
  }

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
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-400" />
              <span>Controle Financeiro</span>
            </h2>
            <p className="text-xs text-[#8194a8] mt-0.5">Fluxo de caixa, recebíveis e conciliação</p>
          </div>

          <button
            id="btn-finance-new-entry"
            onClick={() => onOpenModal('finance')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20 self-start sm:self-auto"
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
              {formatMoney(balance)}
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
              {formatMoney(incomePaid)}
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
              {formatMoney(expensePaid)}
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
              {formatMoney(receivableTotal)}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Finance Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lançamentos Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#14283a]">
            <h3 className="text-sm font-bold text-white tracking-wide">📒 Lançamentos Financeiros</h3>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#0b1a29] p-0.5 rounded-lg border border-[#20374b] text-xs">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    typeFilter === 'all' ? 'bg-[#12304b] text-white' : 'text-[#8194a8] hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTypeFilter('income')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    typeFilter === 'income' ? 'bg-emerald-600/30 text-emerald-300' : 'text-[#8194a8] hover:text-white'
                  }`}
                >
                  Entradas
                </button>
                <button
                  onClick={() => setTypeFilter('expense')}
                  className={`px-2 py-1 rounded font-medium transition-colors ${
                    typeFilter === 'expense' ? 'bg-rose-600/30 text-rose-300' : 'text-[#8194a8] hover:text-white'
                  }`}
                >
                  Despesas
                </button>
              </div>

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

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8194a8]">
              Nenhum lançamento encontrado para os filtros selecionados.
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
                        <td className="py-2.5 px-3 font-medium text-white">{item.description}</td>
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
                          {isInc ? '+' : '-'} {formatMoney(item.value)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onOpenModal('finance', item)}
                              className="p-1 rounded bg-[#13283a] hover:bg-[#1a3851] text-[#b9cad9] hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => onDeleteFinance(item.id)}
                              className="p-1 rounded bg-[#13283a] hover:bg-rose-500/20 text-[#b9cad9] hover:text-rose-400 transition-colors"
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
              <span className="text-xs font-bold text-amber-400">{formatMoney(receivableTotal)}</span>
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
                    <strong className="text-amber-400 shrink-0 font-bold">{formatMoney(r.value)}</strong>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onOpenModal('finance')}
              className="w-full mt-3 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] text-xs font-semibold transition-colors"
            >
              + Cadastrar Recebimento
            </button>
          </div>

          {/* Despesas por categoria */}
          <div className="bg-[#0a1724]/95 border border-[#1b3043] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14283a]">
              <h3 className="text-sm font-bold text-white tracking-wide">📊 Despesas por Categoria</h3>
              <span className="text-xs font-bold text-rose-400">{formatMoney(totalExpenses)}</span>
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
                  <span className="text-[10px] font-bold text-white">{formatMoney(totalExpenses)}</span>
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
                      {pct}% <span className="text-[10px] text-[#6f8498]">({formatMoney(val)})</span>
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
