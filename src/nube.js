// Guardado en la nube y boletos con Shadow (cuenta DarkShadow). Todo es opcional: sin cuenta o sin internet no pasa nada.
import { initCuenta, api, onStudio, user, loginUrl, shadowUrl } from './cuenta.js';
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
