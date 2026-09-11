import { SheetExpensePoint } from '../types';

export const SHEET_ID = '1iRUtzrtZ9mnUIVDk-6i0WJ2NXmtnXPc7rQ0_Xc7HJ30';
export const SHEET_GID = '1979305811';

export interface SheetFetchResult {
  points: SheetExpensePoint[];
  total: number;
  avg: number;
  highest: { date: string; amount: number };
  statusMessage: string;
  isRealData: boolean;
}

const FALLBACK_POINTS: SheetExpensePoint[] = [
  { date: '12/11', amount: 145.50 },
  { date: '13/11', amount: 325.00 },
  { date: '14/11', amount: 84.20 },
  { date: '15/11', amount: 41.00 },
  { date: '16/11', amount: 92.40 },
  { date: '17/11', amount: 185.00 },
  { date: '18/11', amount: 210.00 },
  { date: '19/11', amount: 65.00 },
  { date: '20/11', amount: 154.30 },
];

export async function fetchSheetExpenses(): Promise<SheetFetchResult> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const json = JSON.parse(jsonStr);
    const rows = json?.table?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Nenhuma linha encontrada na planilha');
    }

    const dailyTotals: Record<string, number> = {};

    rows.forEach((r: any) => {
      const c = r?.c;
      if (!c || !c[0]) return;

      const rawDate = c[0]?.f || (c[0]?.v ? String(c[0]?.v) : null);
      if (!rawDate) return;

      // Extract date label (clean up Date(2026,X,Y) if present)
      let dateLabel = rawDate;
      if (dateLabel.startsWith('Date(')) {
        const parts = dateLabel.replace('Date(', '').replace(')', '').split(',');
        if (parts.length >= 3) {
          const y = parts[0];
          const m = String(Number(parts[1]) + 1).padStart(2, '0');
          const d = String(parts[2]).padStart(2, '0');
          dateLabel = `${d}/${m}`;
        }
      }

      // Column 2 value
      const rawVal = c[2]?.v;
      let val = 0;
      if (typeof rawVal === 'number') {
        val = rawVal;
      } else if (rawVal) {
        val = parseFloat(String(rawVal).replace(/[^\d,-]/g, '').replace(',', '.'));
      }

      if (!isNaN(val) && val > 0) {
        dailyTotals[dateLabel] = (dailyTotals[dateLabel] || 0) + val;
      }
    });

    const entries = Object.entries(dailyTotals);
    if (entries.length > 0) {
      const points: SheetExpensePoint[] = entries.map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
      }));

      const total = points.reduce((acc, p) => acc + p.amount, 0);
      const avg = total / points.length;
      const highest = points.reduce((prev, cur) => cur.amount > prev.amount ? cur : prev, points[0]);

      return {
        points,
        total,
        avg,
        highest,
        statusMessage: `Sincronizado: ${points.length} dias carregados diretamente da planilha.`,
        isRealData: true,
      };
    }
  } catch (err) {
    console.warn('Erro ao consultar Google Planilhas via gviz:', err);
  }

  // Fallback if not public or unreachable
  const total = FALLBACK_POINTS.reduce((acc, p) => acc + p.amount, 0);
  const avg = total / FALLBACK_POINTS.length;
  const highest = FALLBACK_POINTS.reduce((prev, cur) => cur.amount > prev.amount ? cur : prev, FALLBACK_POINTS[0]);

  return {
    points: FALLBACK_POINTS,
    total,
    avg,
    highest,
    statusMessage: 'Exibindo dados em cache (para sincronizar em tempo real, certifique-se de que a planilha está pública para leitura).',
    isRealData: false,
  };
}
