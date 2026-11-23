// Guardado en la nube y boletos con Shadow (cuenta DarkShadow). Todo es opcional: sin cuenta o sin internet no pasa nada.
import { initCuenta, api, onStudio, user, loginUrl, shadowUrl, DEVAPI } from './cuenta.js';
import { save, mergeSaves, replaceSave, onPersist } from './save.js';
export { loginUrl, shadowUrl, api };
/** Sube el guardado pronto (después de usar un arma de la bodega, por ejemplo). */
export function sync() { schedule(); }

// on = sesión iniciada · can = se puede iniciar aquí (en el dominio del estudio y no dentro de itch)
export const nube = { on: false, can: false, name: '', boletos: 0, shadow: 0, packs: [], rev: 0, state: '', tienda: [], compras: {}, bendicion: 0, dt: 0, usados: 0, aspectos: null, mercado: false };
let listeners = [];
export function onNube(fn) { listeners.push(fn); }
const changed = () => listeners.forEach(f => { try { f(); } catch (e) { /* nada */ } });

let timer = null, pushing = false, again = false;
function schedule() { if (!nube.on) return; clearTimeout(timer); timer = setTimeout(push, 1500); }

async function push() {
  if (pushing) { again = true; return; }
  pushing = true;
  try {
    const r = await api('/ndl/save', { method: 'PUT', body: JSON.stringify({ rev: nube.rev, save }) });
    nube.rev = r.rev; nube.state = 'ok';
  } catch (e) {
    if (e.status === 409 && e.data && e.data.save) { // otro celular guardó antes: juntar y volver a subir
      replaceSave(mergeSaves(save, e.data.save)); nube.rev = e.data.rev; localSave(); again = true;
    } else nube.state = 'offline';
  }
  pushing = false; changed();
  if (again) { again = false; schedule(); }
}
function localSave() { try { localStorage.setItem('ndl_save_v1', JSON.stringify(save)); } catch (e) { /* nada */ } }

export async function startNube() {
  nube.can = onStudio() && window.top === window.self;
  const u = await initCuenta();
  if (!u) { changed(); return; }
  try {
    const r = await api('/ndl/save');
    nube.on = true; nube.name = user.name; nube.rev = r.rev; nube.boletos = r.boletos; nube.shadow = r.shadow; nube.packs = r.packs;
    nube.tienda = r.tienda || []; nube.compras = r.compras || {}; nube.bendicion = r.bendicion || 0; nube.dt = r.now ? r.now - Date.now() : 0;
    nube.usados = r.usados || 0; nube.aspectos = Array.isArray(r.aspectos) ? r.aspectos : null; nube.mercado = !!r.mercado;
    if (r.save) { replaceSave(mergeSaves(save, r.save)); localSave(); }
    onPersist(schedule);
    await push();
  } catch (e) { nube.state = 'offline'; }
  changed();
}

export async function buyBoletos(pack) {
  const r = await api('/ndl/boletos', { method: 'POST', body: JSON.stringify({ pack }) });
  nube.boletos = r.boletos; nube.shadow = r.shadow; changed();
  return r;
}

/** Tienda con Shadow (Paquete de inicio, Bendición): el servidor cobra y dice qué quedó comprado. */
export async function buyItem(item) {
  const r = await api('/ndl/comprar', { method: 'POST', body: JSON.stringify({ item }) });
  nube.boletos = r.boletos; nube.shadow = r.shadow; nube.compras = r.compras || {}; nube.bendicion = r.bendicion || 0; nube.dt = r.now ? r.now - Date.now() : nube.dt;
  if (Array.isArray(r.aspectos)) nube.aspectos = r.aspectos;
  changed();
  return r;
}

/** Tirada con boletos decidida en el servidor (solo con el mercado abierto): devuelve los objetos, que quedan en la bodega. */
export async function pinataSrv(n) {
  const r = await api('/ndl/pinata', { method: 'POST', body: JSON.stringify({ n }) });
  nube.boletos = r.boletos; nube.usados = r.usados;
  return r.items;
}

// ---- Ventana «Comprar Shadow» del estudio (https://darkshadow-studios.com/ds-tienda.js, 23 nov 2026) ----
// Solo se abre desde la tienda (perfil o Piñata), nunca en medio de la partida ni al perder.
const PEND = 'ndl_compra_pendiente';
const dsOpts = () => DEVAPI ? { api: DEVAPI, headers: { 'x-dev-user': '4242' } } : {};
const setShadow = (s) => { if (typeof s === 'number' && s !== nube.shadow) { nube.shadow = s; changed(); } };
let finisher = null; // (pendiente, saldo) => termina la compra que faltaba
/** El juego registra cómo terminar una compra que se quedó esperando Shadow. */
export function alTerminarCompra(fn) { finisher = fn; }
function terminar(saldo) {
  let p = null; try { p = JSON.parse(localStorage.getItem(PEND) || 'null'); } catch (e) { /* nada */ }
  if (!p || Date.now() - p.t > 3 * 3600e3) { try { localStorage.removeItem(PEND); } catch (e) { /* nada */ } return; }
  if (typeof saldo === 'number' && saldo >= p.precio && finisher) { try { localStorage.removeItem(PEND); } catch (e) { /* nada */ } finisher(p, saldo); }
}
/** Abre la ventana del estudio. falta = Shadow que faltan; pendiente = { tipo, id, precio } para comprarlo solo al llegar la Shadow. */
export function comprarShadow({ falta = 0, modo, pendiente, alTerminar } = {}) {
  const D = window.DSTienda;
  if (!D) { window.top.location.href = shadowUrl(); return; } // el script no cargó: la tienda de la cuenta
  if (pendiente) { try { localStorage.setItem(PEND, JSON.stringify({ ...pendiente, t: Date.now() })); } catch (e) { /* nada */ } }
  else if (modo !== 'apoyar') { try { localStorage.removeItem(PEND); } catch (e) { /* nada */ } }
  D.abrir({ juego: 'leyendas', lang: 'es', falta: Math.max(0, Math.ceil(falta)), modo, ...dsOpts(),
    alTerminar: (s) => { setShadow(s); if (alTerminar) alTerminar(s); terminar(s); } });
}
// Regreso de una pestaña de pago o de OXXO (…?pago=<orden>): pedir el saldo otra vez y terminar la compra pendiente.
window.addEventListener('dstienda:pago', async () => {
  const D = window.DSTienda; if (!D) return;
  const s = await D.saldo({ juego: 'leyendas', ...dsOpts() });
  setShadow(s); terminar(s);
  try { const u = new URL(location.href); u.searchParams.delete('pago'); history.replaceState(null, '', u); } catch (e) { /* nada */ }
});
