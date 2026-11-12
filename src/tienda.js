// Tienda de Noche de Leyendas con Shadow (cuenta DarkShadow): Paquete de inicio y Bendición de la Ofrenda.
// Reglas (claude/pagos-y-mercado.md): nunca en medio de la partida, nada de poder exclusivo y no cuenta en la Noche del Pozo.
import { SH, SH_QUE } from './moneda.js';
import { save, persist } from './save.js';
import { nube, buyItem, loginUrl, shadowUrl } from './nube.js';
import { HUNTER_COST, ASPECTOS, HUNTERS } from './data.js';

const $ = (id) => document.getElementById(id);
const DAY = 86400000;

/** La Bendición se guarda también en el celular para que siga contando sin internet. */
export const bendActiva = () => (save.bendHasta || 0) > Date.now();
export const bendDias = () => Math.max(0, Math.ceil(((save.bendHasta || 0) - Date.now()) / DAY));
export const inicioComprado = () => !!(nube.compras && nube.compras.inicio);
/** La tarjeta del Paquete de inicio sale en «Jugar» después de la primera victoria, una sola vez (se puede cerrar). */
export const ofrecerInicio = () => (nube.on || nube.can) && (save.victorias || 0) >= 1 && !inicioComprado() && !save.inicioVisto;

/** Pasa al guardado lo comprado en el servidor. Se llama al entrar y después de cada compra. Devuelve un texto si entregó algo. */
export function aplicarCompras() {
  let msg = '', ch = false;
  const hasta = nube.bendicion ? nube.bendicion - (nube.dt || 0) : 0; // hora del servidor → hora de este celular
  if (hasta > (save.bendHasta || 0) + 60000) { save.bendHasta = hasta; ch = true; }
  if (inicioComprado() && !save.inicioOk) {
    const it = (nube.tienda || []).find(t => t.id === 'inicio') || { flores: 500, cazador: 'luchadora' };
    let fl = it.flores || 0;
    if (it.cazador && !save.cazadores.includes(it.cazador)) save.cazadores.push(it.cazador);
    else if (it.cazador) fl += HUNTER_COST[it.cazador] || 0; // ya la tenía: se le regresa su precio en flores
    save.flores += fl; save.inicioOk = true; ch = true;
    msg = `¡Paquete de inicio! +${fl} 🌼, 5 boletos${fl > (it.flores || 0) ? '' : ' y la Luchadora'}`;
  }
  // Aspectos: el servidor dice cuáles tiene la cuenta (son objetos: se pueden vender en el mercado). Con un servidor viejo, se usa `compras`.
  const tiene = (k, A) => Array.isArray(nube.aspectos) ? nube.aspectos.includes(k) : !!(nube.compras && nube.compras[A.item]);
  if (nube.on && Array.isArray(nube.aspectos)) { // los que ya no tiene (vendidos o a la venta) se quitan
    const keep = (save.aspectos || []).filter(k => nube.aspectos.includes(k));
    if (keep.length !== (save.aspectos || []).length) { save.aspectos = keep; ch = true; }
  }
  for (const [k, A] of Object.entries(ASPECTOS)) { // aspectos nuevos: se guardan en el celular y se ponen solos la primera vez
    if (tiene(k, A) && !(save.aspectos || []).includes(k)) {
      save.aspectos = [...(save.aspectos || []), k]; save.aspecto = { ...(save.aspecto || {}), [A.cazador]: k }; ch = true;
      msg = `¡Aspecto ${A.name} listo! Ya lo trae ${HUNTERS[A.cazador].name}`;
    }
  }
  if (ch) persist();
  return msg;
}

let note = '', imgs = {};
export function setTiendaImgs(m) { imgs = m; }
/** El aspecto que trae puesto un cazador (o '' si usa el normal). */
export const aspectoDe = (id) => { const k = save.aspecto && save.aspecto[id]; return k && ASPECTOS[k] && ASPECTOS[k].cazador === id && (save.aspectos || []).includes(k) ? k : ''; };
export function renderTienda(onChange) {
  const el = $('shopBox'); if (!el) return;
  if (!nube.on) {
    el.innerHTML = nube.can
      ? `<div class="shop-note">Aquí puedes apoyar el juego con Shadow (opcional). Todo lo que da ventaja también se consigue jugando.</div><a class="obtn" href="${loginUrl()}" target="_top">👤 Iniciar sesión</a>`
      : `<div class="shop-note">La tienda con Shadow está en <b>leyendas.darkshadow-studios.com</b>, con tu cuenta DarkShadow.</div>`;
    return;
  }
  const T = nube.tienda || [], card = (id, ico, desc, state) => {
    const it = T.find(t => t.id === id); if (!it) return '';
    return `<div class="shop-it"><span class="ic">${ico}</span><span class="tx"><b>${it.nombre}</b>${desc}</span>` +
      (state || `<button class="obtn" data-buy="${id}">${it.shadow}${SH}</button>`) + `</div>`;
  };
  el.innerHTML =
    card('inicio', '🎁', 'La Luchadora, 5 boletos de la Piñata y 500 🌼. Una sola vez.', inicioComprado() ? '<span class="ok">✔ Tuyo</span>' : '') +
    card('bendicion', '🕯️', bendActiva() ? `Flores ×2 al terminar cada noche. <i>Activa: te quedan ${bendDias()} días.</i>` : 'Flores ×2 al terminar cada noche, por 30 días. No cuenta en la Noche del Pozo.', '') +
    Object.entries(ASPECTOS).map(([k, A]) => card(A.item, `<img src="${imgs['retrato_' + k] || ''}" alt="">`, `Aspecto para ${HUNTERS[A.cazador].name}. Solo cambia cómo se ve.`, (save.aspectos || []).includes(k) ? '<span class="ok">✔ Tuyo</span>' : '')).join('') +
    `<div class="shop-bal">Tienes <b>${nube.shadow} ${SH} Shadow</b> · <a href="${shadowUrl()}" target="_top">Comprar Shadow</a></div>` + SH_QUE +
    (note ? `<div class="shop-msg">${note}</div>` : '');
  el.querySelectorAll('[data-buy]').forEach(b => b.onclick = async () => {
    const it = T.find(t => t.id === b.dataset.buy);
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.innerHTML = `¿Pagar ${it.shadow}${SH}?`; setTimeout(() => { if (b.isConnected) { b.dataset.sure = ''; b.innerHTML = `${it.shadow}${SH}`; } }, 3500); return; }
    b.disabled = true;
    try { await buyItem(it.id); note = aplicarCompras() || (it.id === 'bendicion' ? `¡Bendición activa! Flores ×2 por ${bendDias()} días 🕯️` : '¡Listo!'); }
    catch (e) { note = e.status === 402 ? 'No te alcanza la Shadow. Toca «Comprar Shadow».' : (e.data && e.data.error) || 'No se pudo comprar. Revisa tu internet.'; }
    renderTienda(onChange); if (onChange) onChange();
  });
}
export function abrirTienda() { note = ''; }
