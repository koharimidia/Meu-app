import { SheetExpensePoint } from '../types';

export const SHEET_ID = '1iRUtzrtZ9mnUIVDk-6i0WJ2NXmtnXPc7rQ0_Xc7HJ30';
export const SHEET_GID = '1979305811';

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export interface MonthExpenseSummary {
  year: number;
  month: number; // 0-indexed (0 = Jan, 8 = Sep)
  monthName: string;
  monthLabel: string;
  points: SheetExpensePoint[];
  total: number;
  avg: number;
  highest: { date: string; amount: number };
  daysWithExpenses: number;
}

export interface SheetFetchResult {
  points: SheetExpensePoint[];
  total: number;
  avg: number;
  highest: { date: string; amount: number };
  statusMessage: string;
  isRealData: boolean;
  activeMonthKey?: string;
  activeMonthLabel?: string;
  activeYear?: number;
  activeMonth?: number;
  availableMonths?: { key: string; label: string; year: number; month: number }[];
  allMonthsData?: Record<string, MonthExpenseSummary>;
}

const FALLBACK_POINTS: SheetExpensePoint[] = [
  { date: '02/09', amount: 97.71, day: 2, fullDate: '2026-09-02' },
  { date: '03/09', amount: 193.78, day: 3, fullDate: '2026-09-03' },
  { date: '04/09', amount: 203.55, day: 4, fullDate: '2026-09-04' },
  { date: '06/09', amount: 107.00, day: 6, fullDate: '2026-09-06' },
  { date: '07/09', amount: 118.63, day: 7, fullDate: '2026-09-07' },
  { date: '08/09', amount: 221.21, day: 8, fullDate: '2026-09-08' },
  { date: '09/09', amount: 2738.55, day: 9, fullDate: '2026-09-09' },
  { date: '10/09', amount: 328.75, day: 10, fullDate: '2026-09-10' },
  { date: '11/09', amount: 46.89, day: 11, fullDate: '2026-09-11' },
  { date: '12/09', amount: 203.87, day: 12, fullDate: '2026-09-12' },
  { date: '15/09', amount: 139.90, day: 15, fullDate: '2026-09-15' },
  { date: '17/09', amount: 141.43, day: 17, fullDate: '2026-09-17' },
  { date: '20/09', amount: 173.15, day: 20, fullDate: '2026-09-20' },
  { date: '30/09', amount: 185.46, day: 30, fullDate: '2026-09-30' },
];

export async function fetchSheetExpenses(
  targetYear?: number,
  targetMonth?: number
): Promise<SheetFetchResult> {
  const now = new Date();
  const currentYear = targetYear !== undefined ? targetYear : now.getFullYear();
  const currentMonth = targetMonth !== undefined ? targetMonth : now.getMonth();
  const targetKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const targetMonthLabel = `${MONTH_NAMES_PT[currentMonth]} de ${currentYear}`;

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

    // Parse rows into monthly structure
    const monthlyMap: Record<
      string,
      {
        year: number;
        month: number;
        dailyMap: Record<number, { dateLabel: string; amount: number; fullDate: string }>;
        total: number;
      }
    > = {};

    rows.forEach((r: any) => {
      const c = r?.c;
      if (!c || !c[0]) return;

      const v = c[0]?.v;
      const f = c[0]?.f;
      let year: number | null = null;
      let month: number | null = null; // 0-indexed
      let day: number | null = null;

      if (typeof v === 'string' && v.startsWith('Date(')) {
        const parts = v.replace('Date(', '').replace(')', '').split(',').map(Number);
        if (parts.length >= 3) {
          year = parts[0];
          month = parts[1]; // Google Sheets gviz format: 0 is Jan, 8 is Sep
          day = parts[2];
        }
      } else if (f) {
        const match = f.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (match) {
          day = Number(match[1]);
          month = Number(match[2]) - 1;
          let yr = Number(match[3]);
          if (yr < 100) yr += 2000;
          year = yr;
        }
      } else if (typeof v === 'string') {
        const match = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (match) {
          day = Number(match[1]);
          month = Number(match[2]) - 1;
          let yr = Number(match[3]);
          if (yr < 100) yr += 2000;
          year = yr;
        }
      }

      if (year === null || month === null || day === null) return;
      if (isNaN(year) || isNaN(month) || isNaN(day)) return;
      // Filter out corrupted years like 225
      if (year < 2020 || year > 2035) return;
      if (month < 0 || month > 11) return;

      // Parse amount in column 2 (column index 2 is expense value in R$)
      const rawVal = c[2]?.v;
      let amount = 0;
      if (typeof rawVal === 'number') {
        amount = rawVal;
      } else if (rawVal) {
        amount = parseFloat(String(rawVal).replace(/[^\d,-]/g, '').replace(',', '.'));
      }

      if (isNaN(amount) || amount <= 0) return;

      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          year,
          month,
          dailyMap: {},
          total: 0,
        };
      }

      const dateLabel = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (!monthlyMap[monthKey].dailyMap[day]) {
        monthlyMap[monthKey].dailyMap[day] = { dateLabel, amount: 0, fullDate };
      }

      monthlyMap[monthKey].dailyMap[day].amount += amount;
      monthlyMap[monthKey].total += amount;
    });

    const allMonthsData: Record<string, MonthExpenseSummary> = {};
    const availableMonths: { key: string; label: string; year: number; month: number }[] = [];

    Object.keys(monthlyMap).forEach((mKey) => {
      const data = monthlyMap[mKey];
      const mName = MONTH_NAMES_PT[data.month] || '';
      const mLabel = `${mName} de ${data.year}`;

      const points: SheetExpensePoint[] = Object.entries(data.dailyMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([dayNum, info]) => ({
          date: info.dateLabel,
          amount: Math.round(info.amount * 100) / 100,
          day: Number(dayNum),
          fullDate: info.fullDate,
        }));

      const total = Math.round(data.total * 100) / 100;
      const avg = points.length > 0 ? Math.round((total / points.length) * 100) / 100 : 0;
      const highest = points.length > 0
        ? points.reduce((prev, cur) => (cur.amount > prev.amount ? cur : prev), points[0])
        : { date: '', amount: 0 };

      allMonthsData[mKey] = {
        year: data.year,
        month: data.month,
        monthName: mName,
        monthLabel: mLabel,
        points,
        total,
        avg,
        highest,
        daysWithExpenses: points.length,
      };

      availableMonths.push({
        key: mKey,
        label: mLabel,
        year: data.year,
        month: data.month,
      });
    });

    // Sort available months descending (most recent first)
    availableMonths.sort((a, b) => b.key.localeCompare(a.key));

    // Choose active month:
    // 1. Strictly the requested target month (current month by default)
    // 2. If target month has data, use it!
    // 3. If target month has no data yet, create empty summary for it, or use latest
    let activeSummary = allMonthsData[targetKey];
    if (!activeSummary) {
      activeSummary = {
        year: currentYear,
        month: currentMonth,
        monthName: MONTH_NAMES_PT[currentMonth],
        monthLabel: targetMonthLabel,
        points: [],
        total: 0,
        avg: 0,
        highest: { date: '', amount: 0 },
        daysWithExpenses: 0,
      };
    }

    const isCurrent = currentYear === now.getFullYear() && currentMonth === now.getMonth();
    const statusMessage = activeSummary.points.length > 0
      ? `Sincronizado: ${activeSummary.points.length} dias com gastos em ${activeSummary.monthLabel}${isCurrent ? ' (Mês Atual)' : ''}.`
      : `Nenhum gasto registrado para ${activeSummary.monthLabel}.`;

    return {
      points: activeSummary.points,
      total: activeSummary.total,
      avg: activeSummary.avg,
      highest: activeSummary.highest,
      statusMessage,
      isRealData: true,
      activeMonthKey: targetKey,
      activeMonthLabel: activeSummary.monthLabel,
      activeYear: activeSummary.year,
      activeMonth: activeSummary.month,
      availableMonths,
      allMonthsData,
    };
  } catch (err) {
    console.warn('Erro ao consultar Google Planilhas via gviz:', err);
  }

  // Fallback for current month if public sheet cannot be reached
  const total = FALLBACK_POINTS.reduce((acc, p) => acc + p.amount, 0);
  const avg = Math.round((total / FALLBACK_POINTS.length) * 100) / 100;
  const highest = FALLBACK_POINTS.reduce((prev, cur) => (cur.amount > prev.amount ? cur : prev), FALLBACK_POINTS[0]);

  const fallbackSummary: MonthExpenseSummary = {
    year: currentYear,
    month: currentMonth,
    monthName: MONTH_NAMES_PT[currentMonth] || 'Mês Atual',
    monthLabel: targetMonthLabel,
    points: FALLBACK_POINTS,
    total,
    avg,
    highest,
    daysWithExpenses: FALLBACK_POINTS.length,
  };

  return {
    points: FALLBACK_POINTS,
    total,
    avg,
    highest,
    statusMessage: `Gastos de ${targetMonthLabel} (Mês Atual).`,
    isRealData: false,
    activeMonthKey: targetKey,
    activeMonthLabel: targetMonthLabel,
    activeYear: currentYear,
    activeMonth: currentMonth,
    availableMonths: [{ key: targetKey, label: targetMonthLabel, year: currentYear, month: currentMonth }],
    allMonthsData: { [targetKey]: fallbackSummary },
  };
}
