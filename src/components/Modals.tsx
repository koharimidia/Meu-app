import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, FinanceItem, ClientProject, InvoiceNF, InvoiceStatus, Priority, Category, FinanceType, ProjectStage } from '../types';
import { todayISO, toISODate, formatDateBR } from '../lib/formatters';
import { X, CheckSquare, Calendar, DollarSign, Briefcase, FileText, Sparkles, UploadCloud, Loader2, CheckCircle2, AlertCircle, HardDrive, RefreshCw, GraduationCap, BookOpen, HeartHandshake } from 'lucide-react';
import { extractInvoiceFromFile, ExtractedInvoiceData } from '../lib/invoiceReader';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { DriveFile } from '../lib/googleDrive';

function addMonthsToDate(baseDateStr: string, monthsToAdd: number): string {
  const parts = baseDateStr.split('-');
  if (parts.length !== 3) return baseDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const target = new Date(year, month + monthsToAdd, 1);
  const maxDays = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(day, maxDays);

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(clampedDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface ModalsProps {
  isOpen: boolean;
  type: 'task' | 'event' | 'finance' | 'client' | 'invoice' | 'course' | null;
  editItem: any | null;
  onClose: () => void;
  onSaveTask: (task: Partial<Task>) => void;
  onSaveEvent: (event: Partial<CalendarEvent>, syncToGcal: boolean) => void;
  onSaveFinance: (finance: Partial<FinanceItem>, recurringBatch?: Partial<FinanceItem>[]) => void;
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
  // Tabs within finance / course modal
  const [financeTab, setFinanceTab] = useState<'general' | 'course'>('general');

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

  // Finance form state (Lançamento Geral)
  const [finType, setFinType] = useState<FinanceType>('income');
  const [finDesc, setFinDesc] = useState('');
  const [finValue, setFinValue] = useState('');
  const [finDate, setFinDate] = useState(todayISO());
  const [finCategory, setFinCategory] = useState('Trabalho');
  const [finStatus, setFinStatus] = useState<'paid' | 'pending'>('paid');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringMonths, setRecurringMonths] = useState(12);

  // Course form state (Aba de Cursos)
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePlatform, setCoursePlatform] = useState('');
  const [courseArea, setCourseArea] = useState('Tecnologia & Inovação');
  const [courseValue, setCourseValue] = useState('');
  const [courseDate, setCourseDate] = useState(todayISO());
  const [coursePaymentStatus, setCoursePaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [courseProgressStatus, setCourseProgressStatus] = useState<'em_andamento' | 'concluido' | 'desejado'>('em_andamento');
  const [courseLink, setCourseLink] = useState('');
  const [isCourseRecurring, setIsCourseRecurring] = useState(false);
  const [courseMonths, setCourseMonths] = useState(12);
  const [createStudyTask, setCreateStudyTask] = useState(true);

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

  // AI Invoice Extraction State
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedFileName, setAnalyzedFileName] = useState<string | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  const handleInvoiceExtractedFromDrive = (data: ExtractedInvoiceData, driveFile: DriveFile) => {
    if (data.number) setInvNumber(data.number);
    if (data.clientName) setInvClientName(data.clientName);
    if (data.cnpjCpf) setInvCnpjCpf(data.cnpjCpf);
    if (data.description) setInvDesc(data.description);
    if (data.value !== undefined && data.value !== null) setInvValue(String(data.value));
    if (data.taxRate !== undefined && data.taxRate !== null) setInvTaxRate(String(data.taxRate));
    if (data.issueDate) setInvIssueDate(data.issueDate);
    if (data.dueDate) setInvDueDate(data.dueDate);
    if (data.notes) setInvNotes(data.notes);
    if (driveFile.webViewLink) setInvSheetLink(driveFile.webViewLink);
    setAnalyzedFileName(driveFile.name);
    setAnalysisSuccess(data.confidenceSummary || `Arquivo ${driveFile.name} do Google Drive processado com sucesso!`);
  };

  // Pre-fill on edit
  useEffect(() => {
    if (!isOpen) return;

    // Reset AI state whenever modal opens or closes
    setIsAnalyzingPdf(false);
    setAnalysisSuccess(null);
    setAnalysisError(null);
    setAnalyzedFileName(null);
    setIsDraggingPdf(false);

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
    } else if (type === 'course') {
      setFinanceTab('course');
      if (editItem) {
        let title = editItem.description || '';
        if (title.startsWith('Curso: ')) {
          title = title.slice(7);
          const parenIdx = title.lastIndexOf('(');
          if (parenIdx !== -1 && title.endsWith(')')) {
            title = title.slice(0, parenIdx).trim();
          }
        }
        setCourseTitle(title);
        setCoursePlatform(editItem.course_platform || '');
        setCourseArea(editItem.course_area || 'Tecnologia & Inovação');
        setCourseValue(editItem.value !== undefined ? String(editItem.value) : '');
        setCourseDate(toISODate(editItem.date) || todayISO());
        const s = (editItem.status || '').toLowerCase();
        setCoursePaymentStatus(s === 'pending' || s === 'pendente' || s === 'a receber' ? 'pending' : 'paid');
        setCourseProgressStatus(editItem.course_status || 'em_andamento');
        setCourseLink(editItem.course_link || '');
        setIsCourseRecurring(!!editItem.is_recurring);
        setCourseMonths(editItem.recurrence_months || 12);
        setCreateStudyTask(false);
      } else {
        setCourseTitle('');
        setCoursePlatform('');
        setCourseArea('Tecnologia & Inovação');
        setCourseValue('');
        setCourseDate(todayISO());
        setCoursePaymentStatus('paid');
        setCourseProgressStatus('em_andamento');
        setCourseLink('');
        setIsCourseRecurring(false);
        setCourseMonths(12);
        setCreateStudyTask(true);
      }
    } else if (type === 'finance') {
      setFinanceTab('general');
      if (editItem) {
        setFinType(editItem.type || 'income');
        setFinDesc(editItem.description || '');
        setFinValue(editItem.value !== undefined ? String(editItem.value) : '');
        setFinDate(toISODate(editItem.date) || todayISO());
        setFinCategory(editItem.category || 'Custos de Trabalho');
        const s = (editItem.status || '').toLowerCase();
        setFinStatus(s === 'pending' || s === 'pendente' || s === 'a receber' ? 'pending' : 'paid');
        setIsRecurring(!!editItem.is_recurring);
        setRecurringMonths(editItem.recurrence_months || 12);
        setCoursePlatform(editItem.course_platform || '');
      } else {
        setFinType('expense');
        setFinDesc('');
        setFinValue('');
        setFinDate(todayISO());
        setFinCategory('Custos de Trabalho');
        setFinStatus('paid');
        setIsRecurring(false);
        setRecurringMonths(12);
        setCoursePlatform('');

        // Pre-initialize course fields as well
        setCourseTitle('');
        setCourseArea('Tecnologia & Inovação');
        setCourseValue('');
        setCourseDate(todayISO());
        setCoursePaymentStatus('paid');
        setCourseProgressStatus('em_andamento');
        setCourseLink('');
        setIsCourseRecurring(false);
        setCourseMonths(12);
        setCreateStudyTask(true);
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
    const numValue = parseFloat(finValue) || 0;
    const baseDate = finDate || todayISO();
    const isCourse = finCategory === 'Cursos';

    if (!editItem && isRecurring && recurringMonths > 1) {
      // Generate recurring series of monthly expenses
      const groupId = `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const batch: Partial<FinanceItem>[] = [];

      for (let i = 0; i < recurringMonths; i++) {
        const itemDate = addMonthsToDate(baseDate, i);
        batch.push({
          id: `fin-rec-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
          type: finType,
          description: `${finDesc.trim()} (${i + 1}/${recurringMonths})`,
          value: numValue,
          date: itemDate,
          category: finCategory,
          status: i === 0 ? finStatus : 'pending',
          is_recurring: true,
          recurrence_type: 'monthly',
          recurrence_months: recurringMonths,
          installment_current: i + 1,
          installment_total: recurringMonths,
          recurrence_group_id: groupId,
          is_course: isCourse,
          course_platform: isCourse && coursePlatform.trim() ? coursePlatform.trim() : undefined,
        });
      }

      onSaveFinance(batch[0], batch);
    } else {
      onSaveFinance({
        id: editItem?.id,
        type: finType,
        description: finDesc.trim(),
        value: numValue,
        date: baseDate,
        category: finCategory,
        status: finStatus,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? 'monthly' : undefined,
        recurrence_months: isRecurring ? recurringMonths : undefined,
        installment_current: editItem?.installment_current,
        installment_total: editItem?.installment_total,
        recurrence_group_id: editItem?.recurrence_group_id,
        is_course: isCourse,
        course_platform: isCourse && coursePlatform.trim() ? coursePlatform.trim() : undefined,
      });
    }

    onClose();
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseValue) return;
    const numValue = parseFloat(courseValue) || 0;
    const baseDate = courseDate || todayISO();
    const fullDesc = `Curso: ${courseTitle.trim()}${coursePlatform.trim() ? ` (${coursePlatform.trim()})` : ''}`;

    if (!editItem && isCourseRecurring && courseMonths > 1) {
      const groupId = `course-rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const batch: Partial<FinanceItem>[] = [];

      for (let i = 0; i < courseMonths; i++) {
        const itemDate = addMonthsToDate(baseDate, i);
        batch.push({
          id: `fin-course-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
          type: 'expense',
          description: `${fullDesc} (${i + 1}/${courseMonths})`,
          value: numValue,
          date: itemDate,
          category: 'Cursos',
          status: i === 0 ? coursePaymentStatus : 'pending',
          is_recurring: true,
          recurrence_type: 'monthly',
          recurrence_months: courseMonths,
          installment_current: i + 1,
          installment_total: courseMonths,
          recurrence_group_id: groupId,
          is_course: true,
          course_platform: coursePlatform.trim(),
          course_status: courseProgressStatus,
          course_link: courseLink.trim(),
          course_area: courseArea,
        });
      }

      onSaveFinance(batch[0], batch);
    } else {
      onSaveFinance({
        id: editItem?.id,
        type: 'expense',
        description: fullDesc,
        value: numValue,
        date: baseDate,
        category: 'Cursos',
        status: coursePaymentStatus,
        is_recurring: isCourseRecurring,
        recurrence_type: isCourseRecurring ? 'monthly' : undefined,
        recurrence_months: isCourseRecurring ? courseMonths : undefined,
        installment_current: editItem?.installment_current,
        installment_total: editItem?.installment_total,
        recurrence_group_id: editItem?.recurrence_group_id,
        is_course: true,
        course_platform: coursePlatform.trim(),
        course_status: courseProgressStatus,
        course_link: courseLink.trim(),
        course_area: courseArea,
      });
    }

    if (!editItem && createStudyTask && courseTitle.trim()) {
      onSaveTask({
        title: `Estudar: ${courseTitle.trim()}`,
        due: baseDate,
        priority: 'Média',
        category: 'Cursos',
        done: false,
      });
    }

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

  const handleProcessInvoiceFile = async (file: File) => {
    try {
      setIsAnalyzingPdf(true);
      setAnalysisError(null);
      setAnalysisSuccess(null);
      setAnalyzedFileName(file.name);

      const res = await extractInvoiceFromFile(file);
      if (res.success && res.data) {
        const d = res.data;
        if (d.number) setInvNumber(d.number);
        if (d.clientName) setInvClientName(d.clientName);
        if (d.cnpjCpf) setInvCnpjCpf(d.cnpjCpf);
        if (d.description) setInvDesc(d.description);
        if (d.value !== undefined && d.value !== null) setInvValue(String(d.value));
        if (d.taxRate !== undefined && d.taxRate !== null) setInvTaxRate(String(d.taxRate));
        if (d.issueDate) setInvIssueDate(d.issueDate);
        if (d.dueDate) setInvDueDate(d.dueDate);
        if (d.notes) setInvNotes(d.notes);
        setAnalysisSuccess(d.confidenceSummary || 'Dados fiscais extraídos com sucesso pelo Gemini!');
      }
    } catch (err: any) {
      console.error('Invoice extraction error:', err);
      setAnalysisError(err?.message || 'Erro ao processar o arquivo. Verifique o formato ou tente novamente.');
    } finally {
      setIsAnalyzingPdf(false);
    }
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
            {type === 'finance' && <DollarSign className="text-emerald-400" size={18} />}
            {type === 'course' && <GraduationCap className="text-cyan-400" size={18} />}
            {type === 'client' && <Briefcase className="text-purple-400" size={18} />}
            {type === 'invoice' && <FileText className="text-blue-400" size={18} />}
            <h3 className="text-base font-bold text-white">
              {type === 'task' && (editItem ? 'Editar Tarefa' : 'Nova Tarefa')}
              {type === 'event' && (editItem ? 'Editar Compromisso' : 'Novo Compromisso')}
              {type === 'finance' && (editItem ? 'Editar Lançamento' : 'Novo Lançamento Financeiro')}
              {type === 'course' && (editItem ? 'Editar Curso & Treinamento' : 'Novo Curso & Treinamento')}
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

        {/* Finance Form (Lançamento Geral) */}
        {(type === 'finance' || type === 'course') && financeTab === 'general' && (
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

            {/* Categoria com Abas Rápidas: Doação, Custos de Trabalho, Cursos, e Outras */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[#91a5b8] font-medium text-xs">
                  Categoria:{' '}
                  <span className="text-white font-semibold">
                    {finCategory === 'Custos de Trabalho' ? 'Custos de Trabalho' : finCategory}
                  </span>
                </label>
                <span className="text-[10px] text-[#698298]">Abas de seleção rápida</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {/* Aba Doação */}
                <button
                  type="button"
                  id="cat-tab-doacao"
                  onClick={() => {
                    setFinCategory('Doação');
                    setFinType('expense');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    finCategory === 'Doação'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-md shadow-pink-600/30 font-bold'
                      : 'bg-[#07131f] text-[#9eb2c5] border-[#1f374d] hover:bg-[#0d2235] hover:text-white'
                  }`}
                >
                  <HeartHandshake size={14} className={finCategory === 'Doação' ? 'text-white' : 'text-pink-400'} />
                  <span>Doação</span>
                </button>

                {/* Aba Custos de Trabalho */}
                <button
                  type="button"
                  id="cat-tab-custos-trabalho"
                  onClick={() => {
                    setFinCategory('Custos de Trabalho');
                    setFinType('expense');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    finCategory === 'Custos de Trabalho'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 font-bold'
                      : 'bg-[#07131f] text-[#9eb2c5] border-[#1f374d] hover:bg-[#0d2235] hover:text-white'
                  }`}
                >
                  <Briefcase size={14} className={finCategory === 'Custos de Trabalho' ? 'text-white' : 'text-indigo-400'} />
                  <span className="truncate">Custos Trabalho</span>
                </button>

                {/* Aba Cursos */}
                <button
                  type="button"
                  id="cat-tab-cursos"
                  onClick={() => {
                    setFinCategory('Cursos');
                    setFinType('expense');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    finCategory === 'Cursos'
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 font-bold'
                      : 'bg-[#07131f] text-[#9eb2c5] border-[#1f374d] hover:bg-[#0d2235] hover:text-white'
                  }`}
                >
                  <GraduationCap size={14} className={finCategory === 'Cursos' ? 'text-white' : 'text-cyan-400'} />
                  <span>Cursos</span>
                </button>

                {/* Seletor Outras Categorias */}
                <div className="relative">
                  <select
                    value={['Doação', 'Custos de Trabalho', 'Cursos'].includes(finCategory) ? '' : finCategory}
                    onChange={(e) => {
                      if (e.target.value) {
                        setFinCategory(e.target.value);
                      }
                    }}
                    className={`w-full h-full py-2 px-2 rounded-xl text-xs font-semibold border outline-none transition-all cursor-pointer ${
                      !['Doação', 'Custos de Trabalho', 'Cursos'].includes(finCategory)
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 font-bold'
                        : 'bg-[#07131f] text-[#8194a8] border-[#1f374d] hover:bg-[#0d2235] hover:text-white'
                    }`}
                  >
                    <option value="" disabled className="bg-[#0a1622] text-[#8194a8]">
                      + Outras...
                    </option>
                    <option value="Trabalho" className="bg-[#0a1622] text-white">Trabalho (Geral / Job)</option>
                    <option value="Alimentação" className="bg-[#0a1622] text-white">Alimentação</option>
                    <option value="Transporte" className="bg-[#0a1622] text-white">Transporte</option>
                    <option value="Moradia" className="bg-[#0a1622] text-white">Moradia</option>
                    <option value="Esporte" className="bg-[#0a1622] text-white">Esporte</option>
                    <option value="Lazer" className="bg-[#0a1622] text-white">Lazer</option>
                    <option value="Pessoal" className="bg-[#0a1622] text-white">Pessoal</option>
                    <option value="Financeiro" className="bg-[#0a1622] text-white">Financeiro</option>
                    <option value="Outros" className="bg-[#0a1622] text-white">Outros</option>
                  </select>
                </div>
              </div>

              {/* Sugestões e campos contextuais para Doação */}
              {finCategory === 'Doação' && (
                <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/25 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-[10px] text-pink-300 font-semibold flex items-center gap-1">
                    <HeartHandshake size={11} /> Sugestões para Doação:
                  </span>
                  {['Dízimo / Oferta', 'Ação Social Beneficente', 'Doação de Apoio', 'Caridade Familiar'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFinDesc(tag)}
                      className="px-2 py-0.5 rounded text-[10px] bg-pink-500/20 hover:bg-pink-500/35 text-pink-200 border border-pink-500/30 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Sugestões para Custos de Trabalho */}
              {finCategory === 'Custos de Trabalho' && (
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1">
                    <Briefcase size={11} /> Sugestões de Custos:
                  </span>
                  {['Equipamentos & Drone', 'Softwares & Licenças', 'Diárias & Equipe', 'Combustível / Job', 'Aluguel de Estúdio'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFinDesc(tag)}
                      className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-200 border border-indigo-500/30 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Sugestões e campo opcional de plataforma para Cursos */}
              {finCategory === 'Cursos' && (
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 space-y-2 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                      <GraduationCap size={11} /> Sugestões de Curso:
                    </span>
                    {['Especialização em Drones', 'Treinamento Audiovisual', 'Edição & Pós-Produção', 'Gestão & Negócios'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setFinDesc(tag)}
                        className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-500/30 transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-cyan-500/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label className="text-[11px] text-cyan-200/90 font-medium whitespace-nowrap">
                      Plataforma / Instituição (opcional):
                    </label>
                    <input
                      type="text"
                      value={coursePlatform}
                      onChange={(e) => setCoursePlatform(e.target.value)}
                      placeholder="Ex.: Hotmart, Alura, Udemy, Presencial..."
                      className="flex-1 bg-[#07121d] border border-cyan-500/30 rounded-lg px-2.5 py-1 text-xs text-[#eef5fb] focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Opção de Despesa Recorrente Mensal */}
            <div className="p-3.5 rounded-xl bg-[#07131f] border border-[#1b344d] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="checkbox-recurring-expense"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-[#243b50] bg-[#0c1c2a] text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-blue-400" />
                    Despesa Recorrente Mensal (Fixa / Assinatura)
                  </span>
                </label>
                {isRecurring && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    Recorrência Ativa
                  </span>
                )}
              </div>

              {isRecurring && (
                <div className="pt-2 border-t border-[#14283a] space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[11px] text-[#91a5b8] font-medium">Repetir mensalmente por:</label>
                    <select
                      value={recurringMonths}
                      onChange={(e) => setRecurringMonths(Number(e.target.value))}
                      className="bg-[#0c1c2a] border border-[#243b50] text-[#eef5fb] rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses (Semestral)</option>
                      <option value={12}>12 meses (1 ano inteiro)</option>
                      <option value={24}>24 meses (2 anos)</option>
                      <option value={36}>36 meses (3 anos)</option>
                    </select>
                  </div>

                  <div className="p-2 rounded-lg bg-[#0b1e30] border border-[#1b3e5e] text-[11px] text-blue-200/90 leading-relaxed">
                    📅 Serão programados automaticamente <strong>{recurringMonths} lançamentos mensais</strong> (todo dia {finDate ? finDate.slice(8, 10) : 'XX'} a partir de {formatDateBR(finDate)}).
                    {!editItem && ' O 1º mês é salvo com o status selecionado e os demais como Pendente para acompanhamento.'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Salvar Lançamento
              </button>
            </div>
          </form>
        )}

        {/* Course Form (Aba de Cursos) */}
        {(type === 'course' || (type === 'finance' && financeTab === 'course')) && (
          <form onSubmit={handleSubmitCourse} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Nome / Título do Curso</label>
              <input
                type="text"
                required
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Ex.: Especialização em Drones e Imagens Aéreas"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#91a5b8] font-medium">Instituição / Plataforma de Ensino</label>
                <span className="text-[10px] text-[#698298]">Sugestões rápidas</span>
              </div>
              <input
                type="text"
                value={coursePlatform}
                onChange={(e) => setCoursePlatform(e.target.value)}
                placeholder="Ex.: Hotmart, Alura, Udemy, EBAC, Presencial..."
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Hotmart', 'Alura', 'Udemy', 'EBAC', 'Coursera', 'YouTube', 'Presencial'].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setCoursePlatform(plat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      coursePlatform === plat
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-[#0e2133] hover:bg-[#16334f] text-[#8ea7be] border border-[#1b3a56]'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Investimento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={courseValue}
                  onChange={(e) => setCourseValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Data Início / Matrícula</label>
                <input
                  type="date"
                  required
                  value={courseDate}
                  onChange={(e) => setCourseDate(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Status do Pagamento</label>
                <select
                  value={coursePaymentStatus}
                  onChange={(e) => setCoursePaymentStatus(e.target.value as 'paid' | 'pending')}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none"
                >
                  <option value="paid">Pago / Quitado</option>
                  <option value="pending">A Pagar (Pendente)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Área de Conhecimento</label>
                <select
                  value={courseArea}
                  onChange={(e) => setCourseArea(e.target.value)}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none"
                >
                  <option value="Tecnologia & Inovação">Tecnologia & Inovação</option>
                  <option value="Drones, Imagens & Audiovisual">Drones, Imagens & Audiovisual</option>
                  <option value="Gestão, Finanças & Negócios">Gestão, Finanças & Negócios</option>
                  <option value="Marketing & Vendas">Marketing & Vendas</option>
                  <option value="Idiomas & Comunicação">Idiomas & Comunicação</option>
                  <option value="Desenvolvimento Pessoal">Desenvolvimento Pessoal</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-[#91a5b8] mb-1 font-medium">Progresso / Status do Curso</label>
                <select
                  value={courseProgressStatus}
                  onChange={(e) => setCourseProgressStatus(e.target.value as 'em_andamento' | 'concluido' | 'desejado')}
                  className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none"
                >
                  <option value="em_andamento">⏳ Em Andamento</option>
                  <option value="concluido">✅ Concluído</option>
                  <option value="desejado">🎯 Lista de Desejos / Futuro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#91a5b8] mb-1 font-medium">Link das Aulas / Plataforma (Opcional)</label>
              <input
                type="url"
                value={courseLink}
                onChange={(e) => setCourseLink(e.target.value)}
                placeholder="https://exemplo.com.br/meus-cursos"
                className="w-full bg-[#07121d] border border-[#243b50] rounded-lg px-3 py-2 text-[#eef5fb] focus:border-cyan-500 outline-none text-xs"
              />
            </div>

            {/* Recorrência / Parcelamento do Curso */}
            <div className="p-3.5 rounded-xl bg-[#07131f] border border-[#1b344d] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="checkbox-course-recurring"
                    checked={isCourseRecurring}
                    onChange={(e) => setIsCourseRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-[#243b50] bg-[#0c1c2a] text-cyan-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-cyan-400" />
                    Parcelamento / Mensalidade Recorrente
                  </span>
                </label>
                {isCourseRecurring && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    Parcelamento Ativo
                  </span>
                )}
              </div>

              {isCourseRecurring && (
                <div className="pt-2 border-t border-[#14283a] space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[11px] text-[#91a5b8] font-medium">Quantidade de parcelas/meses:</label>
                    <select
                      value={courseMonths}
                      onChange={(e) => setCourseMonths(Number(e.target.value))}
                      className="bg-[#0c1c2a] border border-[#243b50] text-[#eef5fb] rounded-lg px-2.5 py-1 text-xs outline-none focus:border-cyan-500 font-semibold"
                    >
                      <option value={3}>3 parcelas (Trimestral)</option>
                      <option value={6}>6 parcelas (Semestral)</option>
                      <option value={10}>10 parcelas</option>
                      <option value={12}>12 parcelas (1 ano)</option>
                      <option value={24}>24 parcelas (2 anos)</option>
                    </select>
                  </div>

                  <div className="p-2 rounded-lg bg-[#0b1e30] border border-[#1b3e5e] text-[11px] text-cyan-200/90 leading-relaxed">
                    📅 Serão programados <strong>{courseMonths} lançamentos mensais de R$ {courseValue || '0,00'}</strong> em Finanças com a categoria <strong>Cursos</strong>.
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox Criar Tarefa de Estudo */}
            {!editItem && (
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#07131f] border border-[#173046] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createStudyTask}
                  onChange={(e) => setCreateStudyTask(e.target.checked)}
                  className="w-4 h-4 rounded border-[#243b50] bg-[#0c1c2a] text-cyan-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-[#c2d7ea] flex items-center gap-1.5">
                  <BookOpen size={13} className="text-cyan-400" />
                  <span>Criar tarefa de estudo na lista de tarefas automaticamente</span>
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#183147]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#102233] hover:bg-[#16304a] text-[#b8cbe0] border border-[#28445b] font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-600/25 flex items-center gap-1.5 cursor-pointer"
              >
                <GraduationCap size={15} />
                <span>Salvar Curso</span>
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
            {/* AI Document Upload / Reader Banner */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPdf(true);
              }}
              onDragLeave={() => setIsDraggingPdf(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPdf(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessInvoiceFile(file);
              }}
              className={`relative rounded-xl border transition-all p-3.5 ${
                isAnalyzingPdf
                  ? 'bg-[#091a2a] border-cyan-500/50'
                  : analysisSuccess
                  ? 'bg-[#071d18] border-emerald-500/40'
                  : isDraggingPdf
                  ? 'bg-[#0c2236] border-blue-400 shadow-lg shadow-blue-500/20'
                  : 'bg-[#081522] border-dashed border-[#1f384f] hover:border-cyan-500/50'
              }`}
            >
              {isAnalyzingPdf ? (
                <div className="flex items-center gap-3 py-1 text-cyan-300">
                  <Loader2 size={20} className="animate-spin text-cyan-400 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>Lendo documento fiscal com Gemini IA...</span>
                      <Sparkles size={13} className="text-cyan-400 animate-pulse" />
                    </p>
                    <p className="text-[11px] text-cyan-200/80">
                      Identificando número da NF, tomador, CNPJ, serviços prestados, valores e vencimento.
                    </p>
                  </div>
                </div>
              ) : analysisSuccess ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>Dados preenchidos automaticamente pelo PDF!</span>
                    </div>
                    <label className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-medium">
                      Subir outro arquivo
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessInvoiceFile(file);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-[#9bb0c4] leading-relaxed">
                    <strong className="text-white">{analyzedFileName}:</strong> {analysisSuccess}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Leitura Automática de PDF da NF com IA</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Gemini
                        </span>
                      </p>
                      <p className="text-[11px] text-[#8194a8]">
                        Arraste o PDF da sua nota fiscal (NFS-e / DANFE) para preencher todos os campos.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsDriveModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all shadow-sm"
                    >
                      <HardDrive size={14} />
                      <span>Google Drive (nf-app)</span>
                    </button>

                    <label className="px-3 py-1.5 rounded-lg bg-[#10273c] hover:bg-[#163550] text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors">
                      <UploadCloud size={14} />
                      <span>Selecionar PDF</span>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleProcessInvoiceFile(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {analysisError && (
                <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-center gap-1.5 text-[11px] text-rose-400">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}
            </div>

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
      {/* Google Drive Picker inside Modal */}
      <GoogleDrivePickerModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onInvoiceExtracted={handleInvoiceExtractedFromDrive}
      />
    </div>
  );
};
