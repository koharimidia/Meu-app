export type Priority = 'Alta' | 'Média' | 'Baixa';

export type Category = 'Trabalho' | 'Pessoal' | 'Esporte' | 'Família' | 'Financeiro';

export interface Task {
  id: string;
  title: string;
  due: string; // YYYY-MM-DD
  priority: Priority;
  category: Category;
  done: boolean;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or 'Dia todo'
  category: Category;
  gcal_id?: string;
  description?: string;
}

export type FinanceType = 'income' | 'expense';

export interface FinanceItem {
  id: string;
  type: FinanceType;
  description: string;
  value: number;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  category: string;
  status: 'paid' | 'pending' | 'pago' | 'recebido' | 'a receber';
}

export type ProjectStage = 'proposta' | 'negociacao' | 'em_andamento' | 'espera' | 'concluido';

export interface ClientProject {
  id: string;
  clientName: string;
  company?: string;
  projectTitle: string;
  value: number;
  status: ProjectStage;
  deadline?: string;
  contact?: string;
  notes?: string;
  createdAt?: string;
}

export type InvoiceStatus = 'emitida' | 'paga' | 'cancelada';

export interface InvoiceNF {
  id: string;
  number: string;
  clientName: string;
  cnpjCpf?: string;
  description: string;
  value: number;
  taxRate?: number;
  netValue?: number;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  status: InvoiceStatus;
  notes?: string;
  sheetLink?: string;
  createdAt?: string;
}

export type NavView = 'home' | 'agenda' | 'tasks' | 'finance' | 'invoices' | 'work';

export interface SheetExpensePoint {
  date: string;
  amount: number;
  day?: number;
  fullDate?: string;
}
