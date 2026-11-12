// Noche del Pozo: premios semanales en Shadow retirable (USDT/USDC) para el top 5. Servidor: repo de Mutantes server/src/routes/pozos.ts.
// Igual para todos: Machetero sin talentos ni arma de la Piñata, sin maldiciones, hasta 15 minutos. El servidor revisa el registro
// de la partida (tiempo real, cazas por minuto, jefes) en server/src/pozo/leyendas.ts.
import { api } from './cuenta.js';
import { SH } from './moneda.js';
import { nube, loginUrl } from './nube.js';

export const POZO_NDL = { maxT: 900, cpEvery: 60, pts: { kill: 1, sec: 5, boss: 300 } };
export const pozoScore = (t, kills, bosses) => kills * POZO_NDL.pts.kill + Math.floor(t) * POZO_NDL.pts.sec + bosses * POZO_NDL.pts.boss;
export const finishPozo = (attemptId, log) => api('/pozo/leyendas/finish', { method: 'POST', body: JSON.stringify({ attemptId, log }) });
const usd = (s) => (s / 10).toFixed(2);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Ventana del Pozo: premios, ranking y botón para jugar. `onPlay(intento)` arranca la partida. */
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
  const head = '<h2>💰 Noche del Pozo</h2><p class="pzsub">Premios en Shadow que puedes cambiar a USDT o USDC</p>';
  const rules = '<p class="pzr">Todos con el Machetero, sin talentos ni arma de la Piñata · hasta 15 min · 3 intentos al día · gana tu mejor partida · premios cada lunes al top 5<br>Puntos: 1 por enemigo, 5 por segundo vivo, 300 por jefe</p>';
  if (!nube.on) {
    inn.innerHTML = head + (nube.can ? '<p>Para jugar el Pozo inicia sesión con tu cuenta DarkShadow.</p><button class="obtn main" id="pzLogin"><span>Iniciar sesión</span></button>' : '<p>El Pozo se juega en leyendas.darkshadow-studios.com</p>') + rules;
    const l = document.getElementById('pzLogin'); if (l) l.onclick = () => { location.href = loginUrl(); };
    return;
  }
  inn.innerHTML = head + '<p>Cargando…</p>';
  let d;
  try { d = await api('/pozo/leyendas'); } catch (e) { inn.innerHTML = head + `<p>${esc(e.message)}</p>`; return; }
  const hrs = Math.max(0, Math.round((new Date(d.endsAt).getTime() - Date.now()) / 3600e3));
  inn.innerHTML = head +
    `<div class="pzprizes">${['🥇', '🥈', '🥉', '4º', '5º'].map((m, i) => `<div><b>${m}</b><span>${d.prizes[i] || 0}${SH}</span><small>${usd(d.prizes[i] || 0)} USD</small></div>`).join('')}</div>` +
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
