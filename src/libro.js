// Fase 4: Bestiario (fichas de las leyendas que ya encontraste) y Medallas de México. Se abre desde «Jugar».
import { save, persist } from './save.js';
import { BESTIARIO, BESTIA_DE, MEDALLAS, MEDALLA_FLORES, HUNTERS, MAPS, OBJECTIVES } from './data.js';

const $ = (id) => document.getElementById(id);
let IMG = {}, seg = 'bestias', sel = '';
export function setupLibro(images) { IMG = images; }

/** Apunta que encontraste (n = 0) o venciste (n = 1) a una leyenda. No guarda en disco: eso pasa al terminar la partida. */
export function bestia(k, n) {
  const id = BESTIA_DE[k] || k; if (!BESTIARIO[id]) return;
  save.bestiario = save.bestiario || {}; save.bestiario[id] = (save.bestiario[id] || 0) + n;
}
const vista = (k) => save.bestiario && save.bestiario[k] != null;
/** Fichas que se muestran: México siempre; otra región solo cuando ya encontraste a alguna de sus leyendas. */
export const bestiasLista = () => Object.keys(BESTIARIO).filter(k => !BESTIARIO[k].region || Object.keys(BESTIARIO).some(j => BESTIARIO[j].region === BESTIARIO[k].region && vista(j)));
export const bestiasVistas = () => bestiasLista().filter(vista).length;
export const medallasN = () => MEDALLAS.filter(m => save.medallas && save.medallas[m.id]).length;

export const medallaNombre = (m) => m.caz ? `Vence a La Llorona con ${HUNTERS[m.caz].name}` : m.mapa ? `Vence a La Llorona en ${MAPS[m.mapa].name}`
  : m.obj ? (m.obj === 'llorona' ? 'Cumple el objetivo «Vence a La Llorona»' : `Vence a La Llorona y cumple «${OBJECTIVES[m.obj].name}»`) : `Vence a La Llorona con ${m.mald} maldiciones o más`;

/** Medallas que se ganan con esta victoria. Las marca, suma sus flores y las devuelve para la pantalla final. */
export function ganarMedallas(v) { // v = { caz, mapa, obj (id si se cumplió), malds (cuántas) }
  const out = []; save.medallas = save.medallas || {};
  for (const m of MEDALLAS) {
    if (save.medallas[m.id]) continue;
    if ((m.caz && m.caz === v.caz) || (m.mapa && m.mapa === v.mapa) || (m.obj && m.obj === v.obj) || (m.mald && v.malds >= m.mald)) { save.medallas[m.id] = 1; save.flores += MEDALLA_FLORES; save.ganadas += MEDALLA_FLORES; out.push(m); }
  }
  return out;
}
/** Los que ya habían ganado en un mapa antes de que existieran las medallas reciben las de mapa. */
export function medallasViejas() {
  const out = [];
  for (const m of MEDALLAS) if (m.mapa && (save.mapWins || {})[m.mapa] > 0 && !(save.medallas || {})[m.id]) { save.medallas = save.medallas || {}; save.medallas[m.id] = 1; save.flores += MEDALLA_FLORES; save.ganadas += MEDALLA_FLORES; out.push(m); }
  if (out.length) persist();
  return out;
}

export function abrirLibro(s) { seg = s || seg; sel = ''; build(); $('libroBox').classList.remove('hidden'); }

function build() {
  document.querySelectorAll('#libSeg button').forEach(b => { b.classList.toggle('on', b.dataset.s === seg); b.onclick = () => { seg = b.dataset.s; sel = ''; build(); }; });
  const top = $('libTop'), L = $('libList'); L.innerHTML = ''; L.className = seg;
  if (seg === 'bestias') {
    const ks = bestiasLista();
    top.innerHTML = `Has encontrado <b>${bestiasVistas()}/${ks.length}</b> leyendas. Cada ficha se abre la primera vez que la ves en una partida.`;
    for (const k of ks) {
      const B = BESTIARIO[k], n = save.bestiario ? save.bestiario[k] : null, ok = n != null, d = document.createElement('div');
      d.className = 'lb-card' + (ok ? '' : ' unk') + (sel === k ? ' open' : '');
      d.innerHTML = ok
        ? `<div class="hd"><span class="im"><img src="${IMG[B.img] || ''}" alt=""></span><span class="tt"><b>${B.name}</b><i>${B.tipo} · vencidas: ${n}</i></span></div>` +
          (sel === k ? `<div class="bd"><p><b>Cómo pelea:</b> ${B.pelea}</p><p><b>La leyenda:</b> ${B.historia}</p></div>` : '')
        : `<div class="hd"><span class="im"><img src="${IMG[B.img] || ''}" alt=""></span><span class="tt"><b>???</b><i>${B.tipo} · todavía no la encuentras</i></span></div>`;
      if (ok) d.onclick = () => { sel = sel === k ? '' : k; build(); };
      L.appendChild(d);
    }
  } else {
    top.innerHTML = `Tienes <b>${medallasN()}/${MEDALLAS.length}</b> medallas de México. Cada una da <b>${MEDALLA_FLORES} 🌼</b> la primera vez.`;
    let g = '';
    for (const m of MEDALLAS) {
      if (m.grupo !== g) { g = m.grupo; const h = document.createElement('div'); h.className = 'lb-g'; h.textContent = g; L.appendChild(h); }
      const ok = !!(save.medallas && save.medallas[m.id]), d = document.createElement('div');
      d.className = 'lb-med' + (ok ? ' ok' : '');
      d.innerHTML = `<span class="md">${ok ? '🏅' : m.icon}</span><span class="tt">${medallaNombre(m)}</span><span class="st">${ok ? '✔' : `+${MEDALLA_FLORES} 🌼`}</span>`;
      L.appendChild(d);
    }
  }
}
