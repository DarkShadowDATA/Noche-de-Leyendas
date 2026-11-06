// Guardado en la nube y boletos con Shadow (cuenta DarkShadow). Todo es opcional: sin cuenta o sin internet no pasa nada.
import { initCuenta, api, onStudio, user, loginUrl, shadowUrl } from './cuenta.js';
import { save, mergeSaves, replaceSave, onPersist } from './save.js';
export { loginUrl, shadowUrl };

// on = sesión iniciada · can = se puede iniciar aquí (en el dominio del estudio y no dentro de itch)
export const nube = { on: false, can: false, name: '', boletos: 0, shadow: 0, packs: [], rev: 0, state: '' };
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
