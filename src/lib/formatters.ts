import { Category, Priority } from '../types';

export function formatMoney(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  Pessoal: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', hex: '#ffb642' },
  Esporte: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', hex: '#28d7aa' },
  Família: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', hex: '#ff6683' },
  Financeiro: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', hex: '#a47aff' },
};

export const PRIORITY_STYLES: Record<Priority, { label: string; text: string; bg: string }> = {
  Alta: { label: 'Alta', text: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  Média: { label: 'Média', text: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  Baixa: { label: 'Baixa', text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
};
