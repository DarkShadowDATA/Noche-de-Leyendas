// «Más juegos de DarkShadow» (23 nov 2026): ventanita con 3 tarjetas de los otros juegos públicos del estudio.
// Sale solo en el menú principal y en la pantalla de fin (nunca a media partida). Cada enlace lleva
// ?src=leyendas&campana=cruce para medir en web_events cuántos pasan de un juego a otro.
// Nada de juegos privados o en pausa. A quien llegó por anuncio (src fb_ads / ig_ads) no se le muestra
// hasta que termina su primera partida.
const ME = 'leyendas';
const Q = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
const LANG = (() => { const l = (navigator.language || 'es').slice(0, 2).toLowerCase(); return ['es', 'en', 'pt'].includes(l) ? l : 'es'; })();
const TX = {
  es: { btn: '🎮 Más juegos de DarkShadow', title: 'Más juegos de DarkShadow', sub: 'Gratis, en tu navegador', play: 'Jugar', all: 'Ver todos los juegos', close: 'Cerrar', pc: 'En computadora' },
  en: { btn: '🎮 More DarkShadow games', title: 'More DarkShadow games', sub: 'Free, in your browser', play: 'Play', all: 'See all games', close: 'Close', pc: 'On PC' },
  pt: { btn: '🎮 Mais jogos da DarkShadow', title: 'Mais jogos da DarkShadow', sub: 'Grátis, no seu navegador', play: 'Jogar', all: 'Ver todos os jogos', close: 'Fechar', pc: 'No computador' },
}[LANG];
// Solo juegos públicos. MecaBestias solo en computadora.
const GAMES = [
  { id: 'bloquevilla', name: 'Bloquevilla', url: 'https://bloquevilla.darkshadow-studios.com/',
    d: { es: 'Acomoda bloques, arma combos y reconstruye tu pueblo.', en: 'Place blocks, chain combos and rebuild your town.', pt: 'Encaixe blocos, faça combos e reconstrua sua vila.' } },
  { id: 'pinatazo', name: 'Piñatazo', url: 'https://pinatazo.darkshadow-studios.com/',
    d: { es: 'Junta dulces iguales hasta formar piñatas y reviéntalas.', en: 'Merge matching candies into piñatas and smash them.', pt: 'Junte doces iguais até formar piñatas e estoure-as.' } },
  { id: 'ahino', name: '¡Ahí No!', url: 'https://ahino.darkshadow-studios.com/',
    d: { es: 'Solo es llegar a la puerta… si la calle te deja.', en: 'Just reach the door… if the street lets you.', pt: 'É só chegar à porta… se a rua deixar.' } },
  { id: 'mutantes', name: 'Mutantes del Wasteland', url: 'https://mutantes.darkshadow-studios.com/',
    d: { es: 'Forma tu equipo de mutantes y defiende tu refugio.', en: 'Build your mutant squad and defend your shelter.', pt: 'Monte sua equipe de mutantes e defenda seu abrigo.' } },
  { id: 'mecabestias', name: 'MecaBestias', url: 'https://mecabestias.darkshadow-studios.com/', pc: true,
    d: { es: 'Pilota tu bestia mecánica y doma a las salvajes.', en: 'Pilot your mech beast and tame the wild ones.', pt: 'Pilote sua fera mecânica e dome as selvagens.' } },
];
const mobile = () => /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (matchMedia('(pointer: coarse)').matches && innerWidth < 1024);
const framed = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
const link = (u) => `${u}?src=${ME}&campana=cruce`;
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Llegó por anuncio pagado: se recuerda (si recarga, el ?src= ya no está).
const AD = (() => {
  const s = (Q.get('src') || Q.get('utm_source') || '').toLowerCase();
  try { if (s === 'fb_ads' || s === 'ig_ads') localStorage.setItem('ndl_ad', '1'); return localStorage.getItem('ndl_ad') === '1'; }
  catch (e) { return s === 'fb_ads' || s === 'ig_ads'; }
})();
/** ¿Se puede mostrar ya el botón? (quien llegó por anuncio, hasta terminar su primera partida) */
let fin1 = (() => { try { return localStorage.getItem('ndl_fin1') === '1'; } catch (e) { return false; } })();
export const masJuegosVisible = (partidas) => !AD || fin1 || (partidas || 0) > 0;
/** Se llama al terminar una partida (pantalla de fin): desde ahí ya se puede mostrar. */
export function marcarFinPartida() { fin1 = true; try { localStorage.setItem('ndl_fin1', '1'); } catch (e) { /* nada */ } }
export const masJuegosTexto = TX.btn;

let turn = 0;
export function abrirMasJuegos() {
  let ov = document.getElementById('masJuegos');
  if (!ov) {
    ov = document.createElement('div'); ov.id = 'masJuegos'; ov.className = 'mjov';
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('[data-mjx]')) ov.classList.add('hidden'); });
    document.body.appendChild(ov);
  }
  const pool = GAMES.filter(g => !g.pc || !mobile());
  // rota cuál sale primero para que todos tengan su turno; siempre 3 tarjetas
  const off = (turn++ + Math.floor(Math.random() * pool.length)) % pool.length;
  const pick = [...pool.slice(off), ...pool.slice(0, off)].slice(0, 3);
  const tgt = framed ? ' target="_blank" rel="noopener"' : ' target="_top"';
  ov.innerHTML = `<div class="mjbox" role="dialog" aria-label="${esc(TX.title)}">
    <button class="mjx" data-mjx aria-label="${esc(TX.close)}">✕</button>
    <div class="mjh"><b>${esc(TX.title)}</b><small>${esc(TX.sub)}</small></div>
    ${pick.map(g => `<a class="mjc" href="${link(g.url)}"${tgt}><img src="/mas/${g.id}.webp" alt="" loading="lazy"><span><b>${esc(g.name)}</b><i>${esc(g.d[LANG])}</i>${g.pc ? `<em>💻 ${esc(TX.pc)}</em>` : ''}</span><u>${esc(TX.play)} ▶</u></a>`).join('')}
    <a class="mjall" href="${link('https://darkshadow-studios.com/')}"${tgt}>${esc(TX.all)} →</a>
  </div>`;
  ov.classList.remove('hidden');
}
