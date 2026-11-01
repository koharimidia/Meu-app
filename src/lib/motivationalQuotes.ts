export interface MotivationalMessage {
  id: string;
  quote: string;
  author: string;
  category: 'Foco & Disciplina' | 'Superação' | 'Família & Vida' | 'Mentalidade Vencedora' | 'Gratidão';
  source?: string;
  themeColor?: string;
}

export const CURATED_QUOTES: MotivationalMessage[] = [
  {
    id: 'q-1',
    quote: 'A disciplina é a ponte que liga os seus objetivos às suas maiores realizações. Mantenha a constância em cada detalhe.',
    author: 'Jim Rohn',
    category: 'Foco & Disciplina',
    source: 'Pensamento do Dia',
    themeColor: '#38bdf8',
  },
  {
    id: 'q-2',
    quote: 'O sucesso nasce da vontade inabalável, da determinação diária e da persistência em cumprir o propósito que você abraçou.',
    author: 'Ayrton Senna',
    category: 'Mentalidade Vencedora',
    source: 'Inspiração Brasileira',
    themeColor: '#fbbf24',
  },
  {
    id: 'q-3',
    quote: 'Não conte apenas os dias, faça cada dia contar. O empenho honesto de hoje é o alicerce seguro da sua família amanhã.',
    author: 'Muhammad Ali',
    category: 'Família & Vida',
    source: 'Legado & Família',
    themeColor: '#34d399',
  },
  {
    id: 'q-4',
    quote: 'Grandes coisas nunca surgem na zona de conforto. Dê o seu melhor em cada atendimento, em cada produção e em cada entrega.',
    author: 'Roy T. Bennett',
    category: 'Superação',
    source: 'Atitude Positiva',
    themeColor: '#818cf8',
  },
  {
    id: 'q-5',
    quote: 'Trabalhe com dedicação e propósito em silêncio; deixe que os seus resultados falem com excelência por você.',
    author: 'Dale Carnegie',
    category: 'Foco & Disciplina',
    source: 'Alta Performance',
    themeColor: '#f472b6',
  },
  {
    id: 'q-6',
    quote: 'Gratidão profunda pelo que já foi conquistado e energia renovada para construir os próximos capítulos com sabedoria.',
    author: 'Central Kohari',
    category: 'Gratidão',
    source: 'Pílula Diária Kohari',
    themeColor: '#fbbf24',
  },
  {
    id: 'q-7',
    quote: 'A persistência transforma o improvável em rotina. Quem domina o seu dia a dia, domina o seu próprio destino.',
    author: 'Marco Aurélio',
    category: 'Mentalidade Vencedora',
    source: 'Filosofia Prática',
    themeColor: '#38bdf8',
  },
  {
    id: 'q-8',
    quote: 'Pequenos passos dados todos os dias na direção certa geram resultados extraordinários no longo prazo.',
    author: 'Sabedoria Cotidiana',
    category: 'Foco & Disciplina',
    source: 'Produtividade Consciente',
    themeColor: '#34d399',
  },
  {
    id: 'q-9',
    quote: 'A coragem não é a ausência de medo, mas a certeza inabalável de que algo é muito mais importante que ele.',
    author: 'Ambrose Redmoon',
    category: 'Superação',
    source: 'Inspiração Diária',
    themeColor: '#fb923c',
  },
  {
    id: 'q-10',
    quote: 'A mente que se abre para uma nova visão de mundo e compromisso com o melhor jamais volta ao estado inicial.',
    author: 'Albert Einstein',
    category: 'Mentalidade Vencedora',
    source: 'Crescimento Contínuo',
    themeColor: '#a78bfa',
  },
];

const STORAGE_KEY = 'kohari_daily_motivation';
const CUSTOM_FEED_KEY = 'kohari_motivation_feed_url';

/**
 * Returns deterministic daily quote based on date string (YYYY-MM-DD)
 */
export function getDailyQuoteForDate(dateStr: string): MotivationalMessage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === dateStr && parsed.quote) {
        return parsed.quote;
      }
    }
  } catch {
    // Ignore parse error
  }

  // Calculate day-based index
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_QUOTES.length;
  const selected = CURATED_QUOTES[index];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: dateStr, quote: selected }));
  } catch {
    // ignore
  }

  return selected;
}

/**
 * Sync fresh quote (either random from pool or fetched from online API)
 */
export async function syncNextMotivationalQuote(): Promise<MotivationalMessage> {
  // Check if user has a custom feed URL configured
  let feedUrl = '';
  try {
    feedUrl = localStorage.getItem(CUSTOM_FEED_KEY) || '';
  } catch {}

  if (feedUrl) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        // Parse flexible JSON formats
        const text = data.quote || data.slip?.advice || data.message || data.frase || (Array.isArray(data) ? data[0]?.q || data[0]?.quote : null);
        const author = data.author || data.autor || (Array.isArray(data) ? data[0]?.a : null) || 'Fonte Sincronizada';
        if (text) {
          const newQuote: MotivationalMessage = {
            id: `sync-${Date.now()}`,
            quote: text,
            author,
            category: 'Mentalidade Vencedora',
            source: 'Feed Online Configurado',
            themeColor: '#38bdf8',
          };
          saveCurrentQuote(newQuote);
          return newQuote;
        }
      }
    } catch (e) {
      console.warn('Erro ao sincronizar do feed customizado, usando fallback:', e);
    }
  }

  // Try public motivational online service (with quick timeout)
  try {
    const res = await fetch('https://api.adviceslip.com/advice', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.slip?.advice) {
        // Translation or English quote tagged
        const newQuote: MotivationalMessage = {
          id: `advice-${data.slip.id}`,
          quote: data.slip.advice,
          author: 'Daily Wisdom',
          category: 'Foco & Disciplina',
          source: 'Feed Online Sincronizado',
          themeColor: '#34d399',
        };
        saveCurrentQuote(newQuote);
        return newQuote;
      }
    }
  } catch {
    // Fallback smoothly to curated pool
  }

  // Shuffle from curated pool
  const randomIndex = Math.floor(Math.random() * CURATED_QUOTES.length);
  const next = CURATED_QUOTES[randomIndex];
  saveCurrentQuote(next);
  return next;
}

export function saveCurrentQuote(msg: MotivationalMessage) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, quote: msg }));
  } catch {}
}

export function getCustomFeedUrl(): string {
  try {
    return localStorage.getItem(CUSTOM_FEED_KEY) || '';
  } catch {
    return '';
  }
}

export function setCustomFeedUrl(url: string) {
  try {
    localStorage.setItem(CUSTOM_FEED_KEY, url.trim());
  } catch {}
}
