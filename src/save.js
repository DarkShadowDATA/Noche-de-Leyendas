// Noche de Leyendas: guardado en el celular (localStorage) y, con cuenta DarkShadow, también en la nube del estudio.
const KEY = 'ndl_save_v1';
const DEF = () => ({
  flores: 0, ganadas: 0, tal: {}, cazadores: ['machetero', 'curandera'], dia: '', partidas: 0, mejor: 0, victorias: 0,
  armas: {}, equipo: '', pin: { n: 0, pe: 0, pl: 0, dia: '' }, boletosUsados: 0, evos: [],
});

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s) return DEF();
    const d = Object.assign(DEF(), s); d.pin = Object.assign(DEF().pin, s.pin || {}); return d;
  } catch (e) { return DEF(); }
}
export const save = read();
let onChange = null;
export function onPersist(fn) { onChange = fn; }
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* sin espacio o bloqueado */ }
  if (onChange) onChange();
}
export const tl = (id) => save.tal[id] || 0;
export const today = () => { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); } catch (e) { return new Date().toISOString().slice(0, 10); } };

/** Junta el guardado del celular con el de la nube sin perder nada: la base es el que más flores ha ganado; talentos, cazadores y armas se suman al mejor. */
export function mergeSaves(a, b) {
  if (!b) return a;
  const base = JSON.parse(JSON.stringify((b.ganadas || 0) > (a.ganadas || 0) ? b : a)), o = base === a ? b : a;
  const out = Object.assign(DEF(), base); out.pin = Object.assign(DEF().pin, base.pin || {});
  for (const [k, v] of Object.entries(o.tal || {})) out.tal[k] = Math.max(out.tal[k] || 0, v);
  for (const h of o.cazadores || []) if (!out.cazadores.includes(h)) out.cazadores.push(h);
  for (const v of o.evos || []) if (!out.evos.includes(v)) out.evos.push(v);
  for (const [k, v] of Object.entries(o.armas || {})) {
    const m = out.armas[k];
    if (!m || v.r > m.r || (v.r === m.r && (v.e || 0) > (m.e || 0))) out.armas[k] = { r: v.r, e: v.e || 0 };
  }
  for (const k of ['partidas', 'mejor', 'victorias', 'boletosUsados']) out[k] = Math.max(out[k] || 0, o[k] || 0);
  out.pin.n = Math.max(out.pin.n || 0, (o.pin && o.pin.n) || 0);
  if (o.pin && (o.pin.dia || '') > (out.pin.dia || '')) out.pin.dia = o.pin.dia;
  if ((o.dia || '') > (out.dia || '')) out.dia = o.dia;
  if (out.equipo && !out.armas[out.equipo]) out.equipo = '';
  return out;
}
export function replaceSave(s) { for (const k of Object.keys(save)) delete save[k]; Object.assign(save, s); }

// Partida a medias (se guarda cada 3 s y al salir de la app)
export const RUN_KEY = 'ndl_run_v1';
export function readRun() { try { const r = JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); return r && r.v === 1 ? r : null; } catch (e) { return null; } }
export function clearRun() { try { localStorage.removeItem(RUN_KEY); } catch (e) { /* nada */ } }
