import { Category, Priority } from '../types';

export function formatMoney(val: number | string | undefined, isPrivate: boolean = false): string {
  if (isPrivate) {
    return 'R$ ••••••';
  }
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function maskPrivate(val: string | number | undefined, isPrivate: boolean = false): string {
  if (isPrivate) return '••••';
  return String(val ?? '');
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toISODate(d: string | undefined): string {
  if (!d) return '';
  d = String(d).trim();
  if (d.includes('/')) {
    const p = d.split('/');
    if (p.length === 3) return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
  }
  return d.slice(0, 10);
}

export function formatDateBR(d: string | undefined): string {
  if (!d) return '-';
  const iso = toISODate(d);
  if (!iso || iso.length < 10) return d;
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

export function formatRelativeDate(d: string | undefined): { text: string; isPast: boolean; isToday: boolean } {
  if (!d) return { text: '-', isPast: false, isToday: false };
  const iso = toISODate(d);
  const today = todayISO();

  if (iso === today) {
    return { text: 'Hoje', isPast: false, isToday: true };
  }

  const [y1, m1, d1] = iso.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  const dateTarget = new Date(y1, m1 - 1, d1);
  const dateToday = new Date(y2, m2 - 1, d2);

  const diffDays = Math.round((dateTarget.getTime() - dateToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return { text: 'Amanhã', isPast: false, isToday: false };
  if (diffDays === -1) return { text: 'Ontem', isPast: true, isToday: false };
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d atrás`, isPast: true, isToday: false };
  return { text: `${formatDateBR(iso)} (${diffDays}d)`, isPast: false, isToday: false };
}

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string; hex: string }> = {
  Trabalho: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', hex: '#2787ff' },
  'Custos de Trabalho': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', hex: '#6366f1' },
  Cursos: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', hex: '#06b6d4' },
  Doação: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30', hex: '#ec4899' },
  Pessoal: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#ffb642' },
  Esporte: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#28d7aa' },
  Família: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', hex: '#ff6683' },
  Financeiro: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', hex: '#a47aff' },
  Alimentação: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#f97316' },
  Transporte: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30', hex: '#0ea5e9' },
  Moradia: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30', hex: '#14b8a6' },
  Lazer: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', hex: '#8b5cf6' },
  Outros: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', hex: '#64748b' },
};

export const PRIORITY_STYLES: Record<Priority, { label: string; text: string; bg: string }> = {
  Alta: { label: 'Alta', text: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  Média: { label: 'Média', text: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  Baixa: { label: 'Baixa', text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
};
