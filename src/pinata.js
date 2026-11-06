// Piñata de armas (gacha): tiradas con flores, 1 gratis al día y boletos comprados con Shadow (cuenta DarkShadow).
import { WEAPONS, RARITIES, PINATA, MAX_STARS, gearBonus } from './data.js';
import { save, persist, today } from './save.js';
import { nube, buyBoletos, loginUrl, shadowUrl } from './nube.js';

const $ = id => document.getElementById(id);
const IDS = Object.keys(WEAPONS);
let IMG = {}, sfx = () => {};
export function setupPinata(images, play) {
  IMG = images; sfx = play;
  if (IMG.obj_pinata) $('pnBig').innerHTML = `<img src="${IMG.obj_pinata}" alt="Piñata">`;
}
const icon = (id) => IMG['icono_' + id] ? `<img class="icimg" src="${IMG['icono_' + id]}" alt="">` : WEAPONS[id].icon;
export const gearName = (id) => { const a = save.armas[id]; return `${WEAPONS[id].name} ${RARITIES[a.r].name}`; };
const stars = (e) => e ? '★'.repeat(e) + '<i>' + '★'.repeat(MAX_STARS - e) + '</i>' : '';
const bonusTxt = (id) => { const b = gearBonus(save.armas[id]); return `+${Math.round((b.dmg - 1) * 100)}% de daño${b.cd < 1 ? ` · −${Math.round((1 - b.cd) * 100)}% de espera` : ''}${b.lv > 1 ? ` · empieza en nivel ${b.lv}` : ''}`; };

export const boletos = () => Math.max(0, (nube.boletos || 0) - (save.boletosUsados || 0));
const freeToday = () => save.pin.dia !== today();

function roll() {
  const p = save.pin; p.n++; p.pe++; p.pl++;
  let x = Math.random(), r = 0; // Legendaria primero con su 2 %, luego Épica y Rara; lo que sobra es Común
  for (let i = RARITIES.length - 1; i >= 0; i--) { const R = RARITIES[i]; if (x < R.rate) { r = i; break; } x -= R.rate; }
  if (p.pl >= PINATA.pityLegend) r = 3;
  else if (r < 2 && p.pe >= PINATA.pityEpica) r = 2;
  if (r >= 2) p.pe = 0;
  if (r === 3) p.pl = 0;
  const id = IDS[Math.floor(Math.random() * IDS.length)], cur = save.armas[id];
  let what;
  if (!cur) { save.armas[id] = { r, e: 0 }; what = 'nueva'; }
  else if (r > cur.r) { cur.r = r; what = 'mejor'; }
  else if ((cur.e || 0) < MAX_STARS) { cur.e = (cur.e || 0) + 1; what = 'estrella'; }
  else { save.flores += RARITIES[r].refund; what = 'flores'; }
  if (!save.equipo) save.equipo = id;
  return { id, r, what };
}

/** pay: 'gratis' | 'flores' | 'flores10' | 'boleto' | 'boleto10' */
function pull(pay) {
  const n = pay.endsWith('10') ? 10 : 1;
  if (pay === 'gratis') { if (!freeToday()) return null; save.pin.dia = today(); }
  else if (pay.startsWith('flores')) { const c = n === 10 ? PINATA.flores10 : PINATA.flores; if (save.flores < c) return null; save.flores -= c; }
  else { if (boletos() < n) return null; save.boletosUsados += n; }
  const out = []; for (let i = 0; i < n; i++) out.push(roll());
  persist();
  return out;
}

let from = 'menu', busy = false, msg = '';
export function openPinata(back) { from = back || from; msg = ''; ['menu', 'end'].forEach(id => $(id).classList.add('hidden')); build(); $('pinata').classList.remove('hidden'); }
export function closePinata() { $('pinata').classList.add('hidden'); return from; }

function build() {
  $('pnFlores').textContent = `🌼 ${save.flores}`;
  $('pnBoletos').textContent = `🎟️ ${boletos()}`;
  $('pnBoletos').classList.toggle('hidden', !nube.on && !boletos());
  const fl = save.flores;
  const b = boletos();
  $('pnButtons').innerHTML =
    (freeToday() ? `<button class="btn" data-p="gratis">🎁 Gratis hoy</button>` : '') +
    (b >= 1 ? `<button class="btn" data-p="boleto">🎟️ Usar boleto</button>` : '') +
    (b >= 10 ? `<button class="btn" data-p="boleto10">🎟️ ×10</button>` : '') +
    `<button class="btn${fl < PINATA.flores ? ' off' : ''}" data-p="flores">Romper · ${PINATA.flores} 🌼</button>` +
    `<button class="btn${fl < PINATA.flores10 ? ' off' : ''}" data-p="flores10">×10 · ${PINATA.flores10} 🌼</button>`;
  $('pnButtons').querySelectorAll('button').forEach(bt => { bt.onclick = () => hit(bt.dataset.p, bt); });

  // Boletos con Shadow (opcional)
  let shop;
  if (!nube.on) shop = nube.can ? `<div class="pn-note">¿Quieres más tiradas? Compra boletos con Shadow (opcional).</div><a class="btn alt small" href="${loginUrl()}" target="_top">Iniciar sesión DarkShadow</a>`
    : `<div class="pn-note">Los boletos con Shadow se compran en <b>leyendas.darkshadow-studios.com</b> con tu cuenta DarkShadow.</div>`;
  else shop = `<div class="pn-note">Boletos con Shadow (opcional) · tienes <b>${nube.shadow} 💠</b></div>` +
    (nube.packs || []).map(p => `<button class="btn alt small" data-b="${p.id}">🎟️ ${p.boletos} ${p.boletos === 1 ? 'boleto' : 'boletos'} · ${p.shadow} 💠</button>`).join('') +
    `<a class="btn alt small" href="${shadowUrl()}" target="_top">Comprar Shadow</a>`;
  $('pnShop').innerHTML = shop + (msg ? `<div class="pn-msg">${msg}</div>` : '');
  $('pnShop').querySelectorAll('button[data-b]').forEach(bt => { bt.onclick = async () => {
    if (busy) return; busy = true; bt.disabled = true;
    try { await buyBoletos(bt.dataset.b); msg = '¡Listo! Ya tienes tus boletos 🎟️'; sfx('chest'); }
    catch (e) { msg = e.message; }
    busy = false; build();
  }; });

  // Colección: toca un arma para equiparla
  const col = $('pnCol'); col.innerHTML = '';
  for (const id of IDS) {
    const a = save.armas[id], el = document.createElement('div');
    el.className = 'pn-w' + (a ? '' : ' none') + (save.equipo === id ? ' eq' : '');
    if (a) el.style.setProperty('--rc', RARITIES[a.r].color);
    el.innerHTML = `<div class="ic">${icon(id)}</div><div class="n">${WEAPONS[id].name}</div>` + (a ? `<div class="r">${RARITIES[a.r].name}</div><div class="st">${stars(a.e)}</div>` : '<div class="r">?</div>') + (save.equipo === id ? '<div class="eqt">EQUIPADA</div>' : '');
    if (a) el.onclick = () => { save.equipo = save.equipo === id ? '' : id; persist(); sfx('pick'); build(); };
    col.appendChild(el);
  }
  $('pnEq').innerHTML = save.equipo ? `Equipada: <b>${gearName(save.equipo)}</b> · ${bonusTxt(save.equipo)}` : 'Toca un arma para equiparla. Empiezas la partida con ella y con su bono.';
  const p = save.pin;
  $('pnOdds').innerHTML = `Probabilidades: ${RARITIES.map(R => `<span style="color:${R.color}">${R.name} ${Math.round(R.rate * 100)}%</span>`).join(' · ')}<br>` +
    `Épica o mejor segura cada ${PINATA.pityEpica} (te faltan ${PINATA.pityEpica - p.pe}) · Legendaria segura a las ${PINATA.pityLegend} (te faltan ${PINATA.pityLegend - p.pl})<br>Repetida: +1 ★ (+4% de daño, máx ${MAX_STARS}). Con ${MAX_STARS} ★ te devuelve flores.`;
}

function hit(pay, bt) {
  if (busy) return;
  const res = pull(pay);
  if (!res) { bt.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 250); return; }
  busy = true;
  const pn = $('pnBig'); pn.classList.remove('boom'); void pn.offsetWidth; pn.classList.add('shake');
  sfx('swing');
  setTimeout(() => { sfx('boom'); pn.classList.remove('shake'); pn.classList.add('boom'); }, 650);
  setTimeout(() => {
    const best = Math.max(...res.map(x => x.r));
    sfx(best >= 2 ? 'win' : 'chest');
    showResults(res); busy = false; build();
  }, 900);
}

function showResults(res) {
  const box = $('pnRes');
  const lbl = { nueva: '¡NUEVA!', mejor: '¡MEJORÓ!', estrella: '+1 ★', flores: '' };
  box.innerHTML = res.map((x, i) => {
    const R = RARITIES[x.r];
    const tag = x.what === 'flores' ? `+${R.refund} 🌼` : lbl[x.what];
    return `<div class="pn-card r${x.r}" style="--rc:${R.color};animation-delay:${i * 70}ms"><div class="ic">${icon(x.id)}</div><div class="n">${WEAPONS[x.id].name}</div><div class="r">${R.name}</div><div class="tg">${tag}</div></div>`;
  }).join('') + '<div class="pn-br"></div><button class="btn small" id="pnResOk">¡Bien!</button>';
  box.classList.remove('hidden');
  $('pnResOk').onclick = () => box.classList.add('hidden');
}

/** Línea del menú: qué arma llevas a la partida */
export function gearRow() {
  const el = $('gearRow');
  if (save.equipo && save.armas[save.equipo]) {
    const R = RARITIES[save.armas[save.equipo].r];
    el.innerHTML = `<span class="gr" style="--rc:${R.color}">${icon(save.equipo)}</span> Llevas: <b style="color:${R.color}">${gearName(save.equipo)}</b> <small>${stars(save.armas[save.equipo].e)}</small>`;
  } else el.innerHTML = freeToday() ? '🪅 <b>¡Tu tirada gratis de la Piñata te espera!</b>' : '🪅 Rompe la Piñata para conseguir armas';
  el.onclick = () => openPinata('menu');
}
