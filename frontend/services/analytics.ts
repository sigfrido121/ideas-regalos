// Analítica propia, sin terceros ni cookies: eventos anónimos a /api/events.
// sessionId dura la pestaña; visitorId queda en localStorage para medir si alguien vuelve.

const SESSION_KEY = 'regalitos_sid';
const VISITOR_KEY = 'regalitos_vid';

const nuevoId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

const leer = (storage: Storage, key: string): string => {
  try {
    let v = storage.getItem(key);
    if (!v) {
      v = nuevoId();
      storage.setItem(key, v);
    }
    return v;
  } catch {
    return nuevoId();
  }
};

export const sessionId = leer(sessionStorage, SESSION_KEY);
export const visitorId = leer(localStorage, VISITOR_KEY);

type Meta = Record<string, string | number | boolean>;
type Evento = {
  type: string;
  sessionId: string;
  visitorId: string;
  path?: string;
  userId?: string;
  giftId?: string;
  meta?: Meta;
};

let cola: Evento[] = [];
let programado: number | null = null;

const enviar = (): void => {
  if (cola.length === 0) return;
  const lote = cola.splice(0, 20);
  const body = JSON.stringify(lote);
  try {
    // sendBeacon sobrevive al cierre de pestaña; fetch keepalive es el fallback
    const blob = new Blob([body], { type: 'application/json' });
    if (!navigator.sendBeacon?.('/api/events', blob)) {
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
};

const programar = (): void => {
  if (programado) return;
  programado = window.setTimeout(() => {
    programado = null;
    enviar();
  }, 4000);
};

export const track = (type: string, meta?: Meta, extra?: { userId?: string; giftId?: string }): void => {
  cola.push({
    type,
    sessionId,
    visitorId,
    path: (typeof location !== 'undefined' ? location.pathname + location.hash : '').slice(0, 120),
    userId: extra?.userId,
    giftId: extra?.giftId,
    meta,
  });
  if (cola.length >= 10) enviar();
  else programar();
};

let iniciado = false;

export const initAnalytics = (): void => {
  if (iniciado) return;
  iniciado = true;

  track('app_open');

  // Tiempo real de uso: latido cada 30 s mientras la pestaña está visible
  window.setInterval(() => {
    if (document.visibilityState === 'visible') track('heartbeat', { seconds: 30 });
  }, 30000);

  const cerrar = (): void => {
    if (document.visibilityState === 'hidden') {
      track('page_time', { seconds: 0 });
      enviar();
    }
  };
  document.addEventListener('visibilitychange', cerrar);
  window.addEventListener('pagehide', () => { cerrar(); enviar(); });

  // Clics en enlaces de comentarios: mide qué tiendas interesan
  document.addEventListener(
    'click',
    (ev) => {
      const target = ev.target as HTMLElement | null;
      const ancla = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!ancla || ancla.target !== '_blank') return;
      try {
        const url = new URL(ancla.href);
        track('link_clicked', { host: url.host.replace(/^www\./, ''), url: ancla.href.slice(0, 200) });
      } catch {
        /* href inválido, ignorar */
      }
    },
    true
  );
};
