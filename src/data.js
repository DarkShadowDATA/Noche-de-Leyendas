// Noche de Leyendas — datos del prototipo (cazadores, armas, objetos, enemigos y ritmo de la partida)

export const RUN_SECONDS = 600; // partida de prueba: 10 min
export const BOSS_TIMES = { cadejo: 180, charro: 360, llorona: 540 };

export const HUNTERS = {
  machetero: {
    name: 'El Machetero', weapon: 'machete', hp: 120, speed: 150,
    ability: 'Remolino', abilityDesc: 'Giro de 360° que golpea y empuja a todos los que estén cerca.',
    blurb: 'Tajos fuertes al frente. Fácil de jugar.',
  },
  curandera: {
    name: 'La Curandera', weapon: 'copal', hp: 100, speed: 156,
    ability: 'Limpia', abilityDesc: 'Te cura un 35% y aleja a los enemigos.',
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
};

// Objetos: nivel 1 a 5
export const PASSIVES = {
  piedra: { name: 'Piedra de afilar', icon: '🔪', desc: '+10% de daño por nivel.' },
  ojo: { name: 'Ojo de venado', icon: '👁️', desc: '+10% de área por nivel.' },
  morral: { name: 'Morral', icon: '🎒', desc: '+1 cohete, piedra, frasco o carta en los niveles 1, 3 y 5.' },
  huaraches: { name: 'Huaraches', icon: '👡', desc: '+8% de velocidad al caminar por nivel.' },
  maguey: { name: 'Corazón de maguey', icon: '🌵', desc: '+20 de vida máxima y se cura sola poco a poco.' },
  veladora: { name: 'Veladora', icon: '🕯️', desc: '−7% de espera de las armas por nivel.' },
  ofrenda: { name: 'Ofrenda', icon: '🌼', desc: '+35% de distancia para juntar almas por nivel.' },
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
