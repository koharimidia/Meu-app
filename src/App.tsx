import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task,
  CalendarEvent,
  FinanceItem,
  ClientProject,
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
    type: 'task' | 'event' | 'finance' | 'client' | null;
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
    const newFin: FinanceItem = {
      id: `fin-client-${Date.now().toString(36)}`,
      type: 'income',
      description: `${client.clientName} — ${client.projectTitle}`,
      value: client.value,
      date: client.deadline || todayISO(),
      category: 'Trabalho',
      status: client.status === 'concluido' ? 'paid' : 'pending',
    };

    const nextFinance = [newFin, ...finance];
    setFinance(nextFinance);
    setLocal('finance', nextFinance);
    await saveFinance(newFin);
    showToast(`Lançamento financeiro de ${formatMoney(client.value)} gerado no módulo Finanças! ✓`);
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

  const pendingTasksCount = tasks.filter((t) => !t.done).length;
  const todayEventsCount = events.filter((e) => e.date === todayISO()).length;

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
        isGcalConnected={isGcalConnected}
      />

      {/* Global Toast */}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
