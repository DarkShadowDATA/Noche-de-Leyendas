// Noche de Leyendas — datos del prototipo (cazadores, armas, objetos, enemigos y ritmo de la partida)

export const RUN_SECONDS = 600; // partida de prueba: 10 min
export const BOSS_TIMES = { cadejo: 180, charro: 360, llorona: 540 };
// Noche sin fin: al vencer a La Llorona la partida sigue y los jefes vuelven en ciclo, cada vuelta más fuertes.
// Jefe número n (0 = 1er Cadejo): desde el 4º, vida = vida de La Llorona × grow^(n−2).
export const ENDLESS = { order: ['cadejo', 'charro', 'llorona'], first: 45, gap: 70, hpGrow: 1.6, dmgPerLoop: 0.3, spdPerLoop: 0.06 };

// Ayudas que aparecen en el mapa
export const HELPERS = {
  iman: { name: 'Imán', icon: '🧲', desc: 'Atrae todas las almas del mapa' },
  tamal: { name: 'Tamal', icon: '🫔', desc: 'Cura un 30% de vida' },
  campana: { name: 'Campana', icon: '🔔', desc: 'Congela a los enemigos 4 s' },
};
export const HELPER_EVERY = [28, 42]; // segundos entre ayudas (al azar en ese rango)

export const HUNTERS = {
  machetero: {
    name: 'El Machetero', weapon: 'machete', hp: 135, speed: 152,
    ability: 'Remolino', abilityDesc: 'Giro de 360° que golpea fuerte, empuja y te hace invencible un momento.',
    blurb: 'Tajos fuertes al frente. Fácil de jugar.',
  },
  curandera: {
    name: 'La Curandera', weapon: 'copal', hp: 100, speed: 156,
    ability: 'Limpia', abilityDesc: 'Te cura un 25% y aleja a los enemigos.',
    blurb: 'Humo que daña alrededor. Aguanta mucho.',
  },
  luchadora: {
    name: 'La Luchadora', weapon: 'punos', hp: 140, speed: 146,
    ability: 'Plancha', abilityDesc: 'Salta y cae aplastando todo alrededor; los deja aturdidos.',
    blurb: 'Golpes rapidísimos al más cercano.',
  },
  cohetero: {
    name: 'El Cohetero', weapon: 'cohetes', hp: 92, speed: 146,
    ability: 'Castillo', abilityDesc: 'Lluvia de 16 cohetes que explotan alrededor.',
    blurb: 'Explosiones en área. Frágil pero potente.',
  },
};

// Armas: nivel 1 a 8
export const WEAPONS = {
  machete: { name: 'Machete', icon: '🗡️', desc: 'Tajo en arco hacia donde caminas.',
    lv: ['Tajo al frente', '+25% de daño', 'También tajo hacia atrás', '+15% de tamaño', '+25% de daño', '−15% de espera', '+15% de tamaño', '+30% de daño'] },
  copal: { name: 'Copal', icon: '💨', desc: 'Humo que daña y frena a los que están cerca.',
    lv: ['Aura de humo', '+15% de radio', '+30% de daño', '+15% de radio', 'Frena más', '+30% de daño', '+15% de radio', '+40% de daño'] },
  punos: { name: 'Puños', icon: '👊', desc: 'Golpes rápidos al enemigo más cercano.',
    lv: ['Golpe rápido', '+25% de daño', 'Más rápido', 'Pega a 2 enemigos', '+25% de daño', 'Más rápido', 'Pega a 3 enemigos', '+35% de daño'] },
  cohetes: { name: 'Cohetes', icon: '🚀', desc: 'Cohetes que explotan en área.',
    lv: ['1 cohete', '+20% de daño', '+1 cohete', 'Explosión más grande', '+25% de daño', '+1 cohete', 'Explosión más grande', '+35% de daño'] },
  resortera: { name: 'Resortera', icon: '🪨', desc: 'Piedras que rebotan entre enemigos.',
    lv: ['Rebota 2 veces', '+25% de daño', '+1 rebote', 'Más rápida', '+1 piedra', '+25% de daño', '+1 rebote', '+35% de daño'] },
  agua: { name: 'Agua bendita', icon: '💧', desc: 'Frascos que dejan charcos que dañan.',
    lv: ['1 frasco', '+20% de daño', 'Charco más grande', '+1 frasco', 'Dura más', '+25% de daño', '+1 frasco', '+35% de daño'] },
  loteria: { name: 'Lotería', icon: '🃏', desc: 'Cartas en abanico que atraviesan.',
    lv: ['3 cartas', '+20% de daño', '+1 carta', 'Atraviesan a 1 más', '+25% de daño', '+1 carta', 'Más rápidas', '+35% de daño'] },
  lazo: { name: 'Lazo', icon: '🪢', desc: 'Lanza la reata en línea: jala y aturde a toda la fila.',
    lv: ['Lazo al frente', '+25% de daño', '+20% de largo', 'Aturde más tiempo', '+25% de daño', '−15% de espera', 'También lazo hacia atrás', '+35% de daño'] },
};

// Evoluciones: arma en nivel 8 + su objeto pareja (cualquier nivel) → al abrir un cofre, el arma cambia.
// La pareja no se dice en el juego: se descubre. Se guardan las descubiertas en save.evos.
export const EVOS = {
  machete: { pas: 'piedra', name: 'Machete de obsidiana', desc: 'Tajo doble más largo que hace sangrar.' },
  copal: { pas: 'ojo', name: 'Gran limpia', desc: 'Aura enorme que frena mucho más.' },
  punos: { pas: 'huaraches', name: 'Furia de la arena', desc: 'Cada 10 golpes suelta una onda de choque.' },
  cohetes: { pas: 'veladora', name: 'Castillo de fuegos', desc: 'Cada explosión suelta más explosiones.' },
  resortera: { pas: 'morral', name: 'Granizada', desc: 'Además cae una lluvia de piedras.' },
  loteria: { pas: 'ofrenda', name: 'Gran Lotería', desc: 'Cada carta tiene su propio efecto.' },
  lazo: { pas: 'espuelas', name: 'Lazo de fuego', desc: 'Quema a todo lo que atrapa.' },
  agua: { pas: 'maguey', name: 'Diluvio', desc: 'Los charcos te siguen a donde vayas.' },
};
// Cofres que aparecen en el mapa (además de los que sueltan los jefes), en segundos de partida
export const MAP_CHESTS = [90, 270, 450];
// Premio del cofre cuando no hay evolución que dar: además de la carta, flores al final de la partida
export const CHEST_FLORES = 15;

// Objetos: nivel 1 a 5
export const PASSIVES = {
  piedra: { name: 'Piedra de afilar', icon: '🔪', desc: '+10% de daño por nivel.' },
  ojo: { name: 'Ojo de venado', icon: '👁️', desc: '+10% de área por nivel.' },
  morral: { name: 'Morral', icon: '🎒', desc: '+1 cohete, piedra, frasco o carta en los niveles 1, 3 y 5.' },
  huaraches: { name: 'Huaraches', icon: '👡', desc: '+8% de velocidad al caminar por nivel.' },
  maguey: { name: 'Corazón de maguey', icon: '🌵', desc: '+20 de vida máxima y se cura sola poco a poco.' },
  veladora: { name: 'Veladora', icon: '🕯️', desc: '−7% de espera de las armas por nivel.' },
  ofrenda: { name: 'Ofrenda', icon: '🌼', desc: '+35% de distancia para juntar almas por nivel.' },
  espuelas: { name: 'Espuelas', icon: '✴️', desc: '+5% de velocidad y la esquiva recarga 10% más rápido por nivel.' },
};

// Enemigos: tex = [camina, ataque]; size = alto en pantalla (px de mundo)
export const ENEMIES = {
  calaquita: { tex: ['calaquita_camina', 'calaquita_ataque'], hp: 12, spd: 54, dmg: 7, size: 54, r: 18, xp: 1 },
  chaneque: { tex: ['chaneque_camina', 'chaneque_ataque'], hp: 8, spd: 112, dmg: 5, size: 46, r: 15, xp: 1 },
  lechuza: { tex: ['lechuza_camina', 'lechuza_ataque'], hp: 10, spd: 200, dmg: 8, size: 62, r: 20, xp: 1, flyer: true, flap: 7 },
  nahual: { tex: ['nahual_camina', 'nahual_ataque'], hp: 48, spd: 62, dmg: 11, size: 72, flap: 3, r: 22, xp: 3 },
  lobo: { tex: ['lobo_camina', 'lobo_ataque'], hp: 0, spd: 140, dmg: 13, size: 74, flap: 6, r: 24, xp: 3 },
  chupacabras: { tex: ['chupacabras_camina', 'chupacabras_ataque'], hp: 64, spd: 70, dmg: 15, size: 70, flap: 3.5, r: 24, xp: 4 },
  anima: { tex: ['anima_camina', 'anima_ataque'], hp: 24, spd: 56, dmg: 8, size: 62, r: 20, xp: 2 },
  cadejo: { tex: ['cadejo_camina', 'cadejo_ataque'], hp: 1100, spd: 78, dmg: 18, size: 150, r: 52, xp: 0, boss: 'El Cadejo', flap: 3 },
  charro: { tex: ['charro_camina', 'charro_ataque'], hp: 2300, spd: 86, dmg: 20, size: 176, r: 58, xp: 0, boss: 'El Charro Negro', flap: 3 },
  llorona: { tex: ['llorona_camina', 'llorona_ataque'], hp: 4400, spd: 56, dmg: 22, size: 200, r: 60, xp: 0, boss: 'La Llorona', flap: 1.2 },
};

// ---------- Árbol de talentos (se compra con flores de cempasúchil) ----------
// Cada rama: 5 talentos con niveles + 1 talento final. Costo del nivel n = base × 1.7^(n−1), redondeado a 5.
// El final de cada rama pide haber gastado 12 niveles en esa rama.
export const BRANCHES = {
  ataque: { name: 'Ataque', icon: '🗡️', color: '#ff9d1f' },
  supervivencia: { name: 'Supervivencia', icon: '🛡️', color: '#3fe0d0' },
  fortuna: { name: 'Fortuna', icon: '💰', color: '#ffcf5a' },
};
const pct = (n) => `${Math.round(n)}%`;
export const TALENTS = [
  { id: 'atk_filo', b: 'ataque', icon: '🔪', name: 'Filo', max: 5, base: 40, txt: (l) => `+${pct(6 * l)} de daño` },
  { id: 'atk_area', b: 'ataque', icon: '🌀', name: 'Alcance', max: 5, base: 60, txt: (l) => `+${pct(6 * l)} de área` },
  { id: 'atk_crit', b: 'ataque', icon: '💥', name: 'Golpe certero', max: 5, base: 90, txt: (l) => `${pct(4 * l)} de golpes críticos (doble daño)` },
  { id: 'atk_ritmo', b: 'ataque', icon: '⏱️', name: 'Ritmo', max: 5, base: 130, txt: (l) => `−${pct(4 * l)} de espera de las armas` },
  { id: 'atk_jefes', b: 'ataque', icon: '👹', name: 'Cazajefes', max: 3, base: 180, txt: (l) => `+${pct(10 * l)} de daño a jefes` },
  { id: 'atk_arsenal', b: 'ataque', icon: '🎆', name: 'Arsenal', max: 1, base: 2000, final: true, txt: () => '+1 cohete, piedra, frasco o carta en todas las armas' },
  { id: 'sup_vida', b: 'supervivencia', icon: '❤️', name: 'Aguante', max: 5, base: 40, txt: (l) => `+${12 * l} de vida máxima` },
  { id: 'sup_sanar', b: 'supervivencia', icon: '🌿', name: 'Remedio', max: 5, base: 60, txt: (l) => `Te curas ${(0.25 * l).toFixed(2).replace(/0$/, '')} de vida por segundo` },
  { id: 'sup_coraza', b: 'supervivencia', icon: '🦺', name: 'Coraza', max: 5, base: 90, txt: (l) => `−${pct(4 * l)} de daño recibido` },
  { id: 'sup_agil', b: 'supervivencia', icon: '💨', name: 'Agilidad', max: 4, base: 130, txt: (l) => `Esquivas cada ${(2.2 - 0.25 * l).toFixed(2).replace(/0$/, '')} s` },
  { id: 'sup_paso', b: 'supervivencia', icon: '👣', name: 'Paso firme', max: 3, base: 180, txt: (l) => `+${pct(5 * l)} de velocidad` },
  { id: 'sup_revivir', b: 'supervivencia', icon: '🕯️', name: 'Segunda vela', max: 1, base: 2000, final: true, txt: () => 'Revives una vez por partida con la mitad de la vida' },
  { id: 'for_iman', b: 'fortuna', icon: '🧲', name: 'Imán de almas', max: 5, base: 40, txt: (l) => `+${pct(15 * l)} de distancia para juntar almas` },
  { id: 'for_saber', b: 'fortuna', icon: '📜', name: 'Sabiduría', max: 5, base: 60, txt: (l) => `+${pct(6 * l)} de experiencia` },
  { id: 'for_cosecha', b: 'fortuna', icon: '🌼', name: 'Cosecha', max: 5, base: 90, txt: (l) => `+${pct(8 * l)} de flores al terminar` },
  { id: 'for_cambio', b: 'fortuna', icon: '🔄', name: 'Barajear', max: 3, base: 130, txt: (l) => `Cambia las cartas ${l} ${l === 1 ? 'vez' : 'veces'} por partida` },
  { id: 'for_arranque', b: 'fortuna', icon: '⚡', name: 'Buen arranque', max: 2, base: 180, txt: (l) => `Tu arma inicial empieza en nivel ${1 + l}` },
  { id: 'for_cuatro', b: 'fortuna', icon: '🃏', name: 'Cuarta carta', max: 1, base: 2000, final: true, txt: () => 'Eliges entre 4 cartas al subir de nivel' },
];
export const FINAL_NEEDS = 12;
export function talentCost(t, lv) { return Math.round(t.base * Math.pow(1.7, lv - 1) / 5) * 5; } // lv = nivel que compras (1..max)

// Cazadores que se abren con flores
export const HUNTER_COST = { luchadora: 400, cohetero: 900 };

// Flores al terminar una partida
// En la noche sin fin cada jefe da sus flores × la vuelta (vuelta 2 = ×2…).
// Noche sin fin (7 nov 2026): después del minuto 10 el tiempo y los enemigos dan la mitad, los jefes de las vueltas
// dan sus flores normales (sin ×vuelta) y cada partida tiene un tope de flores antes de los bonos (1ª del día, Cosecha).
export const FLOWERS = { perSeconds: 10, perKills: 20, boss: { cadejo: 15, charro: 25, llorona: 60 }, firstOfDay: 2, afterT: 600, afterMul: 0.5, cap: 450 };

// ---------- Piñata de armas (gacha) ----------
// Cada tirada da una de las 7 armas con una rareza. Se equipa UNA antes de la partida: empiezas con ella y con su bono.
// Repetida (misma rareza o menor) = +1 estrella (máx 5, +4% de daño cada una). Con 5 estrellas, la repetida devuelve flores.
export const RARITIES = [
  { id: 'comun', name: 'Común', color: '#cfc6b8', rate: 0.60, dmg: 0.10, cd: 0, lv: 1, refund: 20 },
  { id: 'rara', name: 'Rara', color: '#4fb6ff', rate: 0.28, dmg: 0.20, cd: 0.05, lv: 1, refund: 50 },
  { id: 'epica', name: 'Épica', color: '#c46bff', rate: 0.10, dmg: 0.35, cd: 0.10, lv: 2, refund: 150 },
  { id: 'legendaria', name: 'Legendaria', color: '#ffb52e', rate: 0.02, dmg: 0.50, cd: 0.15, lv: 3, refund: 500 },
];
export const STAR_DMG = 0.04, MAX_STARS = 5;
export const PINATA = {
  flores: 150, flores10: 1350, // 10 tiradas por el precio de 9
  pityEpica: 10, pityLegend: 60, // Épica o mejor segura cada 10; Legendaria segura a las 60
  // Los boletos con Shadow los cobra el servidor (precios en server/src/routes/leyendas.ts del repo de Mutantes; el juego los pide de ahí).
};
export function gearBonus(item) { // item = { r: índice de rareza, e: estrellas }
  if (!item) return { dmg: 1, cd: 1, lv: 1 };
  const R = RARITIES[item.r];
  return { dmg: 1 + R.dmg + STAR_DMG * (item.e || 0), cd: 1 - R.cd, lv: R.lv };
}
