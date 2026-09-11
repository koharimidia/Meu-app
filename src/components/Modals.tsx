import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, FinanceItem, ClientProject, InvoiceNF, InvoiceStatus, Priority, Category, FinanceType, ProjectStage } from '../types';
import { todayISO, toISODate } from '../lib/formatters';
import { X, CheckSquare, Calendar, DollarSign, Briefcase, FileText } from 'lucide-react';

interface ModalsProps {
  isOpen: boolean;
  type: 'task' | 'event' | 'finance' | 'client' | 'invoice' | null;
  editItem: any | null;
  onClose: () => void;
  onSaveTask: (task: Partial<Task>) => void;
  onSaveEvent: (event: Partial<CalendarEvent>, syncToGcal: boolean) => void;
  onSaveFinance: (finance: Partial<FinanceItem>) => void;
  onSaveClient: (client: Partial<ClientProject>) => void;
  onSaveInvoice?: (invoice: Partial<InvoiceNF>) => void;
  isGcalConnected: boolean;
}

export const Modals: React.FC<ModalsProps> = ({
  isOpen,
  type,
  editItem,
  onClose,
  onSaveTask,
  onSaveEvent,
  onSaveFinance,
  onSaveClient,
  onSaveInvoice,
  isGcalConnected,
}) => {
  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(todayISO());
  const [taskPriority, setTaskPriority] = useState<Priority>('Média');
  const [taskCategory, setTaskCategory] = useState<Category>('Trabalho');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayISO());
  const [eventTime, setEventTime] = useState('09:00');
  const [eventCategory, setEventCategory] = useState<Category>('Trabalho');
  const [syncToGcal, setSyncToGcal] = useState(true);

  // Finance form state
  const [finType, setFinType] = useState<FinanceType>('income');
  const [finDesc, setFinDesc] = useState('');
  const [finValue, setFinValue] = useState('');
  const [finDate, setFinDate] = useState(todayISO());
  const [finCategory, setFinCategory] = useState('Trabalho');
  const [finStatus, setFinStatus] = useState<'paid' | 'pending'>('paid');

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientProjectTitle, setClientProjectTitle] = useState('');
  const [clientValue, setClientValue] = useState('');
  const [clientStatus, setClientStatus] = useState<ProjectStage>('em_andamento');
  const [clientDeadline, setClientDeadline] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Invoice form state
  const [invNumber, setInvNumber] = useState('');
  const [invClientName, setInvClientName] = useState('');
  const [invCnpjCpf, setInvCnpjCpf] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invValue, setInvValue] = useState('');
  const [invTaxRate, setInvTaxRate] = useState('6');
  const [invIssueDate, setInvIssueDate] = useState(todayISO());
  const [invDueDate, setInvDueDate] = useState('');
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('emitida');
  const [invNotes, setInvNotes] = useState('');
  const [invSheetLink, setInvSheetLink] = useState('');

  // Pre-fill on edit
  useEffect(() => {
    if (!isOpen) return;

    if (type === 'task') {
      if (editItem) {
        setTaskTitle(editItem.title || '');
        setTaskDue(editItem.due || todayISO());
        setTaskPriority(editItem.priority || 'Média');
        setTaskCategory(editItem.category || 'Trabalho');
      } else {
        setTaskTitle('');
        setTaskDue(todayISO());
        setTaskPriority('Média');
        setTaskCategory('Trabalho');
      }
    } else if (type === 'event') {
      if (editItem) {
        setEventTitle(editItem.title || '');
        setEventDate(editItem.date || todayISO());
        setEventTime(editItem.time || '09:00');
        setEventCategory(editItem.category || 'Trabalho');
      } else {
        setEventTitle('');
        setEventDate(todayISO());
        setEventTime('09:00');
        setEventCategory('Trabalho');
      }
      setSyncToGcal(isGcalConnected);
    } else if (type === 'finance') {
      if (editItem) {
        setFinType(editItem.type || 'income');
        setFinDesc(editItem.description || '');
        setFinValue(editItem.value !== undefined ? String(editItem.value) : '');
        setFinDate(toISODate(editItem.date) || todayISO());
        setFinCategory(editItem.category || 'Trabalho');
        const s = (editItem.status || '').toLowerCase();
        setFinStatus(s === 'pending' || s === 'pendente' || s === 'a receber' ? 'pending' : 'paid');
      } else {
        setFinType('income');
        setFinDesc('');
        setFinValue('');
        setFinDate(todayISO());
        setFinCategory('Trabalho');
        setFinStatus('paid');
      }
    } else if (type === 'client') {
      if (editItem) {
        setClientName(editItem.clientName || '');
        setClientCompany(editItem.company || '');
        setClientProjectTitle(editItem.projectTitle || '');
        setClientValue(editItem.value !== undefined ? String(editItem.value) : '');
        setClientStatus(editItem.status || 'em_andamento');
        setClientDeadline(editItem.deadline || '');
        setClientContact(editItem.contact || '');
        setClientNotes(editItem.notes || '');
      } else {
        setClientName('');
        setClientCompany('');
        setClientProjectTitle('');
        setClientValue('');
        setClientStatus('em_andamento');
        setClientDeadline(new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10));
        setClientContact('');
        setClientNotes('');
      }
    } else if (type === 'invoice') {
      if (editItem) {
        setInvNumber(editItem.number || '');
        setInvClientName(editItem.clientName || '');
        setInvCnpjCpf(editItem.cnpjCpf || '');
        setInvDesc(editItem.description || '');
        setInvValue(editItem.value !== undefined ? String(editItem.value) : '');
        setInvTaxRate(editItem.taxRate !== undefined ? String(editItem.taxRate) : '6');
        setInvIssueDate(toISODate(editItem.issueDate) || todayISO());
        setInvDueDate(toISODate(editItem.dueDate) || '');
        setInvStatus(editItem.status || 'emitida');
        setInvNotes(editItem.notes || '');
        setInvSheetLink(editItem.sheetLink || '');
      } else {
        setInvNumber('');
        setInvClientName('');
        setInvCnpjCpf('');
        setInvDesc('');
        setInvValue('');
        setInvTaxRate('6');
        setInvIssueDate(todayISO());
        setInvDueDate(new Date(Date.now() + 86400000 * 15).toISOString().slice(0, 10));
        setInvStatus('emitida');
        setInvNotes('');
        setInvSheetLink('');
      }
    }
  }, [isOpen, type, editItem, isGcalConnected]);

  if (!isOpen || !type) return null;

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onSaveTask({
      id: editItem?.id,
      title: taskTitle.trim(),
      due: taskDue,
      priority: taskPriority,
      category: taskCategory,
      done: editItem ? editItem.done : false,
    });
    onClose();
  };

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    onSaveEvent(
      {
        id: editItem?.id,
        title: eventTitle.trim(),
        date: eventDate,
        time: eventTime,
        category: eventCategory,
        gcal_id: editItem?.gcal_id,
      },
      syncToGcal && isGcalConnected
    );
    onClose();
  };

  const handleSubmitFinance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finDesc.trim() || !finValue) return;
    onSaveFinance({
      id: editItem?.id,
      type: finType,
      description: finDesc.trim(),
      value: parseFloat(finValue) || 0,
      date: finDate,
      category: finCategory,
      status: finStatus,
    });
    onClose();
  };

  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientProjectTitle.trim()) return;
    onSaveClient({
      id: editItem?.id,
      clientName: clientName.trim(),
      company: clientCompany.trim(),
      projectTitle: clientProjectTitle.trim(),
      value: parseFloat(clientValue) || 0,
      status: clientStatus,
      deadline: clientDeadline,
      contact: clientContact.trim(),
      notes: clientNotes.trim(),
      createdAt: editItem?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClientName.trim() || !invDesc.trim()) return;
    const val = parseFloat(invValue) || 0;
    const tax = parseFloat(invTaxRate) || 0;
    const net = val > 0 ? val * (1 - tax / 100) : 0;

    if (onSaveInvoice) {
      onSaveInvoice({
        id: editItem?.id,
        number: invNumber.trim() || 'S/N',
        clientName: invClientName.trim(),
        cnpjCpf: invCnpjCpf.trim() || undefined,
        description: invDesc.trim(),
        value: val,
        taxRate: tax,
        netValue: Math.round(net * 100) / 100,
        issueDate: invIssueDate || todayISO(),
        dueDate: invDueDate || undefined,
        paymentDate: invStatus === 'paga' ? (editItem?.paymentDate || todayISO()) : undefined,
        status: invStatus,
        notes: invNotes.trim() || undefined,
        sheetLink: invSheetLink.trim() || undefined,
        createdAt: editItem?.createdAt || new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <div
      id="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-[#0a1622] border border-[#284258] rounded-2xl shadow-2xl p-6 text-[#eef5fb]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#183147]">
          <div className="flex items-center gap-2">
            {type === 'task' && <CheckSquare className="text-blue-400" size={18} />}
            {type === 'event' && <Calendar className="text-amber-400" size={18} />}
            {type === 'finance' && <DollarSign className="text-emerald-400" size={18} />}
            {type === 'client' && <Briefcase className="text-purple-400" size={18} />}
            {type === 'invoice' && <FileText className="text-blue-400" size={18} />}
            <h3 className="text-base font-bold text-white">
              {type === 'task' && (editItem ? 'Editar Tarefa' : 'Nova Tarefa')}
              {type === 'event' && (editItem ? 'Editar Compromisso' : 'Novo Compromisso')}
              {type === 'finance' && (editItem ? 'Editar Lançamento' : 'Novo Lançamento Financeiro')}
              {type === 'client' && (editItem ? 'Editar Projeto / Cliente' : 'Novo Projeto / Cliente')}
              {type === 'invoice' && (editItem ? 'Editar Nota Fiscal Emitida' : 'Nova Nota Fiscal Emitida')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8194a8] hover:text-white hover:bg-[#12273b] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        {/* Task Form */}
        {type === 'task' && (
          <form onSubmit={handleSubmitTask} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Título da Tarefa</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex.: Enviar proposta revisada para Cliente X"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Prazo</label>
                <input
                  type="date"
                  required
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Prioridade</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Categoria</label>
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value as Category)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                  <option value="Esporte">Esporte</option>
                  <option value="Família">Família</option>
                  <option value="Financeiro">Financeiro</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
              >
                Salvar Tarefa
              </button>
            </div>
          </form>
        )}

        {/* Event Form */}
        {type === 'event' && (
          <form onSubmit={handleSubmitEvent} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Título do Compromisso</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Ex.: Reunião de alinhamento com equipe"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Data</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Horário</label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  placeholder="09:00 ou Dia todo"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Categoria</label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as Category)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                  <option value="Esporte">Esporte</option>
                  <option value="Família">Família</option>
                  <option value="Financeiro">Financeiro</option>
                </select>
              </div>
            </div>

            {isGcalConnected && (
              <label className="flex items-center gap-2 text-[#b8cbe0] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={syncToGcal}
                  onChange={(e) => setSyncToGcal(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Sincronizar também com o Google Calendar</span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
              >
                Salvar Compromisso
              </button>
            </div>
          </form>
        )}

        {/* Finance Form */}
        {type === 'finance' && (
          <form onSubmit={handleSubmitFinance} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Tipo</label>
                <select
                  value={finType}
                  onChange={(e) => setFinType(e.target.value as FinanceType)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="income">Entrada / Receita</option>
                  <option value="expense">Despesa / Saída</option>
                </select>
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={finValue}
                  onChange={(e) => setFinValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Descrição</label>
              <input
                type="text"
                required
                value={finDesc}
                onChange={(e) => setFinDesc(e.target.value)}
                placeholder="Ex.: Cliente X — 2ª Parcela do Projeto"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Data</label>
                <input
                  type="date"
                  required
                  value={finDate}
                  onChange={(e) => setFinDate(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Categoria</label>
                <select
                  value={finCategory}
                  onChange={(e) => setFinCategory(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="Trabalho">Trabalho</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Esporte">Esporte</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Status</label>
                <select
                  value={finStatus}
                  onChange={(e) => setFinStatus(e.target.value as 'paid' | 'pending')}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="paid">{finType === 'income' ? 'Recebido' : 'Pago'}</option>
                  <option value="pending">{finType === 'income' ? 'A Receber' : 'Pendente'}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
              >
                Salvar Lançamento
              </button>
            </div>
          </form>
        )}

        {/* Client Form */}
        {type === 'client' && (
          <form onSubmit={handleSubmitClient} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Cliente / Pessoa de Contato</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex.: Lucas Mendes"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Empresa / Marca (Opcional)</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Ex.: Alpha Consultoria"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Nome do Projeto / Escopo</label>
              <input
                type="text"
                required
                value={clientProjectTitle}
                onChange={(e) => setClientProjectTitle(e.target.value)}
                placeholder="Ex.: Desenvolvimento de Website Institucional"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={clientValue}
                  onChange={(e) => setClientValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Etapa / Status</label>
                <select
                  value={clientStatus}
                  onChange={(e) => setClientStatus(e.target.value as ProjectStage)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="proposta">Proposta / Lead</option>
                  <option value="negociacao">Em Negociação</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="espera">Em Espera</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Prazo de Entrega</label>
                <input
                  type="date"
                  value={clientDeadline}
                  onChange={(e) => setClientDeadline(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Contato (E-mail / Telefone)</label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="Ex.: contato@empresa.com.br ou (11) 98765-4321"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Anotações / Observações</label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Detalhes do alinhamento, escopo, links de arquivos..."
                rows={3}
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
              >
                Salvar Projeto
              </button>
            </div>
          </form>
        )}

        {/* Invoice (NF) Form */}
        {type === 'invoice' && (
          <form onSubmit={handleSubmitInvoice} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Número da NF</label>
                <input
                  type="text"
                  required
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  placeholder="Ex.: 005 ou 2026/05"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#91a5b8] mb-1 font-medium">Status da NF</label>
                <select
                  value={invStatus}
                  onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                >
                  <option value="emitida">Emitida / A Receber (Pendente)</option>
                  <option value="paga">Paga / Liquidada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Cliente / Tomador</label>
                <input
                  type="text"
                  required
                  value={invClientName}
                  onChange={(e) => setInvClientName(e.target.value)}
                  placeholder="Ex.: Nexus Tech Logistics"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">CNPJ ou CPF (Opcional)</label>
                <input
                  type="text"
                  value={invCnpjCpf}
                  onChange={(e) => setInvCnpjCpf(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Descrição dos Serviços / Itens</label>
              <input
                type="text"
                required
                value={invDesc}
                onChange={(e) => setInvDesc(e.target.value)}
                placeholder="Ex.: Prestação de serviços de consultoria e desenvolvimento web"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Valor Bruto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={invValue}
                  onChange={(e) => setInvValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Impostos / Retenção (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={invTaxRate}
                  onChange={(e) => setInvTaxRate(e.target.value)}
                  placeholder="6.0"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Valor Líquido Est.</label>
                <div className="w-full bg-[#060e17] border border-[#1d3143] rounded-lg px-3 py-2 text-emerald-400 font-bold font-mono">
                  {invValue ? (
                    (parseFloat(invValue) * (1 - (parseFloat(invTaxRate) || 0) / 100)).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  ) : (
                    'R$ 0,00'
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Data de Emissão</label>
                <input
                  type="date"
                  required
                  value={invIssueDate}
                  onChange={(e) => setInvIssueDate(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Data de Vencimento</label>
                <input
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Link do Documento / Planilha / Drive (Opcional)</label>
              <input
                type="url"
                value={invSheetLink}
                onChange={(e) => setInvSheetLink(e.target.value)}
                placeholder="https://drive.google.com/... ou link da nota fiscal"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Observações / Chave da Nota</label>
              <textarea
                value={invNotes}
                onChange={(e) => setInvNotes(e.target.value)}
                placeholder="Instruções de pagamento, chave de acesso de 44 dígitos, banco..."
                rows={2}
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20"
              >
                Salvar Nota Fiscal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
