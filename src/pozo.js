// Reto semanal (antes «Noche del Pozo»; desde el 22 nov 2026 sin premios en Shadow, para poder anunciar el juego en Facebook e Instagram).
// Mismo ranking y top 10; el premio es del juego: flores para el top 10 de la semana pasada, que se cobran al abrir el Reto o el juego.
// Servidor: repo de Mutantes server/src/routes/pozos.ts (el premio en Shadow del servidor quedó apagado con app_kv `pozo_leyendas`).
// Igual para todos: Machetero sin talentos ni arma de la Piñata, sin maldiciones, hasta 15 minutos. El servidor revisa el registro
// de la partida (tiempo real, cazas por minuto, jefes) en server/src/pozo/leyendas.ts.
import { api } from './cuenta.js';
import { save, persist } from './save.js';
import { nube, loginUrl } from './nube.js';

export const POZO_NDL = { maxT: 900, cpEvery: 60, pts: { kill: 1, sec: 5, boss: 300 } };
export const pozoScore = (t, kills, bosses) => kills * POZO_NDL.pts.kill + Math.floor(t) * POZO_NDL.pts.sec + bosses * POZO_NDL.pts.boss;
export const finishPozo = (attemptId, log) => api('/pozo/leyendas/finish', { method: 'POST', body: JSON.stringify({ attemptId, log }) });
/** Premio del Reto semanal (solo del juego): flores según tu lugar de la semana pasada. */
export const RETO_PREMIO = [600, 400, 300, 150, 150, 150, 150, 150, 150, 150];
const RETO_TXT = ['🥇', '🥈', '🥉', '4º–10º'];
/** Si quedaste en el top 10 la semana pasada y no lo has cobrado, suma las flores. Devuelve { rank, flores } o null. */
export function cobrarReto(prev) {
  if (!prev || !prev.rank || prev.rank > RETO_PREMIO.length || save.retoCobrado === prev.week) return null;
  const flores = RETO_PREMIO[prev.rank - 1];
  save.flores += flores; save.ganadas = (save.ganadas || 0) + flores; save.retoCobrado = prev.week; persist();
  return { rank: prev.rank, flores };
}
/** Al abrir el juego con sesión: cobra en silencio el premio de la semana pasada (el aviso sale con `onPremio`). */
export async function revisarReto(onPremio) {
  if (!nube.on) return;
  try { const d = await api('/pozo/leyendas'); const p = cobrarReto(d.prev); if (p && onPremio) onPremio(p); } catch (e) { /* sin internet: se cobra la próxima vez */ }
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Ventana del Reto semanal: premio del juego, ranking y botón para jugar. `onPlay(intento)` arranca la partida. */
export async function openPozo(onPlay) {
  let box = document.getElementById('pozoBox');
  if (!box) {
    box = document.createElement('div'); box.id = 'pozoBox'; box.className = 'modal';
    box.innerHTML = '<div class="frame pozo"><div class="in mbody"><button class="btn alt small pzx" type="button">✕</button><div class="pzin"></div></div></div>';
    document.body.appendChild(box);
    box.querySelector('.pzx').onclick = () => box.classList.add('hidden');
  }
  const inn = box.querySelector('.pzin');
  box.classList.remove('hidden');
  const head = '<h2>🏅 Reto semanal</h2><p class="pzsub">Todos con el Machetero · el top 10 gana flores cada lunes</p>';
  const rules = '<p class="pzr">Todos con el Machetero, sin talentos ni arma de la Piñata · hasta 15 min · 3 intentos al día · cuenta tu mejor partida · cada lunes el top 10 gana flores 🌼 (se cobran al abrir el juego)<br>Puntos: 1 por enemigo, 5 por segundo vivo, 300 por jefe</p>';
  if (!nube.on) {
    inn.innerHTML = head + (nube.can ? '<p>Para jugar el Reto inicia sesión con tu cuenta DarkShadow.</p><button class="obtn main" id="pzLogin"><span>Iniciar sesión</span></button>' : '<p>El Reto semanal se juega en leyendas.darkshadow-studios.com</p>') + rules;
    const l = document.getElementById('pzLogin'); if (l) l.onclick = () => { location.href = loginUrl(); };
    return;
  }
  inn.innerHTML = head + '<p>Cargando…</p>';
  let d;
  try { d = await api('/pozo/leyendas'); } catch (e) { inn.innerHTML = head + `<p>${esc(e.message)}</p>`; return; }
  const hrs = Math.max(0, Math.round((new Date(d.endsAt).getTime() - Date.now()) / 3600e3));
  const cobro = cobrarReto(d.prev);
  inn.innerHTML = head +
    (cobro ? `<p class="pzwin">🎉 La semana pasada quedaste <b>#${cobro.rank}</b>: ¡+${cobro.flores} 🌼!</p>` : '') +
    `<div class="pzprizes">${RETO_TXT.map((m, i) => `<div><b>${m}</b><span>${RETO_PREMIO[i]} 🌼</span><small>flores</small></div>`).join('')}</div>` +
    `<p>Termina en ${hrs >= 24 ? `${Math.floor(hrs / 24)} d ${hrs % 24} h` : `${hrs} h`} · tu mejor: <b>${d.best}</b>${d.rank ? ` (#${d.rank})` : ''}</p>` +
    (d.top.length ? `<ol class="pztop">${d.top.map((t) => `<li class="${t.me ? 'me' : ''}"><span>${t.rank}. ${esc(t.name)}${t.me ? ' (tú)' : ''}</span><b>${t.score}</b></li>`).join('')}</ol>` : '<p>¡Nadie ha jugado esta semana! Sé el primero.</p>') +
    `<button class="obtn main" id="pzGo" ${d.attemptsLeft ? '' : 'disabled'}><span>${d.attemptsLeft ? `¡A cazar! (${d.attemptsLeft} hoy)` : 'Sin intentos: vuelve mañana'}</span></button><p class="pzmsg" id="pzMsg"></p>` + rules;
  const go = document.getElementById('pzGo');
  go.onclick = async () => {
    if (!d.attemptsLeft || go.disabled) return;
    go.disabled = true;
    try { const a = await api('/pozo/leyendas/start', { method: 'POST', body: '{}' }); box.classList.add('hidden'); onPlay(a); }
    catch (e) { document.getElementById('pzMsg').textContent = e.message; go.disabled = false; }
  };
}

// ---------- Cazador de la semana (ranking sin premios; servidor: server/src/routes/ndl-cazador.ts, migración 059) ----------
// Cada lunes le toca un cazador por turno y todos juegan con él con las reglas del Pozo (sin talentos, sin arma de la Piñata,
// sin maldiciones, El Pueblo, hasta 15 min). Intentos ilimitados: cuenta tu mejor partida. Da las flores normales de la noche.
export const finishCazador = (attemptId, log) => api('/ndl/cazador/finish', { method: 'POST', body: JSON.stringify({ attemptId, log }) });
export async function openCazador(onPlay, H) {
  let box = document.getElementById('pozoBox');
  if (!box) {
    box = document.createElement('div'); box.id = 'pozoBox'; box.className = 'modal';
    box.innerHTML = '<div class="frame pozo"><div class="in mbody"><button class="btn alt small pzx" type="button">✕</button><div class="pzin"></div></div></div>';
    document.body.appendChild(box);
    box.querySelector('.pzx').onclick = () => box.classList.add('hidden');
  }
  const inn = box.querySelector('.pzin');
  box.classList.remove('hidden');
  const head = '<h2>🏆 Cazador de la semana</h2><p class="pzsub">Todos con el mismo cazador · ranking semanal</p>';
  const rules = '<p class="pzr">Sin talentos, sin arma de la Piñata y sin maldiciones · El Pueblo · hasta 15 min · intentos ilimitados: cuenta tu mejor partida · cada lunes cambia el cazador<br>Puntos: 1 por enemigo, 5 por segundo vivo, 300 por jefe · da las flores normales de la noche</p>';
  if (!nube.on) {
    inn.innerHTML = head + (nube.can ? '<p>Para entrar al ranking inicia sesión con tu cuenta DarkShadow.</p><button class="obtn main" id="czLogin"><span>Iniciar sesión</span></button>' : '<p>El ranking se juega en leyendas.darkshadow-studios.com</p>') + rules;
    const l = document.getElementById('czLogin'); if (l) l.onclick = () => { location.href = loginUrl(); };
    return;
  }
  inn.innerHTML = head + '<p>Cargando…</p>';
  let d;
  try { d = await api('/ndl/cazador'); } catch (e) { inn.innerHTML = head + `<p>${esc(e.message)}</p>`; return; }
  const hrs = Math.max(0, Math.round((new Date(d.endsAt).getTime() - Date.now()) / 3600e3));
  const img = H.img(d.hunter);
  inn.innerHTML = head +
    `<div class="czhero">${img ? `<img src="${img}" alt="">` : ''}<div><b>${esc(H.name(d.hunter))}</b><small>Termina en ${hrs >= 24 ? `${Math.floor(hrs / 24)} d ${hrs % 24} h` : `${hrs} h`} · el lunes: ${esc(H.name(d.next))}</small></div></div>` +
    `<p>Tu mejor: <b>${d.best}</b>${d.rank ? ` (#${d.rank} de ${d.total})` : ''}</p>` +
    (d.top.length ? `<ol class="pztop">${d.top.map((t) => `<li class="${t.me ? 'me' : ''}"><span>${t.rank}. ${esc(t.name)}${t.me ? ' (tú)' : ''}</span><b>${t.score}</b></li>`).join('')}</ol>` : '<p>¡Nadie ha jugado esta semana! Sé el primero.</p>') +
    `<button class="obtn main" id="czGo"><span>¡A cazar!</span></button><p class="pzmsg" id="czMsg"></p>` + rules;
  const go = document.getElementById('czGo');
  go.onclick = async () => {
    if (go.disabled) return;
    go.disabled = true;
    try { const a = await api('/ndl/cazador/start', { method: 'POST', body: '{}' }); box.classList.add('hidden'); onPlay({ ...a, kind: 'cazador' }); }
    catch (e) { document.getElementById('czMsg').textContent = e.message; go.disabled = false; }
  };
}
