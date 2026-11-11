// Bodega y Mercado de Noche de Leyendas (venta de jugador a jugador con Shadow). Diseño: claude/pagos-y-mercado.md.
// Solo se vende lo que nació en el servidor: armas sacadas con boletos y aspectos de la tienda. El servidor manda; aquí solo se dibuja.
// El mercado está apagado hasta que el dueño lo prenda (nube.mercado). El vendedor recibe el 90 % en fragmentos (10 = 1 Shadow).
import { save, persist } from './save.js';
import { nube, api, sync, shadowUrl } from './nube.js';
import { WEAPONS, RARITIES, ASPECTOS, HUNTERS } from './data.js';
import { absorb } from './pinata.js';

let IMG = {}, sfx = () => {}, data = null, loading = false, msg = '', sell = null, sure = '', onChange = () => {};
export function setupMercado(images, play, changed) { IMG = images; sfx = play; onChange = changed || onChange; }
export const mercadoOn = () => !!(nube.on && nube.mercado);
export const bodegaN = () => (data ? data.items.filter(i => i.status === 'bodega' && i.kind === 'arma').length : 0);

const nombre = (i) => i.kind === 'arma' ? `${WEAPONS[i.ref] ? WEAPONS[i.ref].name : i.ref}` : `Aspecto: ${ASPECTOS[i.ref] ? ASPECTOS[i.ref].name : i.ref}`;
const sub = (i) => i.kind === 'arma' ? `<span class="rr" style="color:${RARITIES[i.rar].color}">${RARITIES[i.rar].name}</span>` : `<span class="rr" style="color:#9ff7ea">Para ${ASPECTOS[i.ref] ? HUNTERS[ASPECTOS[i.ref].cazador].name : 'cazador'}</span>`;
const ico = (i) => { const k = i.kind === 'arma' ? 'icono_' + i.ref : 'retrato_' + i.ref; return IMG[k] ? `<img src="${IMG[k]}" alt="">` : (i.kind === 'arma' && WEAPONS[i.ref] ? WEAPONS[i.ref].icon : '🎭'); };
const color = (i) => i.kind === 'arma' ? RARITIES[i.rar].color : '#9ff7ea';
/** Lo que recibe el vendedor: precio menos 10 %, en Shadow y fragmentos. */
export const recibe = (p) => { const f = p * 9, s = Math.floor(f / 10), r = f % 10; return (s ? `${s} 💠` : '') + (s && r ? ' y ' : '') + (r ? `${r} fragmento${r > 1 ? 's' : ''}` : '') || '0'; };
const horas = (ms) => Math.max(1, Math.ceil(ms / 3600000));

export async function cargarMercado() {
  if (!nube.on || loading) return;
  loading = true;
  try { data = await api('/ndl/mercado'); nube.shadow = data.shadow; } catch (e) { msg = 'No se pudo abrir el mercado. Revisa tu internet.'; }
  loading = false;
}
async function hacer(fn, ok) {
  try { const r = await fn(); if (r && r.aspectos) nube.aspectos = r.aspectos; if (r && r.shadow != null) nube.shadow = r.shadow; msg = typeof ok === 'function' ? ok(r) : ok; sfx('chest'); }
  catch (e) { msg = e.status === 402 ? 'No te alcanza la Shadow.' : (e.data && e.data.error) || 'No se pudo. Revisa tu internet.'; sfx('pick'); }
  sell = null; sure = '';
  await cargarMercado(); onChange();
}
/** Usa un arma de la bodega: el servidor la marca y aquí se suma a la colección (igual que una tirada). */
export async function usarArma(id) {
  const r = await api(`/ndl/items/${id}/usar`, { method: 'POST' });
  const what = absorb(r.item.ref, r.item.rar); persist(); sync();
  return { ...r.item, what };
}

function fila(i, extra) {
  const d = document.createElement('div'); d.className = 'frame wrow';
  d.innerHTML = `<div class="in"><span class="ico" style="--rc:${color(i)}">${ico(i)}</span><span class="tx"><b>${nombre(i)}</b>${sub(i)}${extra.tx || ''}</span>${extra.btn || ''}</div>`;
  return d;
}

export function buildBodega(top, L) {
  if (!data) { top.innerHTML = 'Abriendo tu bodega…'; cargarMercado().then(onChange); return; }
  const mine = data.items, R = data.reglas;
  top.innerHTML = `Aquí llega lo que sale con <b>boletos</b> y los aspectos de la tienda. Un arma la puedes <b>usar</b> (se suma a tu colección) o <b>vender</b> en el Mercado.` + (msg ? `<div class="mk-msg">${msg}</div>` : '');
  if (!mine.length) { const e = document.createElement('div'); e.className = 'mk-empty'; e.textContent = 'Tu bodega está vacía. Rompe la Piñata con boletos para llenarla.'; L.appendChild(e); return; }
  for (const i of mine) {
    let d;
    if (i.status === 'venta') {
      const l = data.listings.find(x => x.mine && x.kind === i.kind && x.ref === i.ref && x.rar === i.rar) || {};
      d = fila(i, { tx: `<span>A la venta${l.price ? ` por <b style="display:inline;color:#ffcf5a">${l.price} 💠</b>` : ''}</span>`, btn: l.id ? `<button class="obtn" data-quitar="${l.id}">Quitar</button>` : '' });
    } else if (sell === i.id) {
      d = fila(i, { tx: `<span class="mk-sell">Precio: <input type="number" min="${R.min}" step="1" value="${Math.max(R.min, 5)}" inputmode="numeric"> 💠 <em></em></span>`, btn: `<button class="obtn" data-pub="${i.id}">Publicar</button>` });
    } else {
      d = fila(i, { tx: i.espera > 0 ? `<span>Recién comprada: se puede revender en ${horas(i.espera)} h</span>` : (i.kind === 'aspecto' ? '<span>Se elige en Cazadores</span>' : ''),
        btn: (i.kind === 'arma' ? `<button class="obtn" data-usar="${i.id}">Usar</button>` : '') + (i.espera > 0 ? '' : `<button class="obtn alt2" data-vender="${i.id}">Vender</button>`) });
    }
    L.appendChild(d);
  }
  L.querySelectorAll('[data-usar]').forEach(b => b.onclick = () => { b.disabled = true; hacer(() => usarArma(b.dataset.usar), (r) => ({ nueva: '¡Arma nueva en tu colección!', mejor: '¡Tu arma mejoró de rareza!', estrella: '+1 ★ para tu arma', flores: 'Ya la tenías al máximo: te dio flores 🌼' }[r.what])); });
  L.querySelectorAll('[data-vender]').forEach(b => b.onclick = () => { sell = b.dataset.vender; msg = ''; sfx('pick'); onChange(); });
  L.querySelectorAll('[data-quitar]').forEach(b => b.onclick = () => { b.disabled = true; hacer(() => api(`/ndl/mercado/${b.dataset.quitar}/cancelar`, { method: 'POST' }), 'Regresó a tu bodega.'); });
  const inp = L.querySelector('.mk-sell input');
  if (inp) {
    const em = L.querySelector('.mk-sell em'), upd = () => { const p = Math.floor(+inp.value || 0); em.textContent = p >= R.min ? `Recibes ${recibe(p)}` : `Mínimo ${R.min}`; };
    inp.oninput = upd; upd();
    L.querySelector('[data-pub]').onclick = (e) => { const p = Math.floor(+inp.value || 0); if (p < R.min) return; e.target.disabled = true;
      hacer(() => api('/ndl/mercado/vender', { method: 'POST', body: JSON.stringify({ item: sell, price: p }) }), `Publicado por ${p} 💠. Dura ${R.dias} días.`); };
  }
}

export function buildMercado(top, L) {
  if (!data) { top.innerHTML = 'Abriendo el mercado…'; cargarMercado().then(onChange); return; }
  const R = data.reglas, ls = data.listings.filter(l => !l.mine);
  top.innerHTML = `Compra a otros cazadores con Shadow. Tienes <b>${data.shadow} 💠</b>${data.frags ? ` y <b>${data.frags}/10</b> fragmentos` : ''} · <a href="${shadowUrl()}" target="_top">Comprar Shadow</a>` +
    `<div class="mk-note">Al vender recibes el 90 %. Lo que no completa 1 Shadow se guarda en fragmentos (10 = 1 Shadow). Para vender algo, ve a tu Bodega.</div>` + (msg ? `<div class="mk-msg">${msg}</div>` : '');
  if (!ls.length) { const e = document.createElement('div'); e.className = 'mk-empty'; e.textContent = 'Todavía no hay nada a la venta. ¡Sé el primero en publicar desde tu Bodega!'; L.appendChild(e); return; }
  for (const l of ls.sort((a, b) => a.price - b.price)) {
    const d = fila(l, { btn: `<button class="obtn" data-comprar="${l.id}">${sure === l.id ? `¿Pagar ${l.price} 💠?` : `${l.price} 💠`}</button>` });
    L.appendChild(d);
  }
  L.querySelectorAll('[data-comprar]').forEach(b => b.onclick = () => {
    if (sure !== b.dataset.comprar) { sure = b.dataset.comprar; msg = ''; onChange(); return; }
    b.disabled = true; hacer(() => api(`/ndl/mercado/${b.dataset.comprar}/comprar`, { method: 'POST' }), '¡Comprado! Está en tu Bodega.');
  });
}
export function limpiarAviso() { msg = ''; sell = null; sure = ''; }
export function resetMercado() { data = null; msg = ''; sell = null; sure = ''; }
