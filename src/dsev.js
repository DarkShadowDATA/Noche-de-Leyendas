// Analítica anónima de DarkShadow Studios (igual en los 3 juegos): sin cookies, sin correo, sin IP guardada.
// Cuenta cuándo se abre el juego (game_opened), cuándo ya se ve el título (title_shown, con lo que tardó en cargar)
// y cuándo empieza de verdad una partida (game_started). ?c=<código del video> dice qué video trajo la visita.
// vid = número al azar de este navegador (no se crea si el navegador pide no ser rastreado); sid = la visita.
// Pruebas: en localhost no manda nada; con ?test=1 (o los modos de prueba del juego) manda marcado como prueba.
// El dueño: abrir el juego una vez con ?yo=1 marca ese navegador para siempre (sus visitas ya no cuentan).
const EV_URL = 'https://darkshadow-studios.com/api/ev';
const Q = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
const NET = { tiktok: 'tt', tt: 'tt', youtube: 'yt', yt: 'yt', instagram: 'ig', ig: 'ig', facebook: 'fb', fb: 'fb', reddit: 'rd', rd: 'rd',
  itch: 'itch', discord: 'dc', dc: 'dc', telegram: 'canal', canal: 'canal', grupo: 'grupo', estudio: 'estudio', fm: 'fm', ac: 'ac', otro: 'otro' };
const REF = [[/tiktok\./, 'tt'], [/youtube\.|youtu\.be/, 'yt'], [/instagram\./, 'ig'], [/facebook\.|fb\.com|fb\.me/, 'fb'], [/reddit\./, 'rd'],
  [/itch\.(io|zone)/, 'itch'], [/discord\./, 'dc'], [/t\.me|telegram\./, 'canal'], [/darkshadow-studios\.com/, 'estudio']];

function fromReferrer() {
  try { const h = new URL(document.referrer).hostname; if (h && h !== location.hostname) { const m = REF.find(([re]) => re.test(h)); return m ? m[1] : 'otro'; } } catch (e) { /* sin referrer */ }
  return '';
}
/** De dónde llegó: ?src= / ?utm_source= / ?ref= o, si no trae nada, la página anterior. */
export const dsSrc = NET[(Q.get('src') || Q.get('utm_source') || Q.get('ref') || '').toLowerCase()] || fromReferrer() || 'directo';
/** Código del video o campaña (?c=nl-0112-a) que trajo la visita; se recuerda durante la visita. */
export const dsCamp = (() => {
  const c = (Q.get('c') || '').toLowerCase();
  try { if (/^[a-z0-9-]{1,24}$/.test(c)) { sessionStorage.setItem('ds_c', c); return c; } return sessionStorage.getItem('ds_c') || undefined; }
  catch (e) { return /^[a-z0-9-]{1,24}$/.test(c) ? c : undefined; }
})();
/** Si el juego se abrió desde la página del estudio (sus botones agregan ?via=estudio). */
export const dsVia = Q.get('via') === 'estudio' || /^https:\/\/darkshadow-studios\.com\/?(\?|#|$)/.test(document.referrer) ? 'estudio' : undefined;

const LOCAL = /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(location.hostname) || !location.hostname;
const YO = (() => { try { if (Q.has('yo')) localStorage.setItem('ds_yo', '1'); return localStorage.getItem('ds_yo') === '1'; } catch (e) { return Q.has('yo'); } })();
const TEST = YO || ['test', 'capture', 'nostats', 'god', 'auto', 'dev', 't'].some(k => Q.has(k));
// «Desde la página» cuenta una sola vez por llegada: no al recargar ni al volver atrás, y solo en la primera apertura y la primera partida.
const NAV = (() => { try { return (performance.getEntriesByType('navigation')[0] || {}).type || ''; } catch (e) { return ''; } })();
const VIA = dsVia && NAV !== 'reload' && NAV !== 'back_forward' ? dsVia : undefined;
const viaUsed = {};
const NOTRACK = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
const rid = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

function vid() {
  if (NOTRACK) return undefined;
  try { let v = localStorage.getItem('ds_vid'); if (!v || !/^[a-z0-9]{8,32}$/.test(v)) { v = rid(); localStorage.setItem('ds_vid', v); } return v; } catch (e) { return undefined; }
}
let memSid = '';
function sid() {
  try {
    const now = Date.now(); let s = sessionStorage.getItem('ds_sid'); const t = Number(sessionStorage.getItem('ds_sid_t') || 0);
    if (!s || now - t > 30 * 60 * 1000) s = rid();                       // visita nueva tras 30 min sin actividad
    sessionStorage.setItem('ds_sid', s); sessionStorage.setItem('ds_sid_t', String(now)); return s;
  } catch (e) { return memSid || (memSid = rid()); }
}
const device = () => (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (matchMedia('(pointer: coarse)').matches && innerWidth < 1024)) ? 'mobile' : 'desktop';

/** Manda un evento. Nunca lanza error ni frena el juego. `extra` = datos del evento (title_shown manda { ms }). */
export function dsTrack(ev, game, url = EV_URL, extra = {}) {
  if (LOCAL) return;
  try {
    const via = VIA && !viaUsed[ev] ? (viaUsed[ev] = true, VIA) : undefined;
    const body = JSON.stringify({ ev, game, src: dsSrc, via, dev: device(), path: location.pathname.slice(0, 80), vid: vid(), sid: sid(), test: TEST || undefined, camp: dsCamp, ...extra });
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))))
      fetch(url, { method: 'POST', body, keepalive: true, mode: 'no-cors', headers: { 'content-type': 'text/plain' } }).catch(() => {});
  } catch (e) { /* sin red: no pasa nada */ }
}
