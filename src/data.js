// Noche de Leyendas — datos del prototipo (cazadores, armas, objetos, enemigos y ritmo de la partida)

export const RUN_SECONDS = 600; // partida de prueba: 10 min
export const BOSS_TIMES = { cadejo: 180, charro: 360, llorona: 540 };
// Jefes de cada región (mismo ritmo: 3:00, 6:00 y 9:00; el último es el jefe final que gana la noche)
export const REGION_BOSSES = { mexico: ['cadejo', 'charro', 'llorona'], japon: ['gashadokuro', 'jorogumo', 'orochi'], grieta: ['gashadokuro', 'llorona', 'guardian'] };
export const BOSS_AT = [180, 360, 540];
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
  onmyoji: {
    name: 'La Onmyoji', weapon: 'ofuda', hp: 98, speed: 150,
    ability: 'Círculo de sellos', abilityDesc: 'Sellos rojos a tu alrededor: dañan y dejan quietos a los enemigos cercanos.',
    blurb: 'Talismanes que persiguen solos. Viene de Japón.',
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
  // Japón (region: 'japon'): salen en los mapas de Japón; en México, después de ganar Japón (save.japon)
  ofuda: { name: 'Ofuda', icon: '📜', region: 'japon', desc: 'Talismanes de papel que persiguen al enemigo más cercano.',
    lv: ['2 talismanes', '+20% de daño', '+1 talismán', 'Persiguen más rápido', '+25% de daño', '+1 talismán', 'Atraviesan a 1 más', '+35% de daño'] },
  abanico: { name: 'Abanico de guerra', icon: '🪭', region: 'japon', desc: 'Ráfaga en cono que daña y empuja lejos.',
    lv: ['Ráfaga al frente', '+25% de daño', 'Cono más ancho', 'Empuja más', '+25% de daño', '−15% de espera', 'También hacia atrás', '+35% de daño'] },
  farol: { name: 'Farol de papel', icon: '🏮', region: 'japon', desc: 'Faroles que giran a tu alrededor y queman al tocar.',
    lv: ['1 farol', '+20% de daño', '+1 farol', 'Giran más lejos', '+25% de daño', '+1 farol', 'Giran más rápido', '+35% de daño'] },
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
  ofuda: { pas: 'juzu', name: 'Cien sellos', desc: 'Cada talismán estalla en un sello que aturde.' },
  abanico: { pas: 'pluma', name: 'Viento divino', desc: 'Cada ráfaga deja un remolino que jala y daña.' },
  farol: { pas: 'vela', name: 'Desfile de linternas', desc: '+2 faroles más grandes que queman.' },
};
// ---------- Fase 2: ninguna partida igual ----------
// Objetivos: antes de jugar el juego ofrece 2 al azar y eliges uno. Cumplirlo da flores extra (después del tope).
export const OBJECTIVES = {
  llorona: { icon: '👻', name: 'Vence a La Llorona', desc: 'Sobrevive y vence a La Llorona.', flores: 40, jp: { icon: '🐉', name: 'Vence a Orochi', desc: 'Sobrevive y vence a Yamata no Orochi.' }, gr: { icon: '🌀', name: 'Cierra La Grieta', desc: 'Sobrevive y vence al Guardián de la Grieta.' } },
  altares: { icon: '🪦', name: 'Altares malditos', desc: 'Rompe los 5 altares antes de que llegue La Llorona. Sigue las flechas moradas.', flores: 80,
    jp: { icon: '📜', name: 'Sellos malditos', desc: 'Rompe los 5 sellos antes de que llegue Orochi. Sigue las flechas moradas.' } },
  carreta: { icon: '🛒', name: 'Escolta la carreta', desc: 'La carreta solo avanza si estás junto a ella. Llévala hasta la cruz antes de las 9:00 sin que la destruyan.', flores: 80,
    jp: { icon: '🏮', name: 'Escolta el palanquín', desc: 'El palanquín solo avanza si estás junto a él. Llévalo hasta el torii antes de las 9:00 sin que lo destruyan.' } },
  dorado: { icon: '✨', name: 'Chupacabras dorado', desc: 'Aparece 3 veces y huye de ti. Cázalo antes de que se escape las 3.', flores: 70,
    jp: { icon: '🦊', name: 'Kitsune dorada', desc: 'Aparece 3 veces y huye de ti. Atrápala antes de que se escape las 3.' } },
  ofrenda: { icon: '🕯️', name: 'Protege la ofrenda', desc: 'Los enemigos que la tocan le quitan vida; tú la curas si estás cerca. Que siga en pie a las 9:00.', flores: 80,
    jp: { icon: '🔔', name: 'Protege la campana', desc: 'Los enemigos que la tocan le quitan vida; tú la curas si estás cerca. Que siga en pie a las 9:00.' } },
};
/** El objetivo como se ve en esa región (en Japón solo salen los que tienen versión `jp`). */
const OBJ_REG = { japon: 'jp', grieta: 'gr' };
export const objOf = (id, region) => { const O = OBJECTIVES[id], v = O[OBJ_REG[region]]; return v ? { ...O, ...v } : O; };
export const objsDe = (region) => Object.keys(OBJECTIVES).filter(k => !OBJ_REG[region] || OBJECTIVES[k][OBJ_REG[region]]);
export const OBJ_DEADLINE = 540; // 9:00
export const DORADO_TIMES = [110, 290, 450], DORADO_LIFE = 18;
// Maldiciones opcionales: se acumulan y cada una da +20 % de flores
export const CURSES = {
  prisa: { icon: '💨', name: 'Prisa', desc: 'Enemigos 25 % más rápidos.' },
  sincura: { icon: '🩸', name: 'Sin curación', desc: 'Nada te cura.' },
  mochila: { icon: '🎒', name: 'Mochila chica', desc: 'Máximo 3 armas.' },
  niebla: { icon: '🌫️', name: 'Niebla', desc: 'Ves menos lejos.' },
  impaciente: { icon: '⏰', name: 'Jefe impaciente', desc: 'El jefe final llega en el minuto 7.' },
};
export const CURSE_BONUS = 0.2;
// Eventos al azar durante la partida (el primero en el minuto 2, luego cada 70–95 s)
export const EVENTS = { first: 120, every: [70, 95], list: ['luna', 'parvada', 'cofre', 'almas'], japon: ['tifon', 'linternas', 'cofre', 'almas'], grieta: ['luna', 'parvada', 'tifon', 'linternas', 'cofre', 'almas'] };
/** ¿Se puede ofrecer en esta partida? Lo de Japón sale en Japón, y en México después de ganar Japón. */
export const enRegion = (o, region, japonGanado) => !o || !o.region || o.region === region || region === 'grieta' || !!japonGanado;

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
  // Japón
  juzu: { name: 'Rosario de cuentas', icon: '📿', region: 'japon', desc: 'Recibes 6% menos daño por nivel.' },
  pluma: { name: 'Pluma de tengu', icon: '🪶', region: 'japon', desc: '+3% de golpe crítico (doble daño) por nivel.' },
  vela: { name: 'Vela de cera', icon: '🕯', region: 'japon', desc: 'Cura 1 de vida cada pocos enemigos vencidos (más seguido por nivel).' },
};

// Enemigos: tex = [camina, ataque]; size = alto en pantalla (px de mundo)
export const ENEMIES = {
  calaquita: { tex: ['calaquita_camina', 'calaquita_ataque'], hp: 12, spd: 54, dmg: 7, size: 54, r: 18, xp: 1 },
  chaneque: { tex: ['chaneque_camina', 'chaneque_ataque'], hp: 8, spd: 112, dmg: 5, size: 46, r: 15, xp: 1 },
  lechuza: { tex: ['lechuza_camina', 'lechuza_ataque'], hp: 10, spd: 200, dmg: 8, size: 62, r: 20, xp: 1, flyer: true, flap: 7 },
  nahual: { tex: ['nahual_camina', 'nahual_ataque'], hp: 48, spd: 62, dmg: 11, size: 72, flap: 3, r: 22, xp: 3 },
  lobo: { tex: ['lobo_camina', 'lobo_ataque'], hp: 0, spd: 140, dmg: 13, size: 74, flap: 6, r: 24, xp: 3 },
  chupacabras: { tex: ['chupacabras_camina', 'chupacabras_ataque'], hp: 64, spd: 70, dmg: 15, size: 70, flap: 3.5, r: 24, xp: 4 },
  // Fase 2 (objetivos y eventos)
  altar: { tex: ['obj_altar', 'obj_altar'], hp: 300, spd: 0, dmg: 0, size: 92, r: 34, xp: 0, static: true },
  sello: { tex: ['prop_sello_maldito', 'obj_altar'], hp: 300, spd: 0, dmg: 0, size: 112, r: 34, xp: 0, static: true },
  chupadorado: { tex: ['chupacabras_dorado', 'chupacabras_dorado'], hp: 380, spd: 138, dmg: 0, size: 82, flap: 3.5, r: 26, xp: 0, flee: true, tint: 0xffd84a },
  kitsunedorada: { tex: ['kitsune_dorada_camina', 'kitsune_dorada_camina'], hp: 380, spd: 145, dmg: 0, size: 78, r: 24, xp: 0, flee: true },
  loboalfa: { tex: ['lobo_alfa', 'lobo_alfa'], hp: 1500, spd: 102, dmg: 24, size: 150, r: 42, xp: 0, mini: true, tint: 0xb07aff },
  anima: { tex: ['anima_camina', 'anima_ataque'], hp: 24, spd: 56, dmg: 8, size: 62, r: 20, xp: 2 },
  // Fase 5 · Japón (region: 'japon'; salen solo en los mapas de Japón)
  kappa: { tex: ['kappa_camina', 'kappa_ataque'], hp: 14, spd: 60, dmg: 8, size: 56, r: 18, xp: 1, aqua: true },
  kitsune: { tex: ['kitsune_camina', 'kitsune_ataque'], hp: 18, spd: 150, dmg: 9, size: 70, r: 20, xp: 2 },
  oni: { tex: ['oni_camina', 'oni_ataque'], hp: 110, spd: 42, dmg: 18, size: 92, r: 30, xp: 6 },
  tengu: { tex: ['tengu_camina', 'tengu_ataque'], hp: 40, spd: 95, dmg: 14, size: 74, r: 22, xp: 4, flyer: true },
  yurei: { tex: ['yurei_camina', 'yurei_ataque'], hp: 34, spd: 50, dmg: 11, size: 70, r: 20, xp: 3, float: true },
  cadejo: { tex: ['cadejo_camina', 'cadejo_ataque'], hp: 1100, spd: 78, dmg: 18, size: 150, r: 52, xp: 0, boss: 'El Cadejo', flap: 3 },
  charro: { tex: ['charro_camina', 'charro_ataque'], hp: 2300, spd: 86, dmg: 20, size: 176, r: 58, xp: 0, boss: 'El Charro Negro', flap: 3 },
  llorona: { tex: ['llorona_camina', 'llorona_ataque'], hp: 4400, spd: 56, dmg: 22, size: 200, r: 60, xp: 0, boss: 'La Llorona', flap: 1.2 },
  // Jefes de Japón
  gashadokuro: { tex: ['gashadokuro_camina', 'gashadokuro_ataque'], hp: 1250, spd: 64, dmg: 20, size: 190, r: 56, xp: 0, boss: 'Gashadokuro' },
  jorogumo: { tex: ['jorogumo_camina', 'jorogumo_ataque'], hp: 2400, spd: 80, dmg: 20, size: 175, r: 58, xp: 0, boss: 'Jorogumo' },
  // Jefe final (La Grieta). Sin su arte todavía usa a La Llorona pintada de morado (fb/fbTint).
  guardian: { tex: ['guardian_camina', 'guardian_ataque'], fb: ['llorona_camina', 'llorona_ataque'], fbTint: 0xb98cff, hp: 7200, spd: 58, dmg: 24, size: 235, r: 74, xp: 0, boss: 'El Guardián de la Grieta' },
  orochi: { tex: ['orochi_camina', 'orochi_ataque'], hp: 4600, spd: 50, dmg: 23, size: 215, r: 70, xp: 0, boss: 'Yamata no Orochi' },
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
// Aspectos: solo cambian cómo se ve el cazador (mismas habilidades). La clave es el prefijo de sus imágenes: <clave>_quieto, _ataque, _w0…5 y retrato_<clave>.
// `item` es el artículo de la tienda con Shadow (servidor). walk: dónde queda la cabeza en la pose quieta (q) y de ataque (a) y la altura de los pies (oy).
export const ASPECTOS = {
  machetero_jaguar: { cazador: 'machetero', name: 'Guerrero Jaguar', item: 'asp_machetero_jaguar', walk: { q: 0.564, a: 0.553, oy: 0.907 } },
};
export const HUNTER_COST = { luchadora: 400, cohetero: 900, onmyoji: 1500 };

// Flores al terminar una partida
// En la noche sin fin cada jefe da sus flores × la vuelta (vuelta 2 = ×2…).
// Noche sin fin (7 nov 2026): después del minuto 10 el tiempo y los enemigos dan la mitad, los jefes de las vueltas
// dan sus flores normales (sin ×vuelta) y cada partida tiene un tope de flores antes de los bonos (1ª del día, Cosecha).
export const FLOWERS = { perSeconds: 10, perKills: 20, boss: { cadejo: 15, charro: 25, llorona: 60, gashadokuro: 15, jorogumo: 25, orochi: 60, guardian: 100 }, firstOfDay: 2, afterT: 600, afterMul: 0.5, cap: 450 };

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

// ---------- Fase 3: mapas de México ----------
// win = victorias contra La Llorona que se necesitan para abrirlo; bonus = flores extra (multiplica al final)
export const MAPS = {
  pueblo: { name: 'Pueblo abandonado', icon: '🏚️', win: 0, bonus: 0, desc: 'La plaza del pueblo. Donde empieza todo.', suelo: 'suelo_pueblo', card: 'menu_fondo_v' },
  panteon: { name: 'El Panteón', icon: '🪦', win: 1, bonus: 0.15, desc: 'Las tumbas se abren y sacan calaquitas. Las ofrendas encendidas te curan.', suelo: 'suelo_panteon', card: 'mapa_panteon', tint: 0xa79cc8 },
  canales: { name: 'Los Canales', icon: '🛶', win: 3, bonus: 0.3, desc: 'El agua te frena y las trajineras tapan el paso. Aquí vive La Llorona, y es más fuerte.', suelo: 'suelo_canales', card: 'mapa_canales', tint: 0x8fc4b8 },
  // Japón (se abre al liberar México; win = victorias contra Orochi en Japón)
  templo: { region: 'japon', name: 'Templo en ruinas', icon: '⛩️', win: 0, bonus: 0.35, desc: 'Torii rojos y linternas de piedra. Aquí empieza Japón: kappa, kitsune, oni, tengu y yurei.', suelo: 'suelo_templo', card: 'mapa_templo', tint: 0xb8a8d8 },
  // La Grieta: el mapa final (se abre al liberar México y Japón)
  grieta: { region: 'grieta', name: 'La Grieta', icon: '🌀', win: 0, bonus: 0.6, desc: 'Donde se rompe el mundo: salen leyendas de México y de Japón, y las grietas del piso escupen enemigos. Aquí te espera el Guardián.', suelo: 'suelo_grieta', card: 'mapa_grieta', tint: 0xc4a8ff },
  bambu: { region: 'japon', name: 'Bosque de bambú', icon: '🎋', win: 1, bonus: 0.45, desc: 'Cañas altísimas que tapan la vista. Los santuarios encendidos te curan.', suelo: 'suelo_bambu', card: 'mapa_bambu', tint: 0x9cc8a0 },
  castillo: { region: 'japon', name: 'Castillo en llamas', icon: '🏯', win: 3, bonus: 0.55, desc: 'El castillo arde y caen brasas: sal de los círculos rojos. Aquí vive Orochi, y es más fuerte.', suelo: 'suelo_castillo', card: 'mapa_castillo', tint: 0xffc0a0 },
};
export const REGIONS = {
  mexico: { name: 'México', icon: '🌼' },
  japon: { name: 'Japón', icon: '⛩️', need: ['mexico'], lock: 'Libera México: vence a La Llorona en Los Canales' },
  grieta: { name: 'La Grieta', icon: '🌀', need: ['mexico', 'japon'], lock: 'Libera México y Japón para abrir La Grieta' },
};
export const PANTEON = { tombEvery: [7, 11], tombN: 3, healR: 110, healPerSec: 3, ofrendaChance: 0.22 };
export const CASTILLO = { orochiHp: 1.35, orochiDmg: 1.15, regionFlores: 150 };
export const CANALES = { period: 1100, y0: 380, h: 250, slow: 0.6, bridgeEvery: 1500, bridgeW: 170, boatW: 300, boatH: 92, lloronaHp: 1.35, lloronaDmg: 1.15, regionFlores: 150 };

// ---------- Fase 4: Bestiario y Medallas ----------
// Bestiario: una ficha por leyenda. Se abre al encontrarla en una partida (save.bestiario[id] = cuántas has vencido).
// img = textura de la ficha · pelea = cómo ataca en el juego · historia = la leyenda real, en corto.
export const BESTIARIO = {
  calaquita: { name: 'Calaquita', tipo: 'Enemigo', img: 'calaquita_camina', pelea: 'Lenta y débil, pero viene en montón. Las tumbas del Panteón y el Charro Negro sacan más.',
    historia: 'Las calaveras de azúcar y de papel acompañan el Día de Muertos. En México la muerte no se esconde: se le pone nombre, se le canta y se le invita a la mesa.' },
  chaneque: { name: 'Chaneque', tipo: 'Enemigo', img: 'chaneque_camina', pelea: 'Chiquito y muy rápido. Si pasa sobre tus almas, se las roba; véncelo para que las suelte.',
    historia: 'Duendes del monte en las historias de Veracruz y el sur. Cuidan ríos y selvas, esconden las cosas y hacen que la gente se pierda. Para regresar, dicen, hay que ponerse la ropa al revés.' },
  lechuza: { name: 'Lechuza', tipo: 'Enemigo', img: 'lechuza_camina', pelea: 'Cruza la pantalla volando en línea recta, casi siempre en parvada. No te persigue: quítate de su camino.',
    historia: 'En el norte de México se cuenta que algunas brujas se vuelven lechuzas enormes. Si de noche oyes un silbido arriba de tu casa, mejor no contestes.' },
  nahual: { name: 'Nahual', tipo: 'Enemigo', img: 'nahual_camina', pelea: 'Aguanta mucho. Cuando le queda poca vida se convierte en lobo y se te va encima muy rápido.',
    historia: 'Desde tiempos de los mexicas se habla de hechiceros que pueden tomar forma de animal: coyote, perro o guajolote. Sale de noche y, si lo hieren, amanece herido como persona.' },
  chupacabras: { name: 'Chupacabras', tipo: 'Enemigo', img: 'chupacabras_camina', pelea: 'Se agacha un momento y salta hacia donde estabas. Muévete cuando lo veas prepararse.',
    historia: 'Leyenda joven: nació en Puerto Rico en 1995 y en meses llegó a todo México. Se le culpa de animales de granja que amanecen sin sangre, con dos agujeritos en el cuello.' },
  anima: { name: 'Ánima', tipo: 'Enemigo', img: 'anima_camina', pelea: 'Cada pocos segundos se vuelve transparente y tus golpes la atraviesan. Pégale cuando esté sólida.',
    historia: 'Las ánimas en pena son almas que dejaron algo pendiente. Se les prenden veladoras y se les reza para que encuentren descanso; a cambio, dicen, cuidan a quien se acuerda de ellas.' },
  loboalfa: { name: 'Lobo alfa', tipo: 'Minijefe', img: 'lobo_alfa', pelea: 'Despierta cuando abres el cofre maldito. Grande, rápido y con muchísima vida.',
    historia: 'El lobo mexicano fue el gran cazador de las sierras del norte. En los cuentos, el más viejo de la manada guarda lo que no debe tocarse.' },
  chupadorado: { name: 'Chupacabras dorado', tipo: 'Especial', img: 'chupacabras_dorado', pelea: 'No ataca: huye. Aparece tres veces por noche y se escapa si no lo alcanzas a tiempo.',
    historia: 'No viene de ninguna leyenda antigua: es de este juego. Pero en todo pueblo hay alguien que jura haber visto un animal que brillaba en el monte.' },
  cadejo: { name: 'El Cadejo', tipo: 'Jefe', img: 'cadejo_camina', pelea: 'Apunta con una línea y embiste a toda velocidad. Sal de la línea y pégale mientras descansa.',
    historia: 'Perro enorme de ojos encendidos que arrastra cadenas, del sur de México y Centroamérica. El negro persigue a los que andan de noche; el blanco, dicen, los cuida.' },
  charro: { name: 'El Charro Negro', tipo: 'Jefe', img: 'charro_camina', pelea: 'Te lanza su reata para jalarte y cada tanto llama calaquitas a su alrededor.',
    historia: 'Jinete elegante, vestido de negro y plata, que se aparece en los caminos. Ofrece una bolsa de monedas o un aventón: quien acepta, se va con él para siempre.' },
  llorona: { name: 'La Llorona', tipo: 'Jefa', img: 'llorona_camina', pelea: 'Su grito te empuja y te lastima, deja charcos que queman y llama ánimas. En Los Canales es más fuerte.',
    historia: 'La leyenda más famosa de México: una mujer de blanco que llora por sus hijos junto al agua. Se cuenta desde la Colonia, y hay quien la une a un presagio mexica anterior a la Conquista.' },
};
// Japón: sus fichas se esconden del Bestiario hasta que encuentras a la primera (no se ve «???» de una región que aún no juegas).
Object.assign(BESTIARIO, {
  kappa: { name: 'Kappa', tipo: 'Enemigo', region: 'japon', img: 'kappa_camina', pelea: 'Se agacha y salta hacia ti con las garras abiertas. El agua no lo frena: es su casa.',
    historia: 'Duende de los ríos de Japón, con caparazón y un plato de agua en la cabeza que es su fuerza. Si le haces una reverencia, te la regresa… y se le tira el agua.' },
  kitsune: { name: 'Kitsune', tipo: 'Enemigo', region: 'japon', img: 'kitsune_camina', pelea: 'Muy rápida. Cada tanto crea dos copias falsas de sí misma: se deshacen de un golpe y no lastiman.',
    historia: 'Zorra espíritu que gana una cola cada cien años y puede tomar forma humana para engañar. Las de fuego azul se ven de noche en el campo.' },
  oni: { name: 'Oni', tipo: 'Enemigo', region: 'japon', img: 'oni_camina', pelea: 'Lento y aguanta muchísimo. Cuando lo tienes cerca levanta el garrote: aléjate antes de que lo baje.',
    historia: 'Ogros de las montañas con cuernos y garrote de hierro. Cada febrero, en el Setsubun, se les avientan frijoles tostados gritando «¡fuera los oni, adentro la suerte!».' },
  tengu: { name: 'Tengu', tipo: 'Enemigo', region: 'japon', img: 'tengu_camina', pelea: 'Vuela alrededor, marca una línea roja y se lanza en picada. Sal de la línea.',
    historia: 'Guerreros cuervo que viven en lo alto de las montañas. Son orgullosos y castigan a los soberbios, pero también enseñaron el arte de la espada a los que lo merecían.' },
  yurei: { name: 'Yurei', tipo: 'Enemigo', region: 'japon', img: 'yurei_camina', pelea: 'Se desvanece y aparece de golpe junto a ti. Mientras se ve transparente no la puedes golpear.',
    historia: 'Almas que no descansan por algo que dejaron pendiente. Visten de blanco, sin pies, y las acompañan llamitas azules llamadas hitodama.' },
  guardian: { name: 'El Guardián de la Grieta', tipo: 'Jefe final', region: 'grieta', img: 'guardian_camina', pelea: 'Usa lo peor de las dos regiones: grita como La Llorona, muerde en líneas como Orochi y parte el piso. A la mitad de su vida se enfurece y llama leyendas de los dos lados.',
    historia: 'Nadie sabe qué es. Apareció cuando las noches de México y de Japón empezaron a tocarse, y lleva una máscara mitad calavera y mitad oni. Dicen que cada vez que alguien lo vence, en otra parte del mundo se abre una grieta nueva.' },
  kitsunedorada: { name: 'Kitsune dorada', tipo: 'Especial', region: 'japon', img: 'kitsune_dorada_camina', pelea: 'No ataca: huye. Aparece tres veces por noche con el objetivo «Kitsune dorada» y se escapa si no la alcanzas.',
    historia: 'Las kitsune más viejas y sabias tienen el pelaje dorado y hasta nueve colas. Son mensajeras de Inari, la diosa del arroz, y traen buena fortuna a quien las ve.' },
  gashadokuro: { name: 'Gashadokuro', tipo: 'Jefe', region: 'japon', img: 'gashadokuro_camina', pelea: 'Marca un círculo rojo donde estás y lo aplasta con la mano. Cada tanto levanta yurei a su alrededor.',
    historia: 'Esqueleto gigante hecho con los huesos de los que murieron de hambre o en batalla sin entierro. Dicen que se oye un zumbido en los oídos justo antes de que te atrape.' },
  jorogumo: { name: 'Jorogumo', tipo: 'Jefa', region: 'japon', img: 'jorogumo_camina', pelea: 'Lanza telarañas al piso que te frenan mucho y salta hacia ti. No te quedes en la telaraña.',
    historia: 'Araña que al cumplir 400 años toma forma de mujer hermosa. Atrae a los viajeros con música de biwa y los envuelve en hilos que no se ven.' },
  orochi: { name: 'Yamata no Orochi', tipo: 'Jefe', region: 'japon', img: 'orochi_camina', pelea: 'Sus cabezas marcan tres líneas y muerden a lo largo de ellas; deja charcos de veneno y llama oni.',
    historia: 'Serpiente de ocho cabezas y ocho colas tan larga como ocho valles. El dios Susanoo la venció dándole ocho barriles de sake y cortándola mientras dormía; en su cola encontró una espada sagrada.' },
});

/** A qué ficha cuenta cada enemigo del juego (el lobo es el nahual transformado). */
export const BESTIA_DE = { lobo: 'nahual' };

// Medallas de México: se ganan al vencer a La Llorona. Cada una da MEDALLA_FLORES flores, una sola vez.
export const MEDALLA_FLORES = 100;
export const MEDALLAS = [
  ...['machetero', 'curandera', 'luchadora', 'cohetero', 'onmyoji'].map(h => ({ id: 'caz_' + h, grupo: 'México · Cazadores', icon: '🎭', caz: h })),
  ...['pueblo', 'panteon', 'canales'].map(m => ({ id: 'mapa_' + m, grupo: 'México · Mapas', icon: '🗺️', mapa: m })),
  ...['llorona', 'altares', 'carreta', 'dorado', 'ofrenda'].map(o => ({ id: 'obj_' + o, grupo: 'México · Objetivos', icon: '🎯', obj: o })),
  { id: 'mald_3', grupo: 'México · Maldiciones', icon: '☠️', mald: 3 },
  // Japón (r: 'japon'): lo mismo, venciendo a Orochi
  ...['machetero', 'curandera', 'luchadora', 'cohetero', 'onmyoji'].map(h => ({ id: 'jp_caz_' + h, r: 'japon', grupo: 'Japón · Cazadores', icon: '🎭', caz: h })),
  ...['templo', 'bambu', 'castillo'].map(m => ({ id: 'mapa_' + m, r: 'japon', grupo: 'Japón · Mapas', icon: '🗺️', mapa: m })),
  ...['llorona', 'altares', 'carreta', 'dorado', 'ofrenda'].map(o => ({ id: 'jp_obj_' + o, r: 'japon', grupo: 'Japón · Objetivos', icon: '🎯', obj: o })),
  { id: 'jp_mald_3', r: 'japon', grupo: 'Japón · Maldiciones', icon: '☠️', mald: 3 },
  { id: 'grieta', grupo: 'La Grieta', icon: '🌀', img: 'medalla_grieta', grieta: true, flores: 500 },
];
/** Premio de cerrar La Grieta la primera vez (además de la medalla): brillo especial para el cazador con el que la venciste. */
export const GRIETA = { creditos: ['NOCHE DE LEYENDAS', '', 'Un juego de', 'DarkShadow Studios', '', 'Leyendas de México', 'La Llorona · El Cadejo · El Charro Negro · El Nahual · Los Chaneques · El Chupacabras · Las Ánimas', '', 'Leyendas de Japón', 'Yamata no Orochi · Gashadokuro · Jorogumo · Kappa · Kitsune · Oni · Tengu · Yurei', '', 'Hecho con Phaser', 'Arte creado con ChatGPT', '', 'Gracias por jugar', 'La noche no ha terminado…'] };
