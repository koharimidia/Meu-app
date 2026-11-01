import { createClient } from '@supabase/supabase-js';
import { Task, CalendarEvent, FinanceItem, ClientProject, InvoiceNF } from '../types';

export const SUPABASE_URL = 'https://lejnasbocnqjbyecyudx.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_kfAWc8CtwymUsD5sNVNN9A_FJUKNke7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Seed fallback data to ensure smooth initial experience
const SEED_TASKS: Task[] = [
  { id: 't-1', title: 'Enviar proposta comercial para Cliente Vanguarda', due: new Date().toISOString().slice(0, 10), priority: 'Alta', category: 'Trabalho', done: false },
  { id: 't-2', title: 'Revisar fluxo de caixa e conciliação bancária', due: new Date().toISOString().slice(0, 10), priority: 'Alta', category: 'Financeiro', done: false },
  { id: 't-3', title: 'Treino de corrida 8km (preparação)', due: new Date().toISOString().slice(0, 10), priority: 'Média', category: 'Esporte', done: false },
  { id: 't-4', title: 'Alinhar escopo de desenvolvimento do app', due: new Date(Date.now() + 86400000).toISOString().slice(0, 10), priority: 'Média', category: 'Trabalho', done: false },
  { id: 't-5', title: 'Comprar suprimentos e mercado semanal', due: new Date(Date.now() + 86400000).toISOString().slice(0, 10), priority: 'Baixa', category: 'Família', done: true },
];

const SEED_EVENTS: CalendarEvent[] = [
  { id: 'e-1', title: 'Alinhamento com Diretoria de Marketing', date: new Date().toISOString().slice(0, 10), time: '09:30', category: 'Trabalho' },
  { id: 'e-2', title: 'Reunião de status e entrega de sprints', date: new Date().toISOString().slice(0, 10), time: '14:00', category: 'Trabalho' },
  { id: 'e-3', title: 'Consulta Fonoaudiologia', date: new Date().toISOString().slice(0, 10), time: '17:30', category: 'Pessoal' },
  { id: 'e-4', title: 'Treino de natação / Iron', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '06:30', category: 'Esporte' },
  { id: 'e-5', title: 'Jantar em família', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '20:00', category: 'Família' },
];

const SEED_FINANCE: FinanceItem[] = [
  { id: 'f-1', type: 'income', description: 'Consultoria Estratégica Q1', value: 8500, date: `${new Date().getFullYear()}-03-01`, category: 'Trabalho', status: 'paid' },
  { id: 'f-2', type: 'income', description: 'Desenvolvimento Web - Entrada 50%', value: 6200, date: `${new Date().getFullYear()}-03-05`, category: 'Trabalho', status: 'paid' },
  { id: 'f-3', type: 'income', description: 'Retainer Mensal - Gestão de Tráfego', value: 3500, date: new Date().toISOString().slice(0, 10), category: 'Trabalho', status: 'pending' },
  { id: 'f-4', type: 'income', description: 'Entrega Final - Projeto Mobile', value: 5400, date: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), category: 'Trabalho', status: 'pending' },
  { id: 'f-5', type: 'expense', description: 'Assinaturas de Software & Servidores', value: 840, date: `${new Date().getFullYear()}-03-02`, category: 'Trabalho', status: 'paid' },
  { id: 'f-6', type: 'expense', description: 'Aluguel do Estúdio & Condomínio', value: 2100, date: `${new Date().getFullYear()}-03-04`, category: 'Moradia', status: 'paid' },
  { id: 'f-7', type: 'expense', description: 'Supermercado & Alimentação', value: 1250, date: `${new Date().getFullYear()}-03-06`, category: 'Alimentação', status: 'paid' },
  { id: 'f-8', type: 'expense', description: 'Combustível e Estacionamento', value: 380, date: `${new Date().getFullYear()}-03-07`, category: 'Transporte', status: 'paid' },
];

const SEED_CLIENTS: ClientProject[] = [
  {
    id: 'c-1',
    clientName: 'Studio Apex',
    company: 'Apex Design & Co.',
    projectTitle: 'Redesenho Portal Institucional & Brand Guide',
    value: 7800,
    status: 'em_andamento',
    deadline: new Date(Date.now() + 86400000 * 12).toISOString().slice(0, 10),
    contact: 'contato@apexstudio.com',
    notes: 'Briefing aprovado, prototipando telas no Figma.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c-2',
    clientName: 'Dra. Beatriz Cunha',
    company: 'Clínica Odonto Vida',
    projectTitle: 'Campanha de Tráfego Pago & Captação',
    value: 3500,
    status: 'negociacao',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    contact: 'dra.beatriz@odontovida.com.br',
    notes: 'Aguardando aprovação da verba mensal de anúncios.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c-3',
    clientName: 'Nexus Tech Logistics',
    company: 'Nexus Logística',
    projectTitle: 'Desenvolvimento de Dashboard em Tempo Real',
    value: 12500,
    status: 'proposta',
    deadline: new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10),
    contact: 'roberto@nexustech.io',
    notes: 'Proposta técnica enviada, aguardando reunião de alinhamento.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c-4',
    clientName: 'Kallos Fitness',
    company: 'Academia Kallos',
    projectTitle: 'Landing Page de Matrículas e Integração WhatsApp',
    value: 2800,
    status: 'concluido',
    deadline: new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10),
    contact: 'gerencia@kallosfit.com',
    notes: 'Entregue com sucesso e homologado pelo cliente.',
    createdAt: new Date().toISOString()
  }
];

const SEED_INVOICES: InvoiceNF[] = [
  {
    id: 'nf-001',
    number: '001',
    clientName: 'Studio Apex',
    cnpjCpf: '32.485.912/0001-44',
    description: 'Desenvolvimento Portal Institucional e Brand Guide',
    value: 7800,
    taxRate: 6,
    netValue: 7332,
    issueDate: '2026-08-15',
    dueDate: '2026-08-20',
    paymentDate: '2026-08-20',
    status: 'paga',
    notes: 'Liquidado via PIX empresarial. NF arquivada.',
    createdAt: new Date('2026-08-15').toISOString(),
  },
  {
    id: 'nf-002',
    number: '002',
    clientName: 'Nexus Tech Logistics',
    cnpjCpf: '18.392.109/0001-88',
    description: 'Consultoria Técnica & Desenvolvimento Dashboard Tempo Real',
    value: 12500,
    taxRate: 6,
    netValue: 11750,
    issueDate: '2026-09-01',
    dueDate: '2026-09-20',
    status: 'emitida',
    notes: 'Boleto bancário gerado com vencimento dia 20/09.',
    createdAt: new Date('2026-09-01').toISOString(),
  },
  {
    id: 'nf-003',
    number: '003',
    clientName: 'Dra. Beatriz Cunha',
    cnpjCpf: '45.109.832/0001-20',
    description: 'Campanha de Tráfego Pago & Otimização de Conversão',
    value: 3500,
    taxRate: 6,
    netValue: 3290,
    issueDate: '2026-09-05',
    dueDate: '2026-09-18',
    status: 'emitida',
    notes: 'Aguardando repasse conforme contrato mensal.',
    createdAt: new Date('2026-09-05').toISOString(),
  },
  {
    id: 'nf-004',
    number: '004',
    clientName: 'Drone Sesc 14 Bis',
    cnpjCpf: '03.882.193/0001-77',
    description: 'Captação aérea em 4K e pós-produção audiovisual',
    value: 4200,
    taxRate: 6,
    netValue: 3948,
    issueDate: '2026-09-10',
    dueDate: '2026-09-11',
    paymentDate: '2026-09-11',
    status: 'paga',
    notes: 'Pagamento confirmado e compensado hoje.',
    createdAt: new Date('2026-09-10').toISOString(),
  }
];

// LocalStorage helpers
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`central_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`central_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

export async function fetchAllData() {
  let tasks: Task[] = getLocal('tasks', SEED_TASKS);
  let events: CalendarEvent[] = getLocal('events', SEED_EVENTS);
  let finance: FinanceItem[] = getLocal('finance', SEED_FINANCE);
  let clients: ClientProject[] = getLocal('clients', SEED_CLIENTS);
  let invoices: InvoiceNF[] = getLocal('invoices', SEED_INVOICES);
  let isConnected = true;

  // 1. Fetch from centralized server persistent store (shared across all devices)
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const serverHasData =
          (d.tasks && d.tasks.length > 0) ||
          (d.finance && d.finance.length > 0) ||
          (d.events && d.events.length > 0);

        if (serverHasData) {
          tasks = d.tasks || [];
          events = d.events || [];
          finance = (d.finance || []).map((x: any) => ({ ...x, value: Number(x.value || 0) }));
          clients = d.clients || [];
          invoices = (d.invoices || []).map((x: any) => ({
            ...x,
            value: Number(x.value || 0),
            taxRate: x.taxRate ? Number(x.taxRate) : undefined,
            netValue: x.netValue ? Number(x.netValue) : undefined,
          }));

          setLocal('tasks', tasks);
          setLocal('events', events);
          setLocal('finance', finance);
          setLocal('clients', clients);
          setLocal('invoices', invoices);
          return { tasks, events, finance, clients, invoices, isConnected: true };
        } else {
          // Initialize server with seed/local data so other devices receive it
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks, events, finance, clients, invoices }),
          }).catch(() => {});
        }
      }
    }
  } catch (serverErr) {
    console.warn('Server storage fetch error, attempting Supabase/local fallback:', serverErr);
  }

  // 2. Secondary fallback attempt with Supabase (if configured)
  try {
    const [tRes, eRes, fRes, cRes, iRes] = await Promise.allSettled([
      supabase.from('tasks').select('*'),
      supabase.from('events').select('*'),
      supabase.from('finance').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('invoices').select('*'),
    ]);

    if (tRes.status === 'fulfilled' && !tRes.value.error && tRes.value.data?.length) {
      tasks = tRes.value.data as Task[];
      setLocal('tasks', tasks);
    }
    if (eRes.status === 'fulfilled' && !eRes.value.error && eRes.value.data?.length) {
      events = eRes.value.data as CalendarEvent[];
      setLocal('events', events);
    }
    if (fRes.status === 'fulfilled' && !fRes.value.error && fRes.value.data?.length) {
      finance = (fRes.value.data as FinanceItem[]).map((x) => ({ ...x, value: Number(x.value || 0) }));
      setLocal('finance', finance);
    }
    if (cRes.status === 'fulfilled' && !cRes.value.error && cRes.value.data?.length) {
      clients = cRes.value.data as ClientProject[];
      setLocal('clients', clients);
    }
    if (iRes.status === 'fulfilled' && !iRes.value.error && iRes.value.data?.length) {
      invoices = (iRes.value.data as InvoiceNF[]).map((x) => ({
        ...x,
        value: Number(x.value || 0),
        taxRate: x.taxRate ? Number(x.taxRate) : undefined,
        netValue: x.netValue ? Number(x.netValue) : undefined,
      }));
      setLocal('invoices', invoices);
    }
  } catch {
    // Keep local/server data
  }

  return { tasks, events, finance, clients, invoices, isConnected };
}

async function persistItemToServer(collection: string, item: any, isDelete: boolean = false) {
  try {
    await fetch('/api/data/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, item, isDelete }),
    });
  } catch (e) {
    console.warn(`Failed to persist ${collection} item to server:`, e);
  }
}

export async function saveTask(task: Task) {
  persistItemToServer('tasks', task, false);
  try {
    await supabase.from('tasks').upsert(task);
  } catch {
    // Ignore Supabase connection error
  }
}

export async function deleteTask(id: string) {
  persistItemToServer('tasks', id, true);
  try {
    await supabase.from('tasks').delete().eq('id', id);
  } catch {
    // Ignore
  }
}

export async function saveEvent(event: CalendarEvent) {
  persistItemToServer('events', event, false);
  try {
    await supabase.from('events').upsert(event);
  } catch {
    // Ignore
  }
}

export async function deleteEvent(id: string) {
  persistItemToServer('events', id, true);
  try {
    await supabase.from('events').delete().eq('id', id);
  } catch {
    // Ignore
  }
}

export async function saveFinance(item: FinanceItem) {
  persistItemToServer('finance', item, false);
  try {
    await supabase.from('finance').upsert(item);
  } catch {
    // Ignore
  }
}

export async function deleteFinance(id: string) {
  persistItemToServer('finance', id, true);
  try {
    await supabase.from('finance').delete().eq('id', id);
  } catch {
    // Ignore
  }
}

export async function saveClient(client: ClientProject) {
  persistItemToServer('clients', client, false);
  try {
    await supabase.from('clients').upsert(client);
  } catch {
    // Ignore
  }
}

export async function deleteClient(id: string) {
  persistItemToServer('clients', id, true);
  try {
    await supabase.from('clients').delete().eq('id', id);
  } catch {
    // Ignore
  }
}

export async function saveInvoice(invoice: InvoiceNF) {
  persistItemToServer('invoices', invoice, false);
  try {
    await supabase.from('invoices').upsert(invoice);
  } catch {
    // Ignore
  }
}

export async function deleteInvoice(id: string) {
  persistItemToServer('invoices', id, true);
  try {
    await supabase.from('invoices').delete().eq('id', id);
  } catch {
    // Ignore
  }
}
