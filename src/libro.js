// Fase 4: Bestiario (fichas de las leyendas que ya encontraste) y Medallas de México. Se abre desde «Jugar».
import { save, persist } from './save.js';
import { BESTIARIO, BESTIA_DE, MEDALLAS, MEDALLA_FLORES, HUNTERS, MAPS, OBJECTIVES, objOf } from './data.js';

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

export const medallaNombre = (m) => { const J = m.r === 'japon' ? 'Orochi' : 'La Llorona', O = m.obj && objOf(m.obj, m.r || 'mexico');
  return m.caz ? `Vence a ${J} con ${HUNTERS[m.caz].name}` : m.mapa ? `Vence a ${J} en ${MAPS[m.mapa].name}`
    : m.obj ? (m.obj === 'llorona' ? `Cumple el objetivo «${O.name}»` : `Vence a ${J} y cumple «${O.name}»`) : `Vence a ${J} con ${m.mald} maldiciones o más`; };
/** Medallas que se muestran: las de México siempre; las de Japón cuando ya se abrió Japón o ganaste alguna. */
const medallasLista = () => MEDALLAS.filter(m => !m.r || save.mexico || MEDALLAS.some(x => x.r === m.r && (save.medallas || {})[x.id]));

/** Medallas que se ganan con esta victoria. Las marca, suma sus flores y las devuelve para la pantalla final. */
export function ganarMedallas(v) { // v = { region, caz, mapa, obj (id si se cumplió), malds (cuántas) }
  const out = []; save.medallas = save.medallas || {};
  for (const m of MEDALLAS) {
    if (save.medallas[m.id] || (m.r || 'mexico') !== (v.region || 'mexico')) continue;
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
    const ML = medallasLista();
    top.innerHTML = `Tienes <b>${ML.filter(m => (save.medallas || {})[m.id]).length}/${ML.length}</b> medallas. Cada una da <b>${MEDALLA_FLORES} 🌼</b> la primera vez.`;
    let g = '';
    for (const m of ML) {
      if (m.grupo !== g) { g = m.grupo; const h = document.createElement('div'); h.className = 'lb-g'; h.textContent = g; L.appendChild(h); }
      const ok = !!(save.medallas && save.medallas[m.id]), d = document.createElement('div');
      d.className = 'lb-med' + (ok ? ' ok' : '');
      d.innerHTML = `<span class="md">${ok ? '🏅' : m.icon}</span><span class="tt">${medallaNombre(m)}</span><span class="st">${ok ? '✔' : `+${MEDALLA_FLORES} 🌼`}</span>`;
      L.appendChild(d);
    }
  }
}
