import { CalendarEvent } from '../types';

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

export const GCAL_CLIENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) ||
  '318981545392-eddfe24v50tdfp6dppr1pgc469li5moh.apps.googleusercontent.com';
export const GCAL_API_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_API_KEY) ||
  'AIzaSyCXkRNVZA-ubBfiHaB8sYKSb2lOJmgzti4';
export const GCAL_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
export const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

let gapiInitialized = false;
let tokenClient: any = null;
let currentAccessToken: string | null = null;

export function initGoogleApis(onInitSuccess?: () => void) {
  if (typeof window === 'undefined') return;

  const tryInitGapi = () => {
    if (window.gapi && !gapiInitialized) {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GCAL_API_KEY,
            discoveryDocs: [GCAL_DISCOVERY_DOC],
          });
          gapiInitialized = true;
          if (onInitSuccess) onInitSuccess();
        } catch (e) {
          console.warn('GAPI init warning:', e);
        }
      });
    }
  };

  const tryInitGis = () => {
    if (window.google?.accounts?.oauth2 && !tokenClient) {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GCAL_CLIENT_ID,
          scope: GCAL_SCOPES,
          callback: () => {},
        });
      } catch (e) {
        console.warn('GIS init warning:', e);
      }
    }
  };

  tryInitGapi();
  tryInitGis();

  // Retry after delay if scripts were loading
  setTimeout(tryInitGapi, 1500);
  setTimeout(tryInitGis, 1500);
}

export function requestCalendarAuth(
  onSuccess: (events: CalendarEvent[]) => void,
  onError: (err: any) => void
) {
  if (!window.google?.accounts?.oauth2) {
    onError('Google Identity Services ainda não carregou. Aguarde alguns instantes.');
    return;
  }

  if (!tokenClient) {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GCAL_CLIENT_ID,
        scope: GCAL_SCOPES,
        callback: '',
        error_callback: (err: any) => {
          console.warn('OAuth GIS error callback:', err);
          onError(err?.message || 'Erro de autorização do Google. Verifique as origens autorizadas no Google Cloud.');
        },
      });
    } catch (e) {
      onError('Falha ao inicializar cliente OAuth do Google.');
      return;
    }
  }

  tokenClient.callback = async (resp: any) => {
    if (resp.error) {
      console.error('Google Auth Error:', resp);
      onError(resp.error_description || resp.error);
      return;
    }

    currentAccessToken = resp.access_token;
    try {
      const fetchedEvents = await fetchGoogleCalendarEvents();
      onSuccess(fetchedEvents);
    } catch (err) {
      console.error('Fetch GCal error:', err);
      onError('Não foi possível ler os eventos do Google Calendar.');
    }
  };

  tokenClient.requestAccessToken({ prompt: '' });
}

export async function fetchGoogleCalendarEvents(): Promise<CalendarEvent[]> {
  if (!window.gapi?.client?.calendar) {
    throw new Error('GAPI Calendar client não está inicializado.');
  }

  const calListRes = await window.gapi.client.calendar.calendarList.list();
  const calendars = calListRes.result.items || [{ id: 'primary' }];

  const now = new Date();
  const dMin = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const dMax = new Date(now.getFullYear(), now.getMonth() + 12, 28);
  const timeMin = dMin.toISOString();
  const timeMax = dMax.toISOString();

  const collectedEvents: CalendarEvent[] = [];

  for (const cal of calendars) {
    if (cal.id.includes('#holiday@group.v.calendar.google.com')) continue;

    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: cal.id,
        timeMin,
        timeMax,
        showDeleted: false,
        singleEvents: true,
        maxResults: 150,
        orderBy: 'startTime',
      });

      const gEvents = response.result?.items || [];

      for (const ev of gEvents) {
        if (!ev.summary) continue;

        let datePart = '';
        let timePart = '09:00';

        if (ev.start?.dateTime) {
          datePart = ev.start.dateTime.slice(0, 10);
          timePart = ev.start.dateTime.slice(11, 16);
        } else if (ev.start?.date) {
          datePart = ev.start.date.slice(0, 10);
          timePart = 'Dia todo';
        }

        if (!datePart) continue;

        let cat: CalendarEvent['category'] = 'Trabalho';
        const txt = (ev.summary + ' ' + (cal.summary || '')).toLowerCase();
        if (txt.includes('fono') || txt.includes('viagem') || txt.includes('pessoal') || txt.includes('boticário') || txt.includes('aniversário')) {
          cat = 'Pessoal';
        } else if (txt.includes('sabesp') || txt.includes('conta') || txt.includes('venc') || txt.includes('pagar') || txt.includes('banco')) {
          cat = 'Financeiro';
        } else if (txt.includes('iron man') || txt.includes('treino') || txt.includes('esporte') || txt.includes('corrida') || txt.includes('natação')) {
          cat = 'Esporte';
        } else if (txt.includes('família') || txt.includes('joca') || txt.includes('casa') || txt.includes('escola')) {
          cat = 'Família';
        }

        collectedEvents.push({
          id: `gcal-${ev.id}`,
          title: ev.summary,
          date: datePart,
          time: timePart,
          category: cat,
          gcal_id: ev.id,
          description: ev.description || '',
        });
      }
    } catch (calErr) {
      console.warn(`Erro ao listar calendário ${cal.id}:`, calErr);
    }
  }

  return collectedEvents;
}

export async function addEventToGoogleCalendarRemote(eventObj: CalendarEvent): Promise<string | null> {
  if (!currentAccessToken || !window.gapi?.client?.calendar) return null;
  try {
    const startDateTime = `${eventObj.date}T${eventObj.time === 'Dia todo' ? '08:00' : eventObj.time}:00-03:00`;
    const hourNum = eventObj.time === 'Dia todo' ? 9 : parseInt(eventObj.time.slice(0, 2), 10) + 1;
    const endDateTime = `${eventObj.date}T${String(hourNum).padStart(2, '0')}:${eventObj.time.slice(3, 5) || '00'}:00-03:00`;

    const res = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: eventObj.title,
        description: eventObj.description || `Categoria: ${eventObj.category} (Adicionado via CENTRAL)`,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      },
    });

    return res.result?.id || null;
  } catch (err) {
    console.warn('Erro ao inserir evento no Google Calendar:', err);
    return null;
  }
}
