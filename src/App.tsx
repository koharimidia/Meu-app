import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  CalendarEvent,
  FinanceItem,
  ClientProject,
  InvoiceNF,
  InvoiceStatus,
  NavView,
  Priority,
  Category,
  ProjectStage,
} from './types';
import {
  fetchAllData,
  saveTask,
  deleteTask,
  saveEvent,
  deleteEvent,
  saveFinance,
  deleteFinance,
  saveClient,
  deleteClient,
  saveInvoice,
  deleteInvoice,
  setLocal,
} from './lib/supabase';
import { fetchSheetExpenses, SheetFetchResult } from './lib/googleSheets';
import {
  initGoogleApis,
  requestCalendarAuth,
  addEventToGoogleCalendarRemote,
} from './lib/googleCalendar';
import { TopBar } from './components/TopBar';
import { HomeView } from './components/HomeView';
import { AgendaView } from './components/AgendaView';
import { TasksView } from './components/TasksView';
import { FinanceView } from './components/FinanceView';
import { InvoicesView } from './components/InvoicesView';
import { WorkView } from './components/WorkView';
import { Modals } from './components/Modals';
import { Toast } from './components/Toast';
import { todayISO, formatMoney } from './lib/formatters';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('home');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [finance, setFinance] = useState<FinanceItem[]>([]);
  const [clients, setClients] = useState<ClientProject[]>([]);
  const [invoices, setInvoices] = useState<InvoiceNF[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isGcalConnected, setIsGcalConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingGcal, setIsSyncingGcal] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [agendaDateFilter, setAgendaDateFilter] = useState('');

  const [sheetData, setSheetData] = useState<SheetFetchResult>({
    points: [],
    total: 0,
    avg: 0,
    highest: { date: '', amount: 0 },
    statusMessage: 'Carregando dados da planilha...',
    isRealData: false,
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'task' | 'event' | 'finance' | 'client' | 'invoice' | null;
    editItem: any;
  }>({
    isOpen: false,
    type: null,
    editItem: null,
  });

  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' | 'info' }>({
    message: null,
    type: 'success',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { message: null, type: 'success' } : prev));
    }, 2800);
  }, []);

  // Initial data loading
  const loadAppData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await fetchAllData();
      setTasks(data.tasks);
      setEvents(data.events);
      setFinance(data.finance);
      setClients(data.clients);
      setInvoices(data.invoices || []);
      setIsSupabaseConnected(data.isConnected);
    } catch (err) {
      console.warn('Error loading initial app data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const loadSheets = useCallback(async () => {
    setIsSheetLoading(true);
    try {
      const res = await fetchSheetExpenses();
      setSheetData(res);
    } catch (err) {
      console.warn('Error loading sheet data:', err);
    } finally {
      setIsSheetLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();
    loadSheets();
    initGoogleApis();
  }, [loadAppData, loadSheets]);

  // Task Handlers
  const handleToggleTask = async (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(updated);
    setLocal('tasks', updated);
    const target = updated.find((t) => t.id === id);
    if (target) {
      await saveTask(target);
      showToast(target.done ? 'Tarefa marcada como concluída ✓' : 'Tarefa reaberta');
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    const isEdit = !!taskData.id;
    const newTask: Task = {
      id: taskData.id || `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: taskData.title || 'Sem título',
      due: taskData.due || todayISO(),
      priority: taskData.priority || 'Média',
      category: taskData.category || 'Trabalho',
      done: taskData.done || false,
    };

    const nextTasks = isEdit
      ? tasks.map((t) => (t.id === newTask.id ? newTask : t))
      : [newTask, ...tasks];

    setTasks(nextTasks);
    setLocal('tasks', nextTasks);
    await saveTask(newTask);
    showToast(isEdit ? 'Tarefa atualizada ✓' : 'Tarefa criada com sucesso ✓');
  };

  const handleDeleteTask = async (id: string) => {
    const nextTasks = tasks.filter((t) => t.id !== id);
    setTasks(nextTasks);
    setLocal('tasks', nextTasks);
    await deleteTask(id);
    showToast('Tarefa excluída');
  };

  const handleQuickAddTask = async (title: string, priority: Priority, category: Category, due: string) => {
    const newTask: Task = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      due,
      priority,
      category,
      done: false,
    };
    const nextTasks = [newTask, ...tasks];
    setTasks(nextTasks);
    setLocal('tasks', nextTasks);
    await saveTask(newTask);
    showToast('Tarefa adicionada ✓');
  };

  // Event Handlers
  const handleSaveEvent = async (eventData: Partial<CalendarEvent>, syncGcal: boolean) => {
    const isEdit = !!eventData.id;
    let gcalId = eventData.gcal_id;

    const newEvent: CalendarEvent = {
      id: eventData.id || `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: eventData.title || 'Sem título',
      date: eventData.date || todayISO(),
      time: eventData.time || '09:00',
      category: eventData.category || 'Trabalho',
      description: eventData.description,
      gcal_id: gcalId,
    };

    if (syncGcal && isGcalConnected && !gcalId) {
      try {
        const remoteId = await addEventToGoogleCalendarRemote(newEvent);
        if (remoteId) {
          newEvent.gcal_id = remoteId;
        }
      } catch (err) {
        console.warn('Erro ao sincronizar com Google Agenda:', err);
      }
    }

    const nextEvents = isEdit
      ? events.map((e) => (e.id === newEvent.id ? newEvent : e))
      : [...events, newEvent];

    setEvents(nextEvents);
    setLocal('events', nextEvents);
    await saveEvent(newEvent);
    showToast(isEdit ? 'Compromisso atualizado ✓' : 'Compromisso agendado com sucesso ✓');
  };

  const handleDeleteEvent = async (id: string) => {
    const nextEvents = events.filter((e) => e.id !== id);
    setEvents(nextEvents);
    setLocal('events', nextEvents);
    await deleteEvent(id);
    showToast('Compromisso excluído');
  };

  const handleConnectGcal = () => {
    setIsSyncingGcal(true);
    requestCalendarAuth(
      async (gcalEvents) => {
        setIsGcalConnected(true);
        setIsSyncingGcal(false);

        // Merge with existing events avoiding duplicates
        const existingIds = new Set(events.map((e) => e.gcal_id || e.id));
        const newOnes = gcalEvents.filter((ge) => !existingIds.has(ge.gcal_id));

        const merged = [...events, ...newOnes];
        setEvents(merged);
        setLocal('events', merged);

        // Save new events to Supabase in background
        for (const ne of newOnes) {
          saveEvent(ne);
        }

        showToast(`Google Agenda conectado! ${newOnes.length} novos eventos sincronizados ✓`);
      },
      (errorMsg) => {
        setIsSyncingGcal(false);
        showToast(String(errorMsg || 'Erro na conexão com Google Agenda'), 'error');
      }
    );
  };

  // Finance Handlers
  const handleSaveFinance = async (finData: Partial<FinanceItem>) => {
    const isEdit = !!finData.id;
    const newItem: FinanceItem = {
      id: finData.id || `fin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      type: finData.type || 'income',
      description: finData.description || 'Lançamento',
      value: finData.value || 0,
      date: finData.date || todayISO(),
      category: finData.category || 'Trabalho',
      status: finData.status || 'paid',
    };

    const nextFinance = isEdit
      ? finance.map((f) => (f.id === newItem.id ? newItem : f))
      : [newItem, ...finance];

    setFinance(nextFinance);
    setLocal('finance', nextFinance);
    await saveFinance(newItem);
    showToast(isEdit ? 'Lançamento financeiro atualizado ✓' : 'Lançamento salvo ✓');
  };

  const handleDeleteFinance = async (id: string) => {
    const nextFinance = finance.filter((f) => f.id !== id);
    setFinance(nextFinance);
    setLocal('finance', nextFinance);
    await deleteFinance(id);
    showToast('Lançamento excluído');
  };

  // Client & Project Handlers
  const handleSaveClient = async (clientData: Partial<ClientProject>) => {
    const isEdit = !!clientData.id;
    const newClient: ClientProject = {
      id: clientData.id || `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      clientName: clientData.clientName || 'Cliente',
      company: clientData.company || '',
      projectTitle: clientData.projectTitle || 'Projeto',
      value: clientData.value || 0,
      status: clientData.status || 'em_andamento',
      deadline: clientData.deadline || '',
      contact: clientData.contact || '',
      notes: clientData.notes || '',
      createdAt: clientData.createdAt || new Date().toISOString(),
    };

    const nextClients = isEdit
      ? clients.map((c) => (c.id === newClient.id ? newClient : c))
      : [newClient, ...clients];

    setClients(nextClients);
    setLocal('clients', nextClients);
    await saveClient(newClient);
    showToast(isEdit ? 'Projeto de cliente atualizado ✓' : 'Novo cliente cadastrado com sucesso ✓');
  };

  const handleDeleteClient = async (id: string) => {
    const nextClients = clients.filter((c) => c.id !== id);
    setClients(nextClients);
    setLocal('clients', nextClients);
    await deleteClient(id);
    showToast('Projeto excluído do pipeline');
  };

  const handleUpdateClientStage = async (id: string, stage: ProjectStage) => {
    const target = clients.find((c) => c.id === id);
    if (!target) return;
    const updatedClient = { ...target, status: stage };
    const nextClients = clients.map((c) => (c.id === id ? updatedClient : c));
    setClients(nextClients);
    setLocal('clients', nextClients);
    await saveClient(updatedClient);
    showToast(`Etapa alterada para: ${stage}`);
  };

  const handleGenerateInvoice = async (client: ClientProject) => {
    // 1. Generate Invoice NF in the invoices tab
    const nextNfNumber = String(invoices.length + 1).padStart(3, '0');
    const newInvoice: InvoiceNF = {
      id: `nf-gen-${Date.now().toString(36)}`,
      number: nextNfNumber,
      clientName: client.clientName,
      cnpjCpf: undefined,
      description: client.projectTitle,
      value: client.value,
      taxRate: 6,
      netValue: Math.round(client.value * 0.94 * 100) / 100,
      issueDate: todayISO(),
      dueDate: client.deadline || todayISO(),
      status: client.status === 'concluido' ? 'paga' : 'emitida',
      notes: `Faturado do projeto: ${client.projectTitle}`,
      createdAt: new Date().toISOString(),
    };

    const nextInvoices = [newInvoice, ...invoices];
    setInvoices(nextInvoices);
    setLocal('invoices', nextInvoices);
    await saveInvoice(newInvoice);

    // 2. Also record in finance module
    const newFin: FinanceItem = {
      id: `fin-client-${Date.now().toString(36)}`,
      type: 'income',
      description: `NF #${nextNfNumber} — ${client.clientName} (${client.projectTitle})`,
      value: client.value,
      date: client.deadline || todayISO(),
      category: 'Trabalho',
      status: client.status === 'concluido' ? 'paid' : 'pending',
    };

    const nextFinance = [newFin, ...finance];
    setFinance(nextFinance);
    setLocal('finance', nextFinance);
    await saveFinance(newFin);
    showToast(`NF #${nextNfNumber} gerada na aba de notas e integrada a Finanças! ✓`);
  };

  // Invoice Handlers
  const handleSaveInvoice = async (invoiceData: Partial<InvoiceNF>) => {
    const isEdit = !!invoiceData.id;
    const newInv: InvoiceNF = {
      id: invoiceData.id || `nf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      number: invoiceData.number || '001',
      clientName: invoiceData.clientName || 'Cliente',
      cnpjCpf: invoiceData.cnpjCpf,
      description: invoiceData.description || 'Serviços prestados',
      value: invoiceData.value || 0,
      taxRate: invoiceData.taxRate,
      netValue: invoiceData.netValue,
      issueDate: invoiceData.issueDate || todayISO(),
      dueDate: invoiceData.dueDate,
      paymentDate: invoiceData.paymentDate,
      status: invoiceData.status || 'emitida',
      notes: invoiceData.notes,
      sheetLink: invoiceData.sheetLink,
      createdAt: invoiceData.createdAt || new Date().toISOString(),
    };

    const nextInvoices = isEdit
      ? invoices.map((inv) => (inv.id === newInv.id ? newInv : inv))
      : [newInv, ...invoices];

    setInvoices(nextInvoices);
    setLocal('invoices', nextInvoices);
    await saveInvoice(newInv);
    showToast(isEdit ? `NF #${newInv.number} atualizada com sucesso ✓` : `NF #${newInv.number} emitida e cadastrada ✓`);
  };

  const handleDeleteInvoice = async (id: string) => {
    const nextInvoices = invoices.filter((i) => i.id !== id);
    setInvoices(nextInvoices);
    setLocal('invoices', nextInvoices);
    await deleteInvoice(id);
    showToast('Nota fiscal excluída');
  };

  const handleToggleInvoiceStatus = async (id: string, newStatus: InvoiceStatus) => {
    const target = invoices.find((i) => i.id === id);
    if (!target) return;
    const updated: InvoiceNF = {
      ...target,
      status: newStatus,
      paymentDate: newStatus === 'paga' ? (target.paymentDate || todayISO()) : undefined,
    };
    const nextInvoices = invoices.map((i) => (i.id === id ? updated : i));
    setInvoices(nextInvoices);
    setLocal('invoices', nextInvoices);
    await saveInvoice(updated);
    showToast(newStatus === 'paga' ? `NF #${updated.number} marcada como Paga ✓` : `NF #${updated.number} reaberta`);
  };

  // Global search filtering
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter((t) => [t.title, t.category, t.priority].join(' ').toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) => [e.title, e.category, e.date, e.description || ''].join(' ').toLowerCase().includes(q));
  }, [events, searchQuery]);

  const filteredFinance = useMemo(() => {
    if (!searchQuery.trim()) return finance;
    const q = searchQuery.toLowerCase();
    return finance.filter((f) => [f.description, f.category, f.type, f.date].join(' ').toLowerCase().includes(q));
  }, [finance, searchQuery]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c) =>
      [c.clientName, c.company || '', c.projectTitle, c.notes || '', c.contact || '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [clients, searchQuery]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter((inv) =>
      [inv.number, inv.clientName, inv.description, inv.cnpjCpf || '', inv.notes || '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [invoices, searchQuery]);

  const pendingTasksCount = tasks.filter((t) => !t.done).length;
  const todayEventsCount = events.filter((e) => e.date === todayISO()).length;
  const pendingInvoicesCount = invoices.filter((i) => i.status === 'emitida').length;

  return (
    <div className="min-h-screen bg-[#050b12] text-[#eef5fb] font-sans flex flex-col">
      {/* Top Header with Brand, Navigation & Actions */}
      <TopBar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingTasksCount={pendingTasksCount}
        todayEventsCount={todayEventsCount}
        pendingInvoicesCount={pendingInvoicesCount}
        isSupabaseConnected={isSupabaseConnected}
        isGcalConnected={isGcalConnected}
        onSyncAll={async () => {
          await Promise.all([loadAppData(), loadSheets()]);
          showToast('Todos os dados sincronizados com sucesso ✓');
        }}
        isSyncing={isSyncing || isSheetLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenModal={(type) => setModalState({ isOpen: true, type, editItem: null })}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-7">
        {/* Active View */}
        {currentView === 'home' && (
          <HomeView
            tasks={filteredTasks}
            events={filteredEvents}
            finance={filteredFinance}
            onToggleTask={handleToggleTask}
            onEditTask={(t) => setModalState({ isOpen: true, type: 'task', editItem: t })}
            onDeleteTask={handleDeleteTask}
            onOpenModal={(type) => setModalState({ isOpen: true, type, editItem: null })}
            onSelectDateAgenda={(dateStr) => {
              setAgendaDateFilter(dateStr);
              setCurrentView('agenda');
            }}
          />
        )}

          {currentView === 'agenda' && (
            <AgendaView
              events={filteredEvents}
              isGcalConnected={isGcalConnected}
              onConnectGcal={handleConnectGcal}
              onOpenModal={(type, item) => setModalState({ isOpen: true, type, editItem: item || null })}
              onDeleteEvent={handleDeleteEvent}
              selectedDateFilter={agendaDateFilter}
              onSelectDateFilter={setAgendaDateFilter}
              isSyncingGcal={isSyncingGcal}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              tasks={filteredTasks}
              onToggleTask={handleToggleTask}
              onOpenModal={(type, item) => setModalState({ isOpen: true, type, editItem: item || null })}
              onDeleteTask={handleDeleteTask}
              onQuickAddTask={handleQuickAddTask}
            />
          )}

          {currentView === 'finance' && (
            <FinanceView
              finance={filteredFinance}
              onOpenModal={(type, item) => setModalState({ isOpen: true, type, editItem: item || null })}
              onDeleteFinance={handleDeleteFinance}
            />
          )}

          {currentView === 'invoices' && (
            <InvoicesView
              invoices={filteredInvoices}
              onOpenModal={(type, item) => setModalState({ isOpen: true, type, editItem: item || null })}
              onDeleteInvoice={handleDeleteInvoice}
              onToggleStatus={handleToggleInvoiceStatus}
            />
          )}

          {currentView === 'work' && (
            <WorkView
              clients={filteredClients}
              onOpenModal={(type, item) => setModalState({ isOpen: true, type, editItem: item || null })}
              onDeleteClient={handleDeleteClient}
              onUpdateStage={handleUpdateClientStage}
              onGenerateInvoice={handleGenerateInvoice}
            />
          )}
      </main>

      {/* Unified Modals */}
      <Modals
        isOpen={modalState.isOpen}
        type={modalState.type}
        editItem={modalState.editItem}
        onClose={() => setModalState({ isOpen: false, type: null, editItem: null })}
        onSaveTask={handleSaveTask}
        onSaveEvent={handleSaveEvent}
        onSaveFinance={handleSaveFinance}
        onSaveClient={handleSaveClient}
        onSaveInvoice={handleSaveInvoice}
        isGcalConnected={isGcalConnected}
      />

      {/* Global Toast */}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
