// Noche de Leyendas — prototipo jugable (Phaser 3)
import Phaser from 'phaser';
import '@fontsource/lilita-one/400.css';
import { dsTrack } from './dsev.js';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import { HUNTERS, WEAPONS, PASSIVES, ENEMIES, BOSS_TIMES, ENDLESS, HELPERS, HELPER_EVERY, BRANCHES, TALENTS, FINAL_NEEDS, talentCost, HUNTER_COST, FLOWERS, RARITIES, PINATA, gearBonus, MAX_STARS, EVOS, MAP_CHESTS, CHEST_FLORES, OBJECTIVES, OBJ_DEADLINE, DORADO_TIMES, DORADO_LIFE, CURSES, CURSE_BONUS, EVENTS } from './data.js';
import { save, persist, tl, today, RUN_KEY, readRun, clearRun } from './save.js';
import { setupPinata, openPinata, closePinata, boletos as pinBoletos } from './pinata.js';
import { nube, onNube, startNube, loginUrl } from './nube.js';

const IMGS = import.meta.glob('./img/*.webp', { eager: true, query: '?url', import: 'default' });
import PKG from '../package.json';
const VERSION = PKG.version.replace(/\.0$/, '');
const IMG = {};
for (const [p, u] of Object.entries(IMGS)) IMG[p.split('/').pop().replace('.webp', '')] = u;

const Q = new URLSearchParams(location.search);
const START_T = +Q.get('t') || 0;
const SPEED = clampSpeed(+Q.get('speed') || 1);
function clampSpeed(v) { return Math.max(1, Math.min(8, v)); }
const GOD = Q.has('god');
const AUTO = Q.has('auto'); // para pruebas: se mueve solo y elige la primera carta
const DEV = Q.has('dev');
if (DEV && Q.has('flores')) { save.flores = +Q.get('flores') || 0; persist(); }

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const icon = (id, emoji) => IMG['icono_' + id] ? `<img class="icimg" src="${IMG['icono_' + id]}" alt="">` : emoji;
// Arma de la partida: si ya evolucionó, su nombre y su ícono (o el ícono normal con brillo dorado mientras llega el arte)
const wName = (w) => w.evo ? EVOS[w.id].name : WEAPONS[w.id].name;
const wIcon = (w) => !w.evo ? icon(w.id, WEAPONS[w.id].icon)
  : IMG['icono_evo_' + w.id] ? `<img class="icimg" src="${IMG['icono_evo_' + w.id]}" alt="">` : `<span class="evoic">${icon(w.id, WEAPONS[w.id].icon)}</span>`;
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const angDiff = (a, b) => Math.abs(Phaser.Math.Angle.Wrap(a - b));

// ---------- Sonidos sintetizados ----------
const Sfx = {
  ctx: null, on: true, last: {},
  init() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* sin audio */ } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, d, type = 'sine', v = 0.15, slide = 0) {
    const c = this.ctx; if (!c || !this.on) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  },
  noise(d, v = 0.2, f = 1200) {
    const c = this.ctx; if (!c || !this.on) return;
    const b = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
    const s = c.createBufferSource(); s.buffer = b;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f;
    const g = c.createGain(); g.gain.value = v;
    s.connect(fl).connect(g).connect(c.destination); s.start();
  },
  play(k) {
    const now = performance.now(), gap = { hit: 45, pick: 30, boom: 80, swing: 60 }[k] || 0;
    if (gap && now - (this.last[k] || 0) < gap) return;
    this.last[k] = now;
    switch (k) {
      case 'hit': this.noise(0.05, 0.1, 2600); break;
      case 'pick': this.tone(900 + Math.random() * 250, 0.06, 'sine', 0.05, 1.5); break;
      case 'lvl': [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.12), i * 70)); break;
      case 'hurt': this.tone(170, 0.18, 'sawtooth', 0.11, 0.5); break;
      case 'boom': this.noise(0.28, 0.22, 700); break;
      case 'boss': this.tone(80, 1.0, 'sawtooth', 0.16, 0.5); this.noise(0.9, 0.14, 380); break;
      case 'dash': this.tone(320, 0.12, 'triangle', 0.08, 2.2); break;
      case 'ability': this.tone(200, 0.45, 'square', 0.09, 3); this.noise(0.45, 0.16, 1600); break;
      case 'swing': this.noise(0.07, 0.06, 4200); break;
      case 'chest': [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.12), i * 60)); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.32, 'triangle', 0.14), i * 110)); break;
      case 'lose': [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.12), i * 160)); break;
    }
  },
};

// ---------- Texturas hechas con código ----------
function seeded(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h); draw(t.getContext(), w, h); t.refresh();
}
function makeTextures(s) {
  canvasTex(s, 'dot', 16, 16, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(8, 8, 7, 0, 7); c.fill(); });
  canvasTex(s, 'glow', 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  canvasTex(s, 'soul', 28, 28, (c) => {
    const g = c.createRadialGradient(14, 14, 0, 14, 14, 14);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#9ffff4'); g.addColorStop(0.6, 'rgba(63,224,208,.6)'); g.addColorStop(1, 'rgba(63,224,208,0)');
    c.fillStyle = g; c.fillRect(0, 0, 28, 28);
  });
  canvasTex(s, 'aura', 256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 40, 128, 128, 128);
    g.addColorStop(0, 'rgba(63,224,208,0)'); g.addColorStop(0.7, 'rgba(63,224,208,.18)'); g.addColorStop(0.93, 'rgba(120,255,240,.45)'); g.addColorStop(1, 'rgba(63,224,208,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    const r = seeded(7);
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, d = 60 + r() * 60, rr = 10 + r() * 18;
      const gg = c.createRadialGradient(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 0, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, rr);
      gg.addColorStop(0, 'rgba(160,255,245,.28)'); gg.addColorStop(1, 'rgba(160,255,245,0)');
      c.fillStyle = gg; c.fillRect(0, 0, 256, 256);
    }
  });
  canvasTex(s, 'puddle', 128, 72, (c) => {
    const g = c.createRadialGradient(64, 36, 4, 64, 36, 62);
    g.addColorStop(0, 'rgba(120,255,240,.75)'); g.addColorStop(0.7, 'rgba(40,190,200,.55)'); g.addColorStop(1, 'rgba(40,190,200,0)');
    c.save(); c.scale(1, 36 / 62); c.fillStyle = g; c.beginPath(); c.arc(64, 62, 62, 0, 7); c.fill(); c.restore();
  });
  // Ayudas del mapa dibujadas con código (las reemplazan obj_iman / obj_tamal / obj_campana cuando lleguen las imágenes)
  canvasTex(s, 'help_iman', 64, 64, (c) => {
    c.lineCap = 'butt'; c.lineWidth = 16; c.strokeStyle = '#2a1200'; c.beginPath(); c.arc(32, 28, 19, Math.PI, 0); c.lineTo(51, 52); c.moveTo(13, 28); c.lineTo(13, 52); c.stroke();
    c.lineWidth = 11; c.strokeStyle = '#e8364a'; c.beginPath(); c.arc(32, 28, 19, Math.PI, 0); c.lineTo(51, 46); c.moveTo(13, 28); c.lineTo(13, 46); c.stroke();
    c.fillStyle = '#e8e2d8'; c.fillRect(8, 45, 11, 10); c.fillRect(45, 45, 11, 10);
    c.strokeStyle = '#2a1200'; c.lineWidth = 2.5; c.strokeRect(8, 45, 11, 10); c.strokeRect(45, 45, 11, 10);
  });
  canvasTex(s, 'help_tamal', 64, 64, (c) => {
    c.fillStyle = '#2a1200'; c.beginPath(); c.ellipse(32, 36, 15, 26, 0.5, 0, 7); c.fill();
    c.fillStyle = '#c9a25a'; c.beginPath(); c.ellipse(32, 36, 12, 23, 0.5, 0, 7); c.fill();
    c.fillStyle = '#ffd86a'; c.beginPath(); c.ellipse(33, 33, 7, 15, 0.5, 0, 7); c.fill();
    c.strokeStyle = '#8a6a2a'; c.lineWidth = 2; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(22 + i * 4, 52 - i * 2); c.lineTo(38 + i * 4, 14 - i * 2); c.stroke(); }
    c.fillStyle = '#ffd86a'; c.beginPath(); c.ellipse(33, 33, 6, 13, 0.5, 0, 7); c.fill();
  });
  canvasTex(s, 'help_campana', 64, 64, (c) => {
    c.fillStyle = '#2a1200'; c.beginPath(); c.moveTo(10, 50); c.quadraticCurveTo(14, 44, 16, 26); c.quadraticCurveTo(32, 2, 48, 26); c.quadraticCurveTo(50, 44, 54, 50); c.closePath(); c.fill();
    const g = c.createLinearGradient(14, 0, 50, 0); g.addColorStop(0, '#b06a1e'); g.addColorStop(0.45, '#ffd25a'); g.addColorStop(1, '#a05a14');
    c.fillStyle = g; c.beginPath(); c.moveTo(14, 47); c.quadraticCurveTo(18, 42, 19, 27); c.quadraticCurveTo(32, 8, 45, 27); c.quadraticCurveTo(46, 42, 50, 47); c.closePath(); c.fill();
    c.fillStyle = '#2a1200'; c.beginPath(); c.arc(32, 53, 6, 0, 7); c.fill(); c.fillStyle = '#ffd25a'; c.beginPath(); c.arc(32, 53, 3.5, 0, 7); c.fill();
    c.fillStyle = '#2a1200'; c.fillRect(29, 4, 6, 7);
  });
  canvasTex(s, 'rocket', 34, 14, (c) => {
    c.fillStyle = '#2a1200'; c.fillRect(3, 2, 24, 10);
    c.fillStyle = '#e8364a'; c.fillRect(5, 4, 20, 6); c.fillStyle = '#ffd25a'; c.fillRect(11, 4, 4, 6);
    c.fillStyle = '#2a1200'; c.beginPath(); c.moveTo(27, 1); c.lineTo(34, 7); c.lineTo(27, 13); c.fill();
    c.fillStyle = '#ffb020'; c.beginPath(); c.moveTo(27, 3); c.lineTo(32, 7); c.lineTo(27, 11); c.fill();
  });
  canvasTex(s, 'stone', 18, 18, (c) => { c.fillStyle = '#1a0b2b'; c.beginPath(); c.arc(9, 9, 8, 0, 7); c.fill(); c.fillStyle = '#9a8a9f'; c.beginPath(); c.arc(9, 9, 6, 0, 7); c.fill(); c.fillStyle = '#d8cde0'; c.beginPath(); c.arc(7, 7, 2.5, 0, 7); c.fill(); });
  canvasTex(s, 'flask', 22, 26, (c) => {
    c.fillStyle = '#1a0b2b'; c.fillRect(7, 0, 8, 8); c.beginPath(); c.arc(11, 16, 10, 0, 7); c.fill();
    c.fillStyle = '#c9b48a'; c.fillRect(8, 1, 6, 6); c.fillStyle = '#5fe9dc'; c.beginPath(); c.arc(11, 16, 8, 0, 7); c.fill();
    c.fillStyle = '#d9fffb'; c.beginPath(); c.arc(8, 13, 2.5, 0, 7); c.fill();
  });
  const cardCols = ['#e8364a', '#3a7bd5', '#2bb673', '#ffb020', '#9b4dca'];
  cardCols.forEach((col, i) => canvasTex(s, 'card' + i, 22, 30, (c) => {
    c.fillStyle = '#1a0b2b'; c.fillRect(0, 0, 22, 30); c.fillStyle = '#fff4e0'; c.fillRect(2, 2, 18, 26);
    c.fillStyle = col; c.fillRect(4, 4, 14, 16); c.fillStyle = '#1a0b2b'; c.fillRect(4, 22, 14, 3);
  }));
  canvasTex(s, 'chest', 80, 64, (c) => {
    c.fillStyle = '#1a0b2b'; c.fillRect(4, 18, 72, 44); c.beginPath(); c.ellipse(40, 20, 36, 16, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#8a4a1a'; c.fillRect(8, 22, 64, 36); c.fillStyle = '#a65c22'; c.beginPath(); c.ellipse(40, 21, 32, 12, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#ffcf5a'; c.fillRect(8, 30, 64, 6); c.fillRect(34, 26, 12, 18); c.fillStyle = '#1a0b2b'; c.fillRect(38, 32, 4, 7);
  });
  // Suelo del pueblo de noche
  canvasTex(s, 'ground', 256, 256, (c) => {
    const r = seeded(42);
    c.fillStyle = '#2e2040'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { // piedras del empedrado
      const x = r() * 256, y = r() * 256, w = 14 + r() * 18, h = 9 + r() * 10, a = r();
      c.fillStyle = `rgba(${60 + a * 20},${44 + a * 14},${78 + a * 22},.55)`;
      for (const dx of [-256, 0, 256]) for (const dy of [-256, 0, 256]) { c.beginPath(); c.ellipse(x + dx, y + dy, w / 2, h / 2, a * 3, 0, 7); c.fill(); }
    }
    for (let i = 0; i < 260; i++) { c.fillStyle = r() < 0.5 ? 'rgba(15,8,25,.35)' : 'rgba(90,70,110,.18)'; c.fillRect(r() * 256, r() * 256, 2, 2); }
    for (let i = 0; i < 9; i++) { // pétalos de cempasúchil
      const x = r() * 256, y = r() * 256; c.fillStyle = r() < 0.5 ? 'rgba(255,150,30,.55)' : 'rgba(255,190,60,.45)';
      c.beginPath(); c.ellipse(x, y, 2.6, 1.6, r() * 3, 0, 7); c.fill();
    }
  });
  // Adornos
  canvasTex(s, 'tumba', 64, 80, (c) => {
    c.fillStyle = '#1a0b2b'; c.beginPath(); c.moveTo(6, 78); c.lineTo(6, 30); c.arc(32, 30, 26, Math.PI, 0); c.lineTo(58, 78); c.fill();
    c.fillStyle = '#6a5a7e'; c.beginPath(); c.moveTo(10, 76); c.lineTo(10, 30); c.arc(32, 30, 22, Math.PI, 0); c.lineTo(54, 76); c.fill();
    c.fillStyle = '#8a7a9e'; c.beginPath(); c.moveTo(14, 74); c.lineTo(14, 31); c.arc(32, 31, 18, Math.PI, Math.PI * 1.5); c.lineTo(32, 74); c.fill();
    c.strokeStyle = '#3a2a4e'; c.lineWidth = 3; c.beginPath(); c.moveTo(24, 36); c.lineTo(40, 36); c.moveTo(32, 28); c.lineTo(32, 52); c.stroke();
    c.beginPath(); c.moveTo(44, 56); c.lineTo(40, 64); c.lineTo(46, 70); c.stroke();
  });
  canvasTex(s, 'velas', 56, 56, (c) => {
    [[14, 26, 26], [28, 18, 34], [42, 28, 24]].forEach(([x, y, h]) => {
      c.fillStyle = '#1a0b2b'; c.fillRect(x - 6, y - 1, 12, h + 2);
      c.fillStyle = '#f3e3c0'; c.fillRect(x - 4, y, 8, h);
      c.fillStyle = '#ffb020'; c.beginPath(); c.ellipse(x, y - 6, 3.5, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#fff2a0'; c.beginPath(); c.ellipse(x, y - 5, 1.6, 3, 0, 0, 7); c.fill();
    });
  });
  canvasTex(s, 'cempa', 60, 44, (c) => {
    const r = seeded(9);
    c.fillStyle = '#1f4a2a'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(10 + r() * 40, 30 + r() * 10, 9, 4, r() * 3, 0, 7); c.fill(); }
    for (let i = 0; i < 6; i++) {
      const x = 10 + r() * 40, y = 10 + r() * 22;
      c.fillStyle = '#1a0b2b'; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill();
      c.fillStyle = '#ff8a12'; c.beginPath(); c.arc(x, y, 7.5, 0, 7); c.fill();
      c.fillStyle = '#ffc23a'; c.beginPath(); c.arc(x - 1, y - 1, 4, 0, 7); c.fill();
    }
  });
  canvasTex(s, 'craneo', 34, 28, (c) => {
    c.fillStyle = '#1a0b2b'; c.beginPath(); c.arc(17, 13, 13, 0, 7); c.fill(); c.fillRect(9, 18, 16, 9);
    c.fillStyle = '#efe0c4'; c.beginPath(); c.arc(17, 13, 11, 0, 7); c.fill(); c.fillRect(11, 18, 12, 7);
    c.fillStyle = '#1a0b2b'; c.beginPath(); c.arc(12, 13, 3.5, 0, 7); c.arc(22, 13, 3.5, 0, 7); c.fill();
    c.fillStyle = '#e8364a'; c.beginPath(); c.arc(17, 5, 2.5, 0, 7); c.fill();
  });
}

// ---------- Escena de juego ----------
class Play extends Phaser.Scene {
  constructor() { super('play'); }
  init(data) {
    this.hunterId = data.hunter || 'machetero'; this.resume = data.resume || null;
    const r = this.resume || data;
    this.objId = OBJECTIVES[r.obj] ? r.obj : 'llorona';
    this.curses = new Set((r.curses || []).filter(c => CURSES[c]));
  }
  cursed(c) { return this.curses.has(c); }
  bossTime(k) { return k === 'llorona' && this.cursed('impaciente') ? 420 : BOSS_TIMES[k]; }
  heal(v) { if (this.cursed('sincura')) return; this.P.hp = Math.min(this.maxHp, this.P.hp + v); }

  preload() {
    for (const k in IMG) if (!this.textures.exists(k)) this.load.image(k, IMG[k]);
  }

  tex(...keys) { for (const k of keys) if (k && this.textures.exists(k)) return k; return null; }

  create() {
    makeTextures(this);
    const H = HUNTERS[this.hunterId];
    this.t = START_T; this.kills = 0; this.level = 1; this.xp = 0; this.xpNeed = this.needFor(1);
    this.pendingLv = 0; this.energy = 0; this.energyNeed = 45; this.over = false; this.chestPick = false;
    this.W = []; this.Pass = {};
    this.E = []; this.S = []; this.B = []; this.puddles = []; this.hazards = []; this.chests = []; this.fx = [];
    this.mapChests = {}; this.chestFlores = 0; this.punHits = 0;
    this.obj = { id: this.objId, done: false, failed: false, n: 0, esc: 0, di: 0 }; this.evT = EVENTS.first; this.lastEv = ''; this.soulRainT = 0;
    this.pool = []; this.soulPool = []; this.numPool = [];
    this.spawnAcc = 0; this.flockT = 95; this.bossDone = {};
    for (const k of Object.keys(BOSS_TIMES)) if (this.bossTime(k) < START_T - 5) this.bossDone[k] = true;
    this.bossAlive = null; this.shakeT = 0;
    this.won = false; this.loop = 1; this.bossN = Object.keys(this.bossDone).length; this.nextBossT = 0; this.helpers = []; this.helpT = rnd(HELPER_EVERY[0], HELPER_EVERY[1]) + 10; this.freezeT = 0;

    // Suelo, sombras, adornos
    this.groundTS = this.add.tileSprite(0, 0, 10, 10, this.tex('suelo_pueblo', 'ground')).setOrigin(0).setDepth(-100000);
    this.groundScale = this.textures.exists('suelo_pueblo') ? 0.55 : 1; this.groundTS.setTileScale(this.groundScale);
    this.shadows = this.add.graphics().setDepth(-90000);
    this.chunks = new Map(); this.propPool = [];

    // Cazador
    const P = this.P = {
      x: 0, y: 0, hp: H.hp, baseHp: H.hp, speed: H.speed, face: 0, mx: 0, my: 0, moving: false,
      hurtCd: 0, inv: 0, dashT: 0, dashCd: 0, dx: 1, dy: 0, atkT: 0, slowT: 0, pushVx: 0, pushVy: 0, pushT: 0, ph: 0, jump: 0,
    };
    this.pGlow = this.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffa040).setAlpha(0.35).setScale(2.2).setDepth(-80000);
    this.pSpr = this.add.image(0, 0, this.tex(`${this.hunterId}_camina`, `${this.hunterId}_ataque`)).setOrigin(0.5, 0.92);
    this.pBase = 92 / 205; this.pSpr.setScale(this.pBase);
    this.hpBar = this.add.graphics().setDepth(1e6);
    this.aura = this.add.image(0, 0, 'aura').setBlendMode(Phaser.BlendModes.ADD).setVisible(false).setDepth(-70000);
    // Arma de la piñata equipada: empieza con ella (o sube la inicial si es la misma) y tiene su bono toda la partida
    this.gear = {};
    const eq = save.equipo && save.armas[save.equipo] ? save.equipo : null;
    this.addWeapon(H.weapon);
    this.W[0].lv += tl('for_arranque');
    if (eq) {
      const gb = gearBonus(save.armas[eq]); this.gear[eq] = gb;
      if (eq === H.weapon) this.W[0].lv = Math.max(this.W[0].lv, gb.lv); else { this.addWeapon(eq); this.W[1].lv = gb.lv; }
    }
    this.P.hp = this.maxHp; this.rerolls = tl('for_cambio'); this.revived = false; this.bossKills = [];

    this.cameras.main.startFollow(this.pSpr, true, 0.18, 0.18);
    this.onResize(); this.scale.on('resize', this.onResize, this);

    // Partículas
    this.fxDeath = this.add.particles(0, 0, 'dot', { speed: { min: 60, max: 190 }, lifespan: 420, scale: { start: 0.7, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(950000);
    this.fxSpark = this.add.particles(0, 0, 'dot', { speed: { min: 80, max: 260 }, lifespan: 500, scale: { start: 0.6, end: 0 }, tint: [0xff5a8a, 0xffd25a, 0x5ad0ff, 0x7dff8a, 0xffffff], emitting: false, blendMode: 'ADD' }).setDepth(950000);
    this.fxSmoke = this.add.particles(0, 0, 'glow', { speed: { min: 10, max: 40 }, lifespan: 900, scale: { start: 0.25, end: 0.6 }, alpha: { start: 0.35, end: 0 }, tint: 0x7ff7ea, emitting: false, blendMode: 'ADD' }).setDepth(-60000);

    // Entrada
    this.setupInput();
    this.hud = new Hud(this);
    this.hud.show();
    if (START_T > 0) { for (let i = 0; i < Math.min(14, Math.floor(START_T / 40)); i++) this.levelUpAuto(); }
    if (!this.resume) this.setupObjective();
    $('fog').classList.toggle('hidden', !this.cursed('niebla'));
    if (this.resume) this.restore(this.resume);
    else this.banner('¡Que empiece la noche!', 'Sobrevive y caza a La Llorona', 2200);
    window.__ndl = this;
  }

  onResize() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setZoom(clamp(Math.min(w, h) / 500, 0.72, 1.35));
  }

  // ---------- Entrada ----------
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ESC');
    this.keys.SPACE.on('down', () => this.dash());
    this.keys.E.on('down', () => this.ability());
    this.keys.ESC.on('down', () => this.hud.pause());
    this.joy = { on: false, ox: 0, oy: 0, x: 0, y: 0, id: -1 };
    this.lastTap = 0; this.lastTapX = 0; this.lastTapY = 0;
    const base = $('joyBase') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'joyBase' });
    const knob = $('joyKnob') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'joyKnob' });
    Object.assign(base.style, { position: 'fixed', width: '110px', height: '110px', borderRadius: '50%', border: '3px solid rgba(255,244,224,.35)', background: 'rgba(40,20,60,.25)', pointerEvents: 'none', display: 'none', transform: 'translate(-50%,-50%)' });
    Object.assign(knob.style, { position: 'fixed', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,207,90,.7)', border: '3px solid #2a1200', pointerEvents: 'none', display: 'none', transform: 'translate(-50%,-50%)' });
    this.joyEls = { base, knob };
    this.input.on('pointerdown', (p) => {
      Sfx.init();
      const now = performance.now();
      if (now - this.lastTap < 280 && Math.hypot(p.x - this.lastTapX, p.y - this.lastTapY) < 60) this.dash();
      this.lastTap = now; this.lastTapX = p.x; this.lastTapY = p.y;
      if (this.joy.on) return;
      Object.assign(this.joy, { on: true, ox: p.x, oy: p.y, x: p.x, y: p.y, id: p.id });
      const r = this.game.canvas.getBoundingClientRect(), sx = r.width / this.scale.width;
      Object.assign(base.style, { left: r.left + p.x * sx + 'px', top: r.top + p.y * sx + 'px', display: 'block' });
      Object.assign(knob.style, { left: r.left + p.x * sx + 'px', top: r.top + p.y * sx + 'px', display: 'block' });
    });
    this.input.on('pointermove', (p) => {
      if (!this.joy.on || p.id !== this.joy.id) return;
      this.joy.x = p.x; this.joy.y = p.y;
      let dx = p.x - this.joy.ox, dy = p.y - this.joy.oy; const d = Math.hypot(dx, dy), m = 48;
      if (d > m) { dx *= m / d; dy *= m / d; }
      const r = this.game.canvas.getBoundingClientRect(), sx = r.width / this.scale.width;
      knob.style.left = r.left + (this.joy.ox + dx) * sx + 'px'; knob.style.top = r.top + (this.joy.oy + dy) * sx + 'px';
    });
    const up = (p) => { if (p.id !== this.joy.id) return; this.joy.on = false; base.style.display = 'none'; knob.style.display = 'none'; };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
    this.events.once('shutdown', () => { base.style.display = 'none'; knob.style.display = 'none'; this.scale.off('resize', this.onResize, this); });
  }

  // ---------- Estadísticas ----------
  pl(id) { return this.Pass[id] || 0; }
  get dmgMul() { return 1 + 0.1 * this.pl('piedra') + 0.06 * tl('atk_filo'); }
  get areaMul() { return 1 + 0.1 * this.pl('ojo') + 0.06 * tl('atk_area'); }
  get amount() { return Math.ceil(this.pl('morral') / 2) + tl('atk_arsenal'); }
  get cdMul() { return Math.max(0.35, 1 - 0.07 * this.pl('veladora') - 0.04 * tl('atk_ritmo')); }
  get maxHp() { return this.P.baseHp + 20 * this.pl('maguey') + 12 * tl('sup_vida'); }
  get magnet() { return 85 * (1 + 0.35 * this.pl('ofrenda')) * (1 + 0.15 * tl('for_iman')); }
  needFor(l) { return Math.floor(5 + l * 3.2 + Math.pow(l, 1.65)); }

  // ---------- Bucle ----------
  update(time, deltaMs) {
    if (this.over) return;
    const dt = Math.min(deltaMs / 1000, 0.05);
    for (let i = 0; i < SPEED && !this.over; i++) this.step(dt);
  }

  step(dt) {
    this.t += dt;
    if (this.killsAt10 == null && this.t >= FLOWERS.afterT) this.killsAt10 = this.kills;
    this.saveAcc = (this.saveAcc || 0) + dt;
    if (this.saveAcc >= 3) { this.saveAcc = 0; this.saveRun(); }
    this.updatePlayer(dt);
    this.updateDirector(dt);
    this.buildGrid();
    this.updateEnemies(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updatePuddles(dt);
    this.updateHazards(dt);
    this.updateSouls(dt);
    this.updateChests();
    this.updateWorld();
    this.drawShadows();
    this.hud.tick(dt);
  }

  updatePlayer(dt) {
    const P = this.P, k = this.keys;
    let mx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let my = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (this.joy.on) {
      const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, d = Math.hypot(dx, dy);
      if (d > 8) { const s = Math.min(1, d / 48); mx = dx / d * s; my = dy / d * s; }
    }
    if (AUTO) { const a = this.t * 0.6; mx = Math.cos(a); my = Math.sin(a * 0.7); }
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    P.moving = ml > 0.05;
    if (P.moving) { P.dx = mx / Math.max(ml, 1e-6); P.dy = my / Math.max(ml, 1e-6); P.face = Math.atan2(P.dy, P.dx); }
    let spd = P.speed * (1 + 0.08 * this.pl('huaraches') + 0.05 * this.pl('espuelas') + 0.05 * tl('sup_paso')) * (P.slowT > 0 ? 0.55 : 1);
    let vx = mx * spd, vy = my * spd;
    if (P.dashT > 0) { P.dashT -= dt; vx = P.dx * 560; vy = P.dy * 560; if (Math.random() < 0.6) this.afterimage(); }
    if (P.pushT > 0) { P.pushT -= dt; vx += P.pushVx; vy += P.pushVy; }
    P.x += vx * dt; P.y += vy * dt;
    P.hurtCd -= dt; P.inv -= dt; P.dashCd -= dt; P.atkT -= dt; P.slowT -= dt;
    const regen = 0.3 * this.pl('maguey') + 0.25 * tl('sup_sanar');
    if (regen > 0) this.heal(regen * dt);

    // Pose y animación por código
    const s = this.pSpr;
    const want = P.atkT > 0 ? this.tex(`${this.hunterId}_ataque`)
      : P.moving ? this.tex(`${this.hunterId}_camina`, `${this.hunterId}_ataque`)
        : this.tex(`${this.hunterId}_quieto`, `${this.hunterId}_camina`, `${this.hunterId}_ataque`);
    if (s.texture.key !== want) s.setTexture(want);
    if (P.moving) P.ph += dt * 9; else P.ph += dt * 2.2;
    const bob = P.moving ? Math.abs(Math.sin(P.ph)) * 6 : Math.sin(P.ph) * 1.5;
    const sq = P.moving ? 1 - 0.06 * Math.abs(Math.cos(P.ph)) : 1 + 0.02 * Math.sin(P.ph);
    if (Math.abs(P.dx) > 0.15) s.setFlipX(P.dx < 0);
    s.x = P.x; s.y = P.y - bob - P.jump;
    const atkPop = P.atkT > 0 ? 1.08 : 1;
    s.setScale(this.pBase * atkPop * (2 - sq) * (1 + P.jump / 160), this.pBase * atkPop * sq * (1 + P.jump / 160));
    s.rotation = P.moving ? Math.sin(P.ph) * 0.07 + P.dx * 0.06 : 0;
    s.setDepth(P.y);
    s.setAlpha(P.inv > 0 && P.dashT <= 0 ? 0.6 + 0.4 * Math.sin(this.t * 40) : 1);
    if (P.hurtFlash > 0) { P.hurtFlash -= dt; s.setTint(0xff6a6a); } else s.clearTint();
    this.pGlow.setPosition(P.x, P.y - 30);
    this.aura.setPosition(P.x, P.y - 10);
    // Barra de vida
    const g = this.hpBar; g.clear();
    const w = 54, frac = clamp(P.hp / this.maxHp, 0, 1);
    g.fillStyle(0x0c0614, 1).fillRoundedRect(P.x - w / 2 - 2, P.y + 8, w + 4, 9, 4);
    g.fillStyle(frac > 0.35 ? 0x5ee87a : 0xff4a4a, 1).fillRoundedRect(P.x - w / 2, P.y + 10, w * frac, 5, 2);
  }

  afterimage() {
    const s = this.pSpr, im = this.add.image(s.x, s.y, s.texture.key).setOrigin(0.5, 0.92).setScale(s.scaleX, s.scaleY).setFlipX(s.flipX)
      .setTintFill(0xffcf5a).setAlpha(0.45).setDepth(s.depth - 1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: im, alpha: 0, duration: 220, onComplete: () => im.destroy() });
  }

  dash() {
    const P = this.P; if (this.over || P.dashCd > 0 || this.scene.isPaused()) return;
    P.dashT = 0.17; P.inv = 0.38; P.dashCd = (2.2 - 0.25 * tl('sup_agil')) * (1 - 0.1 * this.pl('espuelas')); Sfx.play('dash');
  }

  // ---------- Director: qué sale y cuándo ----------
  updateDirector(dt) {
    const t = this.t;
    if (!this.won) { for (const k of Object.keys(BOSS_TIMES)) if (t >= this.bossTime(k) && !this.bossDone[k]) { this.bossDone[k] = true; this.spawnBoss(k); } }
    else if (!this.bossAlive && t >= this.nextBossT) { this.nextBossT = Infinity; this.spawnBoss(ENDLESS.order[this.bossN % 3]); }
    this.updateHelpers(dt);
    this.updateObjective(dt);
    this.updateEvents(dt);
    // Cofres del mapa (con flecha): otra oportunidad de evolucionar, además de los de jefe
    MAP_CHESTS.forEach((ct, i) => {
      if (t >= ct && !this.mapChests[i]) {
        this.mapChests[i] = true; const a = rnd(0, 6.28), d = rnd(300, 420);
        this.spawnChest(this.P.x + Math.cos(a) * d, this.P.y + Math.sin(a) * d * 0.8);
        this.banner('¡Apareció un cofre!', 'Sigue la flecha dorada', 1600);
      }
    });
    this.moonT = (this.moonT || 0) - dt;

    const alive = this.E.length;
    const cap = this.bossAlive ? 240 : 330;
    let rate = Math.min(1.6 + t / 36, 11);
    if (this.bossAlive) rate *= 0.55;
    this.spawnAcc += rate * dt;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (alive >= cap) break;
      const w = [['calaquita', 10]];
      if (t > 50) w.push(['chaneque', 3 + t / 60]);
      if (t > 140) w.push(['nahual', (2 + t / 120) * (this.moonT > 0 ? 3 : 1)]);
      if (t > 210) w.push(['chupacabras', 1 + t / 200]);
      if (t > 270) w.push(['anima', 2 + t / 150]);
      let tot = 0; for (const [, v] of w) tot += v;
      let r = Math.random() * tot, k = 'calaquita';
      for (const [kk, v] of w) { r -= v; if (r <= 0) { k = kk; break; } }
      const [x, y] = this.edgePoint();
      this.spawn(k, x, y);
    }
    if (t > 85) { this.flockT -= dt; if (this.flockT <= 0) { this.flockT = rnd(18, 28); this.spawnFlock(); } }
  }

  edgePoint(extra = 60) {
    // un punto justo afuera de lo que se ve (en el borde del rectángulo de la cámara)
    const v = this.cameras.main.worldView, w = v.width + extra * 2, h = v.height + extra * 2;
    let r = Math.random() * (2 * w + 2 * h), x, y;
    if (r < w) { x = r; y = 0; } else if ((r -= w) < h) { x = w; y = r; } else if ((r -= h) < w) { x = w - r; y = h; } else { x = 0; y = h - (r - w); }
    return [this.P.x - w / 2 + x, this.P.y - h / 2 + y];
  }

  spawnFlock() {
    const v = this.cameras.main.worldView, a = Math.random() * Math.PI * 2;
    const R = Math.hypot(v.width, v.height) / 2 + 60;
    const cx = this.P.x + Math.cos(a) * R, cy = this.P.y + Math.sin(a) * R;
    const dir = Math.atan2(this.P.y - cy, this.P.x - cx), n = Math.floor(rnd(6, 10 + this.t / 60));
    for (let i = 0; i < n; i++) {
      const off = (i - n / 2) * 34, e = this.spawn('lechuza', cx + Math.cos(dir + Math.PI / 2) * off - Math.cos(dir) * Math.abs(off) * 0.5, cy + Math.sin(dir + Math.PI / 2) * off - Math.sin(dir) * Math.abs(off) * 0.5);
      e.vx = Math.cos(dir) * e.spd; e.vy = Math.sin(dir) * e.spd;
    }
  }

  getSprite(key) {
    const s = this.pool.pop() || this.add.image(0, 0, key).setOrigin(0.5, 0.9);
    s.setTexture(key).setVisible(true).setActive(true).setAlpha(1).clearTint().setRotation(0).setFlipX(false);
    return s;
  }

  spawn(k, x, y) {
    const d = ENEMIES[k];
    const hpMul = d.boss ? 1 : 1 + this.t / 110 + Math.pow(this.t / 330, 2);
    const key = this.tex(d.tex[0], d.tex[1]);
    const s = this.getSprite(key);
    const e = { k, d, x, y, hp: d.hp * hpMul, max: d.hp * hpMul, spd: d.spd * rnd(0.9, 1.1) * (this.cursed('prisa') ? 1.25 : 1), dmg: d.dmg, r: d.r, s, kx: 0, ky: 0, flash: 0, slowT: 0, stun: 0, ph: Math.random() * 6, state: 'walk', st: 0, cd: rnd(0.5, 2), alive: true, vx: 0, vy: 0 };
    e.bs = d.size / (d.boss ? 336 : 205); s.setScale(e.bs);
    this.E.push(e);
    return e;
  }

  spawnBoss(k) {
    const [x, y] = this.edgePoint(40);
    const e = this.spawn(k, x, y);
    e.boss = true; e.cd = 2.5; e.cd2 = 6; e.cd3 = 9; e.n = this.bossN++; e.loop = Math.floor(e.n / 3) + 1;
    if (e.n >= 3) { // vuelve más fuerte que el jefe anterior
      e.hp = e.max = ENEMIES.llorona.hp * Math.pow(ENDLESS.hpGrow, e.n - 2);
      e.dmg = e.d.dmg * (1 + ENDLESS.dmgPerLoop * (e.loop - 1)); e.spd *= 1 + ENDLESS.spdPerLoop * (e.loop - 1);
    }
    this.bossAlive = e;
    Sfx.play('boss');
    this.cameras.main.shake(400, 0.006);
    const sub = { cadejo: 'Embiste en línea recta: ¡esquiva!', charro: 'Su lazo te jala hacia él', llorona: 'Su grito empuja y deja charcos' }[k];
    if (e.loop > 1) this.banner(`¡Volvió ${e.d.boss}!`, `Vuelta ${e.loop} · más fuerte que nunca`, 2600);
    else this.banner(`¡Llegó ${e.d.boss}!`, sub, 2600);
  }
  bossLabel(e) { return e.loop > 1 ? `${e.d.boss} · Vuelta ${e.loop}` : e.d.boss; }

  // ---------- Rejilla para buscar cercanos ----------
  buildGrid() {
    const G = this.grid || (this.grid = new Map()); G.clear();
    for (const e of this.E) {
      const key = (Math.floor(e.x / 80) + 5000) * 100000 + (Math.floor(e.y / 80) + 5000);
      let c = G.get(key); if (!c) G.set(key, c = []); c.push(e);
    }
  }
  near(x, y, r, cb) {
    const G = this.grid; if (!G) return; const x0 = Math.floor((x - r) / 80), x1 = Math.floor((x + r) / 80), y0 = Math.floor((y - r) / 80), y1 = Math.floor((y + r) / 80);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const c = G.get((cx + 5000) * 100000 + (cy + 5000)); if (!c) continue;
      for (const e of c) if (e.alive) { const dx = e.x - x, dy = e.y - y, rr = r + e.r; if (dx * dx + dy * dy <= rr * rr) cb(e); }
    }
  }
  nearest(x, y, maxR, skip) {
    let best = null, bd = maxR * maxR;
    for (const e of this.E) {
      if (!e.alive || e.ghost || (skip && skip.has(e))) continue;
      const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  nearestN(x, y, maxR, n) {
    const arr = [];
    for (const e of this.E) {
      if (!e.alive || e.ghost) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < maxR * maxR) arr.push([d, e]);
    }
    arr.sort((a, b) => a[0] - b[0]);
    return arr.slice(0, n).map(a => a[1]);
  }

  // ---------- Enemigos ----------
  updateEnemies(dt) {
    const P = this.P;
    for (const e of this.E) {
      if (!e.alive) continue;
      if (e.dotT > 0) { // sangrado (Machete de obsidiana) o quemadura (Lazo de fuego)
        e.dotT -= dt; e.dotTick -= dt;
        if (e.dotTick <= 0) { e.dotTick = 0.5; this.hurt(e, e.dotD, 0, 0, { quiet: true, raw: true }); if (!e.alive) continue; }
      }
      const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1;
      let vx = 0, vy = 0;
      const slow = e.slowT > 0 ? (e.boss ? 0.8 : 0.55) : 1; // a los jefes el humo y el agua los frenan menos
      e.slowT -= dt; e.flash -= dt; e.cd -= dt; e.st -= dt;
      if (this.freezeT > 0 && !e.boss) { /* congelados por la campana */ }
      else if (e.stun > 0) { e.stun -= dt; }
      else if (e.k === 'lechuza') { vx = e.vx; vy = e.vy; if (dist > 1700) { this.remove(e); continue; } }
      else if (e.k === 'chupacabras') {
        if (e.state === 'walk') { vx = dx / dist * e.spd * slow; vy = dy / dist * e.spd * slow; if (dist < 250 && e.cd <= 0) { e.state = 'wind'; e.st = 0.6; e.tx = P.x; e.ty = P.y; } }
        else if (e.state === 'wind') { if (e.st <= 0) { e.state = 'leap'; e.st = 0.42; const a = Math.atan2(e.ty - e.y, e.tx - e.x); e.lx = Math.cos(a) * 560; e.ly = Math.sin(a) * 560; } }
        else if (e.state === 'leap') { vx = e.lx; vy = e.ly; if (e.st <= 0) { e.state = 'rest'; e.st = 0.5; } }
        else if (e.state === 'rest') { if (e.st <= 0) { e.state = 'walk'; e.cd = rnd(2, 3); } }
      }
      else if (e.k === 'anima') {
        const c = (this.t + e.ph) % 4.2; const g = c > 2.8; e.ghost = g;
        vx = dx / dist * e.spd * slow; vy = dy / dist * e.spd * slow;
      }
      else if (e.k === 'cadejo') {
        if (e.state === 'walk') { vx = dx / dist * e.spd * slow; vy = dy / dist * e.spd * slow; if (e.cd <= 0) { e.state = 'aim'; e.st = 0.85; e.a = Math.atan2(dy, dx); this.telegraphLine(e, 0.85); } }
        else if (e.state === 'aim') { if (e.st <= 0) { e.state = 'charge'; e.st = 0.62; Sfx.play('dash'); } }
        else if (e.state === 'charge') { vx = Math.cos(e.a) * 660; vy = Math.sin(e.a) * 660; if (Math.random() < 0.5) this.fxDeath.emitParticleAt(e.x, e.y - 30, 1); }
        else if (e.state === 'rest') { if (e.st <= 0) { e.state = 'walk'; e.cd = 3.2; } }
        if (e.state === 'charge' && e.st <= 0) { e.state = 'rest'; e.st = 0.7; }
      }
      else if (e.k === 'charro') {
        vx = dx / dist * e.spd * slow; vy = dy / dist * e.spd * slow;
        if (e.cd <= 0 && dist < 520) { e.cd = 3.4; this.throwLasso(e); }
        e.cd2 -= dt; if (e.cd2 <= 0) { e.cd2 = 9; for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; this.spawn('calaquita', e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); } this.fxDeath.explode(16, e.x, e.y - 40); }
      }
      else if (e.k === 'llorona') {
        vx = dx / dist * e.spd * slow; vy = dy / dist * e.spd * slow;
        if (e.cd <= 0) { e.cd = 5; this.scream(e); }
        e.cd2 -= dt; if (e.cd2 <= 0) { e.cd2 = 6.5; for (let i = 0; i < 3; i++) this.hazardPuddle(P.x + rnd(-160, 160), P.y + rnd(-130, 130)); }
        e.cd3 -= dt; if (e.cd3 <= 0) { e.cd3 = 11; for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + 0.4; this.spawn('anima', e.x + Math.cos(a) * 110, e.y + Math.sin(a) * 110); } }
      }
      else if (e.d.static) { e.kx = 0; e.ky = 0; }
      else if (e.d.flee) { // Chupacabras dorado: huye de ti y se escapa si no lo cazas a tiempo
        vx = -dx / dist * e.spd * slow; vy = -dy / dist * e.spd * slow;
        e.life -= dt; if (Math.random() < 0.4) this.fxSpark.emitParticleAt(e.x, e.y - 40, 1);
        if (e.life <= 0) { this.remove(e); this.doradoEscaped(); continue; }
      }
      else { vx = dx / dist * e.spd * slow; vy = dy / dist * e.spd * slow; }

      // Empujes
      e.kx *= Math.pow(0.0005, dt); e.ky *= Math.pow(0.0005, dt);
      e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;

      // Separación entre enemigos
      if (!e.d.flyer) {
        let n = 0;
        this.near(e.x, e.y, e.r * 0.7, (o) => {
          if (o === e || n > 6 || o.d.flyer) return; n++;
          const ox = e.x - o.x, oy = e.y - o.y, dd = Math.hypot(ox, oy) || 0.01, min = (e.r + o.r) * 0.75;
          if (dd < min) { const push = (min - dd) * (o.boss ? 1 : 0.5); e.x += ox / dd * push; e.y += oy / dd * push; }
        });
      }

      // Daño al cazador
      if (e.dmg > 0 && !e.ghost && !(this.freezeT > 0 && !e.boss) && dist < e.r + 18 && P.hurtCd <= 0 && P.inv <= 0 && P.jump <= 0) this.hurtPlayer(e.dmg);

      // Dibujo
      const s = e.s;
      e.atkT = (e.atkT || 0) - dt;
      const attacking = (dist < e.r + 60) || e.atkT > 0 || e.state === 'wind' || e.state === 'leap' || e.state === 'charge' || e.state === 'aim';
      let key = attacking ? this.tex(e.d.tex[1], e.d.tex[0]) : this.tex(e.d.tex[0], e.d.tex[1]);
      // dos cuadros al caminar (aleteo, galope) cuando hay una segunda imagen
      if (!attacking && key === e.d.tex[0] && this.textures.exists(key + '2') && Math.floor(e.ph * (e.d.flap || 5)) % 2) key = key + '2';
      if (s.texture.key !== key) { s.setTexture(key); e.bs = e.d.size / (e.boss ? 336 : 205); if (e.d.static) e.bs = e.d.size / s.height; }
      const moving = Math.abs(vx) + Math.abs(vy) > 5;
      e.ph += dt * (moving ? 1 : 0.3);
      let bob = 0, sq = 1, rot = 0;
      if (e.d.static) { bob = 0; sq = 1 + Math.sin(this.t * 3) * 0.02; }
      else if (e.d.flyer || e.k === 'anima' || e.k === 'llorona') { bob = 10 + Math.sin(e.ph * 6) * 5; sq = 1 + Math.sin(e.ph * 12) * 0.03; }
      else { bob = Math.abs(Math.sin(e.ph * 9)) * (e.boss ? 5 : 3.5); sq = 1 - 0.06 * Math.abs(Math.cos(e.ph * 9)); rot = Math.sin(e.ph * 9) * 0.07; }
      if (e.state === 'wind') { s.x = e.x + Math.sin(this.t * 70) * 3; sq = 0.84; } else s.x = e.x;
      if (e.state === 'leap') { bob = 26; rot = 0.25 * Math.sign(e.lx || 1); }
      if (e.state === 'aim') { s.x = e.x + Math.sin(this.t * 60) * 3; }
      s.y = e.y - bob;
      s.setScale(e.bs * (2 - sq), e.bs * sq);
      s.rotation = rot;
      const fx = e.k === 'lechuza' ? e.vx : (e.state === 'leap' ? e.lx : e.state === 'charge' ? Math.cos(e.a) : dx);
      s.setFlipX(fx < 0);
      s.setDepth(e.y);
      if (e.flash > 0) s.setTintFill(0xffffff);
      else if (e.state === 'wind' || e.state === 'aim') s.setTint(0xff7070);
      else if (e.stun > 0 || (this.freezeT > 0 && !e.boss)) s.setTint(0xa0d8ff);
      else if (e.wolf) s.setTint(0xffe2c0);
      else if (e.d.tint && key !== e.d.tex[0]) s.setTint(e.d.tint); // sin su imagen todavía: la de base pintada
      else s.clearTint();
      s.setAlpha(e.ghost ? 0.28 : 1);
    }
    if (this.E.some(e => !e.alive)) this.E = this.E.filter(e => e.alive);
  }

  telegraphLine(e, dur) {
    const g = this.add.graphics().setDepth(-50000);
    const len = 620, w = 74;
    const draw = (a) => { g.clear(); g.fillStyle(0xff2a4a, a); g.save(); g.translateCanvas(e.x, e.y - 10); g.rotateCanvas(e.a); g.fillRect(0, -w / 2, len, w); g.lineStyle(3, 0xff6a7a, a * 2); g.strokeRect(0, -w / 2, len, w); g.restore(); };
    const o = { a: 0.08 }; draw(0.08);
    this.tweens.add({ targets: o, a: 0.28, duration: dur * 1000, onUpdate: () => draw(o.a), onComplete: () => g.destroy() });
  }

  throwLasso(e) {
    e.atkT = 0.7;
    const a = Math.atan2(this.P.y - e.y, this.P.x - e.x);
    const g = this.add.graphics().setDepth(900000);
    this.B.push({ kind: 'lasso', x: e.x, y: e.y - 70, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, life: 1.1, owner: e, g, r: 22, enemy: true });
    Sfx.play('swing');
  }

  scream(e) {
    e.atkT = 0.9;
    Sfx.play('boss');
    const g = this.add.graphics().setDepth(900000), o = { r: 20 }, P = this.P; let hit = false;
    this.tweens.add({
      targets: o, r: 340, duration: 850, ease: 'Sine.Out',
      onUpdate: () => {
        g.clear(); g.lineStyle(16, 0x7ff7ea, 0.5 * (1 - o.r / 380)); g.strokeCircle(e.x, e.y - 60, o.r);
        g.lineStyle(4, 0xffffff, 0.6 * (1 - o.r / 380)); g.strokeCircle(e.x, e.y - 60, o.r);
        const d = Math.hypot(P.x - e.x, P.y - e.y);
        if (!hit && Math.abs(d - o.r) < 34 && P.inv <= 0 && P.jump <= 0) {
          hit = true; const a = Math.atan2(P.y - e.y, P.x - e.x);
          P.pushVx = Math.cos(a) * 420; P.pushVy = Math.sin(a) * 420; P.pushT = 0.25; P.slowT = 1.5; this.hurtPlayer(12, true);
        }
      },
      onComplete: () => g.destroy(),
    });
    this.cameras.main.shake(250, 0.004);
  }

  hazardPuddle(x, y) {
    const g = this.add.graphics().setDepth(-50000);
    const h = { x, y, r: 62, t: 0, warn: 0.9, dur: 4.5, tick: 0, g, img: null };
    this.hazards.push(h);
  }

  updateHazards(dt) {
    const P = this.P;
    for (const h of this.hazards) {
      h.t += dt;
      if (h.t < h.warn) { h.g.clear(); h.g.lineStyle(3, 0x7ff7ea, 0.4 + 0.4 * Math.sin(h.t * 20)); h.g.strokeEllipse(h.x, h.y, h.r * 2, h.r * 1.2); continue; }
      if (!h.img) { h.g.clear(); h.img = this.add.image(h.x, h.y, 'puddle').setDisplaySize(h.r * 2.2, h.r * 1.3).setTint(0x60c8ff).setDepth(-50000).setAlpha(0.9); }
      h.tick -= dt;
      const dx = (P.x - h.x) / h.r, dy = (P.y - h.y) / (h.r * 0.6);
      if (dx * dx + dy * dy < 1 && h.tick <= 0 && P.inv <= 0) { h.tick = 0.5; this.hurtPlayer(6, true); P.slowT = 0.6; }
      if (h.t > h.warn + h.dur) { h.img.destroy(); h.g.destroy(); h.dead = true; }
      else if (h.t > h.warn + h.dur - 0.6) h.img.setAlpha((h.warn + h.dur - h.t) / 0.6);
    }
    if (this.hazards.some(h => h.dead)) this.hazards = this.hazards.filter(h => !h.dead);
  }

  hurtPlayer(dmg, ignoreCd) {
    const P = this.P;
    if (!ignoreCd && P.hurtCd > 0) return;
    this.dmgTaken = (this.dmgTaken || 0) + dmg;
    if (GOD) { P.hurtCd = 0.5; return; }
    P.hp -= dmg * (1 - 0.04 * tl('sup_coraza')); P.hurtCd = 0.5; P.hurtFlash = 0.15;
    Sfx.play('hurt');
    this.cameras.main.shake(90, 0.003);
    if (P.hp <= 0 && tl('sup_revivir') && !this.revived) { this.revive(); return; }
    if (P.hp <= 0) this.endRun(this.won);
  }

  revive() {
    const P = this.P; this.revived = true;
    P.hp = this.maxHp * 0.5; P.inv = 2.5;
    this.near(P.x, P.y, 260, (e) => { const a = Math.atan2(e.y - P.y, e.x - P.x); this.hurt(e, 40, Math.cos(a) * 600, Math.sin(a) * 600, { quiet: true }); });
    this.ring(P.x, P.y - 20, 260, 0xffcf5a, 600, true); this.fxSpark.explode(50, P.x, P.y - 40);
    Sfx.play('ability'); this.banner('¡Segunda vela!', 'Reviviste con la mitad de la vida', 1800);
  }

  hurt(e, dmg, kx = 0, ky = 0, opt = {}) {
    if (!e.alive || e.ghost) return;
    if (!opt.raw) dmg *= this.dmgMul;
    if (opt.dot) { e.dotD = Math.max(e.dotT > 0 ? e.dotD : 0, dmg * opt.dot); if (!(e.dotT > 0)) e.dotTick = 0.5; e.dotT = 3; }
    if (e.boss) dmg *= 1 + 0.1 * tl('atk_jefes');
    if (tl('atk_crit') && Math.random() < 0.04 * tl('atk_crit')) { dmg *= 2; opt = Object.assign({}, opt, { big: true, quiet: false }); }
    e.hp -= dmg; e.flash = 0.07;
    const kb = e.boss || e.d.mini || e.d.static ? 0.08 : (e.k === 'chupacabras' && e.state === 'leap') ? 0.2 : 1;
    e.kx += kx * kb; e.ky += ky * kb;
    if (opt.stun) e.stun = Math.max(e.stun, e.boss ? opt.stun * 0.3 : opt.stun);
    if (opt.slow) e.slowT = Math.max(e.slowT, opt.slow);
    if (!opt.quiet) this.dmgNum(e.x, e.y - e.d.size * 0.8, dmg, opt.big);
    Sfx.play('hit');
    if (e.k === 'nahual' && !e.wolf && e.hp > 0 && e.hp < e.max * 0.4) {
      e.wolf = true; e.d = ENEMIES.lobo; e.bs = ENEMIES.lobo.size / 205; e.spd = ENEMIES.lobo.spd; e.dmg = ENEMIES.lobo.dmg; e.r = ENEMIES.lobo.r;
      this.fxDeath.explode(14, e.x, e.y - 30); this.dmgText(e.x, e.y - 90, '¡AUUU!', '#ffcf5a');
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    e.alive = false;
    this.kills++; if (!e.boss) this.energy = Math.min(this.energyNeed, this.energy + 1);
    this.fxDeath.setParticleTint(e.k === 'anima' || e.k === 'llorona' ? 0x7ff7ea : e.k === 'lechuza' ? 0xff7a3a : 0xffd8a0);
    this.fxDeath.explode(e.boss ? 60 : 7, e.x, e.y - e.d.size * 0.45);
    // animación de muerte
    const s = e.s;
    this.tweens.add({ targets: s, scaleX: s.scaleX * 1.25, scaleY: 0, alpha: 0, duration: 160, onComplete: () => { s.setVisible(false); this.pool.push(s); } });
    if (e.boss) {
      this.bossKills.push({ k: e.k, loop: e.loop || 1 });
      Sfx.play('boom'); this.cameras.main.shake(500, 0.01);
      for (let i = 0; i < 40; i++) this.dropSoul(e.x + rnd(-90, 90), e.y + rnd(-70, 70), 5);
      if (this.bossAlive === e) this.bossAlive = this.E.find(o => o.alive && o.boss) || null;
      this.spawnChest(e.x, e.y);
      this.spawnHelper('iman', e.x + 70, e.y + 10);
      if (e.k === 'llorona' && !this.won) {
        this.won = true; this.nextBossT = this.t + ENDLESS.first;
        if (this.obj.id === 'llorona') this.objDone();
        Sfx.play('win'); this.banner('¡Venciste a La Llorona!', 'La noche sigue… los jefes volverán más fuertes', 3200);
      } else {
        if (this.won) this.nextBossT = this.t + ENDLESS.gap;
        this.banner(`¡Venciste a ${this.bossLabel(e)}!`, 'Soltó un cofre y un imán', 2000);
      }
      return;
    }
    if (e.k === 'altar' || e.k === 'chupadorado' || e.k === 'loboalfa') { this.specialKill(e); return; }
    const v = e.d.xp + (e.stolen || 0);
    if (v > 0) this.dropSoul(e.x, e.y, v);
  }

  remove(e) { e.alive = false; e.s.setVisible(false); this.pool.push(e.s); }

  // ---------- Almas ----------
  dropSoul(x, y, v) {
    if (this.S.length > 420) { const o = this.S.find(s => !s.pull); if (o) { o.v += v; return; } }
    const img = this.textures.exists('obj_alma');
    const sp = this.soulPool.pop() || this.add.image(0, 0, 'soul');
    if (img) { sp.setTexture(v >= 5 ? 'obj_alma_dorada' : 'obj_alma').setBlendMode(Phaser.BlendModes.NORMAL); sp.setScale((v >= 5 ? 30 : v >= 3 ? 26 : 20) / sp.height); }
    else { sp.setBlendMode(Phaser.BlendModes.ADD).setScale(v >= 5 ? 1.25 : v >= 3 ? 1 : 0.8).setTint(v >= 5 ? 0xffd25a : v >= 3 ? 0x7aa8ff : 0xffffff); }
    sp.setVisible(true).setPosition(x, y).setDepth(-40000);
    this.S.push({ x, y, v, s: sp, pull: false, vel: 0 });
  }
  updateSouls(dt) {
    const P = this.P, mag = this.magnet;
    for (const o of this.S) {
      const dx = P.x - o.x, dy = (P.y - 30) - o.y, d = Math.hypot(dx, dy);
      if (!o.pull && d < mag) o.pull = true;
      if (o.pull) { o.vel = Math.min(o.vel + 1400 * dt, 900); o.x += dx / d * o.vel * dt; o.y += dy / d * o.vel * dt; }
      if (d < 24) { o.dead = true; this.gainXp(o.v); Sfx.play('pick'); continue; }
      o.s.setPosition(o.x, o.y + Math.sin(this.t * 4 + o.x) * 2);
    }
    // los chaneques se roban almas
    for (const e of this.E) if (e.alive && e.k === 'chaneque') for (const o of this.S) if (!o.dead && !o.pull && Math.abs(o.x - e.x) < 22 && Math.abs(o.y - e.y) < 22) { o.dead = true; e.stolen = (e.stolen || 0) + o.v; }
    if (this.S.some(o => o.dead)) {
      for (const o of this.S) if (o.dead) { o.s.setVisible(false); this.soulPool.push(o.s); }
      this.S = this.S.filter(o => !o.dead);
    }
  }
  gainXp(v) {
    this.xp += v * (1 + 0.06 * tl('for_saber'));
    while (this.xp >= this.xpNeed) { this.xp -= this.xpNeed; this.level++; this.xpNeed = this.needFor(this.level); this.pendingLv++; }
    if (this.pendingLv > 0 && !this.hud.cardsOpen) this.time.delayedCall(10, () => this.hud.openCards());
  }

  // ---------- Ayudas en el mapa (imán, tamal, campana) ----------
  updateHelpers(dt) {
    this.freezeT -= dt;
    this.helpT -= dt;
    if (this.helpT <= 0) {
      this.helpT = rnd(HELPER_EVERY[0], HELPER_EVERY[1]);
      const P = this.P, miss = 1 - P.hp / this.maxHp, souls = this.S.length;
      const w = [['tamal', this.cursed('sincura') ? 0 : 0.6 + 3 * miss], ['iman', 0.3 + Math.min(2.5, souls / 50)]];
      if (this.t > 120) w.push(['campana', 0.7]);
      let tot = 0; for (const [, v] of w) tot += v;
      let r = Math.random() * tot, k = 'tamal'; for (const [kk, v] of w) { r -= v; if (r <= 0) { k = kk; break; } }
      const a = rnd(0, 6.28), d = rnd(240, 380);
      this.spawnHelper(k, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d * 0.8);
    }
    const P = this.P;
    for (const h of this.helpers) {
      if (Math.hypot(P.x - h.x, P.y - h.y) < 46) { h.dead = true; this.useHelper(h.k, h.x, h.y); }
    }
    if (this.helpers.some(h => h.dead)) { for (const h of this.helpers) if (h.dead) { h.s.destroy(); h.gl.destroy(); } this.helpers = this.helpers.filter(h => !h.dead); }
    this.drawHelperArrows();
  }
  spawnHelper(k, x, y) {
    if (this.helpers.length >= 4) { const o = this.helpers.shift(); o.s.destroy(); o.gl.destroy(); }
    const key = this.tex('obj_' + k, 'help_' + k);
    const s = this.add.image(x, y, key).setOrigin(0.5, 0.9).setDepth(y); s.setScale(66 / s.height);
    const col = { iman: 0xff5a5a, tamal: 0x7dff8a, campana: 0x7fd8ff }[k];
    const gl = this.add.image(x, y - 22, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(col).setScale(1.3).setAlpha(0.55).setDepth(y - 1);
    this.tweens.add({ targets: s, y: y - 7, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.InOut' });
    this.tweens.add({ targets: gl, alpha: 0.25, yoyo: true, repeat: -1, duration: 700 });
    this.helpers.push({ k, x, y, s, gl, col });
  }
  useHelper(k, x, y) {
    const P = this.P;
    this.fxSpark.explode(30, x, y - 20);
    if (k === 'iman') {
      for (const o of this.S) o.pull = true;
      this.ring(P.x, P.y - 20, 420, 0xff5a5a, 600, false);
      Sfx.play('chest'); this.dmgText(P.x, P.y - 110, '¡Imán!', '#ff8a8a', 26);
    } else if (k === 'tamal') {
      this.heal(this.maxHp * 0.3);
      this.ring(P.x, P.y - 20, 90, 0x7dff8a, 400, true);
      Sfx.play('lvl'); this.dmgText(P.x, P.y - 110, '+30% vida', '#7dff8a', 24);
    } else if (k === 'campana') {
      this.freezeT = 4;
      for (const e of this.E) if (e.alive && e.boss) e.stun = Math.max(e.stun, 1.2);
      this.ring(P.x, P.y - 20, 600, 0x7fd8ff, 700, true);
      this.cameras.main.flash(180, 160, 220, 255);
      Sfx.play('ability'); this.banner('¡Campanada!', 'Los enemigos quedaron congelados', 1400);
    }
  }
  drawHelperArrows() {
    const g = this.helpArrows || (this.helpArrows = this.add.graphics().setDepth(1e6 + 1));
    g.clear();
    const v = this.cameras.main.worldView, m = 26 / this.cameras.main.zoom;
    for (const h of [...this.helpers, ...this.chests.map(c => ({ x: c.x, y: c.y, col: c.cursed ? 0xb050ff : 0xffcf5a })), ...this.objTargets()]) {
      if (h.x > v.x && h.x < v.right && h.y - 30 > v.y && h.y < v.bottom) continue;
      const cx = v.centerX, cy = v.centerY, a = Math.atan2(h.y - cy, h.x - cx);
      const hw = v.width / 2 - m, hh = v.height / 2 - m, k = Math.min(Math.abs(hw / Math.cos(a)), Math.abs(hh / Math.sin(a)));
      const x = cx + Math.cos(a) * k, y = cy + Math.sin(a) * k, sz = 14 / this.cameras.main.zoom;
      g.fillStyle(0x140c20, 0.75).fillCircle(x, y, sz * 1.25);
      g.fillStyle(h.col, 1).fillTriangle(x + Math.cos(a) * sz, y + Math.sin(a) * sz, x + Math.cos(a + 2.4) * sz * 0.8, y + Math.sin(a + 2.4) * sz * 0.8, x + Math.cos(a - 2.4) * sz * 0.8, y + Math.sin(a - 2.4) * sz * 0.8);
    }
  }

  // ---------- Cofres ----------
  spawnChest(x, y, cursed) {
    const ck = cursed ? this.tex('obj_cofre_maldito', 'obj_cofre', 'chest') : this.tex('obj_cofre', 'chest');
    const s = this.add.image(x, y, ck).setOrigin(0.5, 0.9).setDepth(y); s.setScale((ck === 'chest' ? 64 : 74) / s.height);
    if (cursed && ck !== 'obj_cofre_maldito') s.setTint(0xb07aff);
    const gl = this.add.image(x, y - 26, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(cursed ? 0xb050ff : 0xffcf5a).setScale(1.6).setAlpha(0.6).setDepth(y - 1);
    this.tweens.add({ targets: s, y: y - 8, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut' });
    this.chests.push({ x, y, s, gl, cursed: !!cursed });
  }
  updateChests() {
    for (const c of this.chests) {
      if (Math.hypot(this.P.x - c.x, this.P.y - c.y) < 50) {
        c.dead = true; c.s.destroy(); c.gl.destroy(); Sfx.play('chest');
        this.fxSpark.explode(40, c.x, c.y - 30);
        this.heal(this.maxHp * 0.25);
        if (c.cursed) { // Cofre maldito: premio grande (2 cartas y 40 flores) pero sale el Lobo alfa
          this.chestFlores += 40; this.spawnMini(); this.pendingLv += 2; this.chestPick = true; this.hud.openCards(); continue;
        }
        const w = this.evoReady();
        if (w) { this.evolve(w); continue; }
        this.chestFlores += CHEST_FLORES;
        this.pendingLv++; this.chestPick = true; this.hud.openCards();
      }
    }
    if (this.chests.some(c => c.dead)) this.chests = this.chests.filter(c => !c.dead);
  }

  // ---------- Fase 2: objetivo de la partida ----------
  setupObjective() {
    const o = this.obj;
    if (o.id === 'altares') {
      const a0 = rnd(0, 6.28);
      for (let i = 0; i < 5; i++) {
        const a = a0 + i / 5 * 6.28 + rnd(-0.3, 0.3), d = rnd(650, 1150);
        const e = this.spawn('altar', Math.cos(a) * d, Math.sin(a) * d * 0.85); e.hp = e.max = 300;
      }
    } else if (o.id === 'carreta') {
      const a = rnd(0, 6.28);
      o.cart = { x: 0, y: 160, hp: 400, max: 400, tx: Math.cos(a) * 2300, ty: 160 + Math.sin(a) * 2000 };
    } else if (o.id === 'ofrenda') o.ofr = { x: 0, y: -170, hp: 600, max: 600 };
    this.buildObjectiveProps();
  }
  buildObjectiveProps() {
    const o = this.obj;
    if (o.cart) {
      o.cartS = this.add.image(o.cart.x, o.cart.y, this.tex('prop_carreta', 'chest')).setOrigin(0.5, 0.9); o.cartS.setScale(120 / o.cartS.height);
      o.goalS = this.add.image(o.cart.tx, o.cart.ty, this.tex('prop_cruz', 'chest')).setOrigin(0.5, 0.9).setDepth(o.cart.ty); o.goalS.setScale(110 / o.goalS.height);
      o.goalG = this.add.image(o.cart.tx, o.cart.ty - 40, 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0x7dff8a).setScale(2.4).setAlpha(0.5).setDepth(o.cart.ty - 1);
    }
    if (o.ofr) { o.ofrS = this.add.image(o.ofr.x, o.ofr.y, this.tex('prop_ofrenda', 'chest')).setOrigin(0.5, 0.9).setDepth(o.ofr.y); o.ofrS.setScale(120 / o.ofrS.height); }
    o.bar = this.add.graphics().setDepth(1e6);
  }
  objDone() {
    const o = this.obj; if (o.done || o.failed) return;
    o.done = true; Sfx.play('win');
    this.banner('¡Objetivo cumplido!', `${OBJECTIVES[o.id].name} · +${OBJECTIVES[o.id].flores} 🌼`, 2400);
  }
  objFail(why) {
    const o = this.obj; if (o.done || o.failed) return;
    o.failed = true; Sfx.play('lose'); this.banner('Objetivo perdido', why, 2200);
  }
  updateObjective(dt) {
    const o = this.obj, P = this.P, t = this.t;
    if (o.done || o.failed) { if (o.bar) o.bar.clear(); return; }
    const dl = Math.min(OBJ_DEADLINE, this.bossTime('llorona'));
    const bar = (x, y, f, col) => { o.bar.fillStyle(0x0c0614, 1).fillRoundedRect(x - 42, y, 84, 10, 4); o.bar.fillStyle(col, 1).fillRoundedRect(x - 40, y + 2, 80 * clamp(f, 0, 1), 6, 3); };
    if (o.bar) o.bar.clear();
    if (o.id === 'altares') { if (t >= dl) this.objFail('La Llorona llegó antes de romper los 5 altares'); }
    else if (o.id === 'carreta') {
      const c = o.cart, near = Math.hypot(P.x - c.x, P.y - c.y) < 210;
      if (near) { const a = Math.atan2(c.ty - c.y, c.tx - c.x); c.x += Math.cos(a) * 48 * dt; c.y += Math.sin(a) * 48 * dt; }
      o.tick = (o.tick || 0) - dt;
      if (o.tick <= 0) { o.tick = 0.5; this.near(c.x, c.y, 70, (e) => { if (!e.d.static && !e.d.flee) c.hp -= e.dmg * 0.5; }); }
      o.cartS.setPosition(c.x, c.y).setDepth(c.y); o.cartS.rotation = near ? Math.sin(t * 12) * 0.03 : 0;
      bar(c.x, c.y + 10, c.hp / c.max, 0xffcf5a);
      if (Math.hypot(c.tx - c.x, c.ty - c.y) < 40) { this.objDone(); o.cartS.setAlpha(0.6); }
      else if (c.hp <= 0) { this.objFail('Destruyeron la carreta'); this.fxDeath.explode(30, c.x, c.y - 40); o.cartS.setAlpha(0.35); }
      else if (t >= dl) this.objFail('La carreta no llegó a tiempo');
    } else if (o.id === 'ofrenda') {
      const f = o.ofr;
      o.tick = (o.tick || 0) - dt;
      if (o.tick <= 0) { o.tick = 0.5; this.near(f.x, f.y, 75, (e) => { if (!e.d.static && !e.d.flee) f.hp -= e.dmg * 0.5; }); }
      if (Math.hypot(P.x - f.x, P.y - f.y) < 130) f.hp = Math.min(f.max, f.hp + 6 * dt);
      bar(f.x, f.y + 10, f.hp / f.max, 0x7dff8a);
      if (f.hp <= 0) { this.objFail('Los enemigos destruyeron la ofrenda'); o.ofrS.setAlpha(0.35); this.fxDeath.explode(30, f.x, f.y - 40); }
      else if (t >= dl) this.objDone();
    } else if (o.id === 'dorado') {
      if (o.di < DORADO_TIMES.length && t >= DORADO_TIMES[o.di]) {
        o.di++; const [x, y] = this.edgePoint(-80);
        const e = this.spawn('chupadorado', x, y); e.hp = e.max = 380 * (1 + t / 240); e.life = DORADO_LIFE;
        Sfx.play('boss'); this.banner('¡El Chupacabras dorado!', `Cázalo antes de que huya (${o.di}/3)`, 1800);
      }
    }
  }
  doradoEscaped() {
    const o = this.obj; if (o.id !== 'dorado' || o.done) return;
    o.esc++; this.banner('Se escapó…', o.esc >= 3 ? '' : `Volverá (${o.esc}/3)`, 1500);
    if (o.esc >= 3) this.objFail('El Chupacabras dorado se escapó 3 veces');
  }
  specialKill(e) {
    if (e.k === 'altar') {
      const o = this.obj; o.n++;
      for (let i = 0; i < 18; i++) this.dropSoul(e.x + rnd(-50, 50), e.y + rnd(-40, 40), 2);
      this.fxDeath.setParticleTint(0xb050ff); this.fxDeath.explode(40, e.x, e.y - 40); this.cameras.main.shake(200, 0.005); Sfx.play('boom');
      if (o.n >= 5) this.objDone(); else this.banner('¡Altar roto!', `${o.n}/5`, 1200);
    } else if (e.k === 'chupadorado') {
      for (let i = 0; i < 40; i++) this.dropSoul(e.x + rnd(-80, 80), e.y + rnd(-60, 60), 3);
      this.spawnChest(e.x, e.y); this.objDone();
    } else if (e.k === 'loboalfa') {
      for (let i = 0; i < 30; i++) this.dropSoul(e.x + rnd(-80, 80), e.y + rnd(-60, 60), 3);
      this.cameras.main.shake(300, 0.008); Sfx.play('boom'); this.banner('¡Venciste al Lobo alfa!', '', 1400);
    }
  }
  objText() {
    const o = this.obj, O = OBJECTIVES[o.id];
    if (o.done) return `✅ ${O.name}`;
    if (o.failed) return `❌ ${O.name}`;
    if (o.id === 'altares') return `${O.icon} Altares ${o.n}/5`;
    if (o.id === 'carreta') { const c = o.cart; const d0 = Math.hypot(c.tx, c.ty - 160), d = Math.hypot(c.tx - c.x, c.ty - c.y); return `${O.icon} Carreta ${Math.round(100 * (1 - d / d0))}%`; }
    if (o.id === 'ofrenda') return `${O.icon} Ofrenda ${Math.max(0, Math.round(o.ofr.hp / o.ofr.max * 100))}% · hasta ${fmt(Math.min(OBJ_DEADLINE, this.bossTime('llorona')))}`;
    if (o.id === 'dorado') return `${O.icon} Dorado · escapes ${o.esc}/3`;
    return `${O.icon} ${O.name}`;
  }
  objTargets() { // para las flechas del borde
    const o = this.obj, out = [];
    if (o.done || o.failed) return out;
    if (o.id === 'altares') for (const e of this.E) if (e.alive && e.k === 'altar') out.push({ x: e.x, y: e.y, col: 0xb050ff });
    if (o.id === 'carreta') { out.push({ x: o.cart.x, y: o.cart.y, col: 0xffcf5a }); out.push({ x: o.cart.tx, y: o.cart.ty, col: 0x7dff8a }); }
    if (o.id === 'ofrenda') out.push({ x: o.ofr.x, y: o.ofr.y, col: 0x7dff8a });
    if (o.id === 'dorado') for (const e of this.E) if (e.alive && e.k === 'chupadorado') out.push({ x: e.x, y: e.y, col: 0xffd84a });
    return out;
  }

  // ---------- Fase 2: eventos al azar ----------
  updateEvents(dt) {
    this.evT -= dt;
    if (this.soulRainT > 0) {
      this.soulRainT -= dt; this.soulAcc = (this.soulAcc || 0) + dt;
      while (this.soulAcc > 0.06) { this.soulAcc -= 0.06; const a = rnd(0, 6.28), d = rnd(60, 380); this.dropSoul(this.P.x + Math.cos(a) * d, this.P.y + Math.sin(a) * d * 0.8, Math.random() < 0.2 ? 3 : 1); }
    }
    if (this.evT > 0 || this.bossAlive) return;
    this.evT = rnd(EVENTS.every[0], EVENTS.every[1]);
    const opts = EVENTS.list.filter(k => k !== this.lastEv && !(k === 'luna' && this.t < 140));
    const k = this.__force || pick(opts); this.__force = null; this.lastEv = k;
    if (k === 'luna') { this.moonT = 30; this.banner('¡Luna llena!', 'Los nahuales salen al triple', 1800); this.cameras.main.flash(300, 120, 140, 255); }
    else if (k === 'parvada') { this.banner('¡Parvada de lechuzas!', 'Vienen de todos lados', 1600); for (let i = 0; i < 3; i++) this.time.delayedCall(i * 900, () => this.spawnFlock()); }
    else if (k === 'cofre') { const a = rnd(0, 6.28), d = rnd(300, 400); this.spawnChest(this.P.x + Math.cos(a) * d, this.P.y + Math.sin(a) * d * 0.8, true); this.banner('¡Cofre maldito!', 'Gran premio… pero algo lo cuida', 1800); }
    else if (k === 'almas') { this.soulRainT = 10; this.banner('¡Lluvia de almas!', '¡Junta todas las que puedas!', 1600); Sfx.play('lvl'); }
  }
  spawnMini() {
    const [x, y] = this.edgePoint(-40);
    const e = this.spawn('loboalfa', x, y); e.hp = e.max = 1500 * (1 + this.t / 200);
    Sfx.play('boss'); this.cameras.main.shake(300, 0.006);
    this.banner('¡El Lobo alfa!', 'El cofre maldito lo despertó', 1800);
  }

  // ---------- Evoluciones ----------
  evoReady() { return this.W.find(w => !w.evo && w.lv >= 8 && EVOS[w.id] && this.pl(EVOS[w.id].pas) > 0); }
  evolve(w) {
    w.evo = true; const E = EVOS[w.id], P = this.P;
    if (w.id === 'copal') this.aura.setTint(0x7dffb0);
    P.inv = Math.max(P.inv, 1.2);
    this.ring(P.x, P.y - 30, 320, 0xffcf5a, 700, true); this.ring(P.x, P.y - 30, 200, 0xffffff, 500, false);
    this.cameras.main.flash(260, 255, 220, 140); this.cameras.main.shake(300, 0.006);
    this.near(P.x, P.y - 30, 320, (e) => { const a = Math.atan2(e.y - P.y, e.x - P.x); this.hurt(e, 60, Math.cos(a) * 500, Math.sin(a) * 500, { quiet: true }); });
    Sfx.play('win'); this.banner(`¡EVOLUCIÓN! ${E.name}`, E.desc, 2800);
    this.hud.slots();
    if (this.counts) { save.evos = save.evos || []; if (!save.evos.includes(w.id)) { save.evos.push(w.id); persist(); } }
  }

  // ---------- Armas ----------
  addWeapon(id) { this.W.push({ id, lv: 1, t: 0.3, evo: false }); if (id === 'copal') this.aura.setVisible(true); }
  wl(id) { const w = this.W.find(w => w.id === id); return w ? w.lv : 0; }

  updateWeapons(dt) {
    for (const w of this.W) {
      if (w.id === 'copal') { this.copal(w, dt); continue; }
      if (w.evo && w.id === 'agua') { // Diluvio: charcos que te siguen
        w.t2 = (w.t2 || 0) - dt;
        if (w.t2 <= 0) { w.t2 = 0.7; this.makePuddle(this.P.x + rnd(-20, 20), this.P.y + rnd(-10, 10), 70 * this.areaMul, 2.2, 7 * (this.gear.agua ? this.gear.agua.dmg : 1)); }
      }
      w.t -= dt;
      if (w.t <= 0) { w.t = this.fire(w) * this.cdMul * (this.gear[w.id] ? this.gear[w.id].cd : 1); }
    }
  }

  attackPose() { this.P.atkT = 0.2; }

  fire(w) {
    const P = this.P, L = w.lv, A = this.areaMul, n = this.amount, gm = this.gear[w.id] ? this.gear[w.id].dmg : 1;
    switch (w.id) {
      case 'machete': {
        const ev = w.evo;
        const dmg = 20 * gm * (1 + 0.25 * (L >= 2) + 0.25 * (L >= 5) + 0.3 * (L >= 8)) * (ev ? 1.3 : 1);
        const R = 118 * (1 + 0.15 * (L >= 4) + 0.15 * (L >= 7)) * A * (ev ? 1.2 : 1);
        this.slash(P.face, R, dmg, ev);
        if (L >= 3) this.time.delayedCall(130, () => this.slash(P.face + Math.PI, R, dmg, ev));
        this.attackPose(); Sfx.play('swing');
        return 1.0 * (L >= 6 ? 0.85 : 1);
      }
      case 'punos': {
        const dmg = 9 * gm * (1 + 0.25 * (L >= 2) + 0.25 * (L >= 5) + 0.35 * (L >= 8));
        const tg = this.nearestN(P.x, P.y, 140 * A, 1 + (L >= 4) + (L >= 7));
        if (!tg.length) return 0.15;
        for (const e of tg) {
          const a = Math.atan2(e.y - P.y, e.x - P.x);
          this.hurt(e, dmg, Math.cos(a) * 140, Math.sin(a) * 140);
          if (w.evo && ++this.punHits % 10 === 0) { // Furia de la arena: onda de choque
            const R = 170 * A;
            this.near(P.x, P.y - 20, R, (o) => { const b = Math.atan2(o.y - P.y, o.x - P.x); this.hurt(o, dmg * 4, Math.cos(b) * 380, Math.sin(b) * 380, { big: true, stun: 0.4 }); });
            this.ring(P.x, P.y - 20, R, 0xffa030, 380, true); this.cameras.main.shake(120, 0.004); Sfx.play('boom');
          }
          this.fxSpark.setParticleTint(0xffd25a); this.fxDeath.setParticleTint(0xffd25a); this.fxDeath.explode(5, e.x, e.y - e.d.size * 0.5);
          this.ring(e.x, e.y - e.d.size * 0.5, 34, 0xffd25a, 140);
        }
        P.dx = Math.sign(tg[0].x - P.x) || P.dx;
        this.attackPose(); Sfx.play('swing');
        return 0.5 * (L >= 3 ? 0.85 : 1) * (L >= 6 ? 0.85 : 1);
      }
      case 'cohetes': {
        const dmg = 19 * gm * (1 + 0.2 * (L >= 2) + 0.25 * (L >= 5) + 0.35 * (L >= 8));
        const blast = 60 * (1 + 0.2 * (L >= 4) + 0.2 * (L >= 7)) * A;
        const cnt = 1 + (L >= 3) + (L >= 6) + n;
        const tg = this.nearestN(P.x, P.y, 520, 8);
        for (let i = 0; i < cnt; i++) {
          const e = tg.length ? pick(tg) : null;
          const a = e ? Math.atan2(e.y - P.y, e.x - P.x) + rnd(-0.15, 0.15) : rnd(0, 6.28);
          const dist = e ? Math.hypot(e.x - P.x, e.y - P.y) : 260;
          const rk = this.tex('obj_cohete', 'rocket'); const s = this.add.image(P.x, P.y - 40, rk).setDepth(900000).setRotation(a); if (rk === 'obj_cohete') s.setScale(48 / s.width);
          this.B.push({ kind: 'rocket', x: P.x, y: P.y - 40, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, life: Math.min(1.4, dist / 360 + 0.1), dmg, blast, r: 12, s, evo: w.evo });
        }
        this.attackPose(); Sfx.play('swing');
        return 1.7;
      }
      case 'resortera': {
        const dmg = 11 * gm * (1 + 0.25 * (L >= 2) + 0.25 * (L >= 6) + 0.35 * (L >= 8));
        const cnt = 1 + (L >= 5) + n;
        const tg = this.nearestN(P.x, P.y, 480, cnt);
        if (!tg.length) return 0.3;
        if (w.evo) this.hail(dmg * 0.9, 5 + n);
        tg.forEach((e, i) => this.time.delayedCall(i * 70, () => {
          const a = Math.atan2(e.y - e.d.size * 0.4 - (P.y - 40), e.x - P.x);
          const sk = this.tex('obj_piedra', 'stone'); const s = this.add.image(P.x, P.y - 40, sk).setDepth(900000).setRotation(a); if (sk === 'obj_piedra') s.setScale(30 / s.width);
          this.B.push({ kind: 'stone', x: P.x, y: P.y - 40, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, life: 1, dmg, r: 10, bounces: 2 + (L >= 3) + (L >= 7), hit: new Set(), s });
        }));
        return 1.05 * (L >= 4 ? 0.8 : 1);
      }
      case 'agua': {
        const dmg = 6 * gm * (1 + 0.2 * (L >= 2) + 0.25 * (L >= 6) + 0.35 * (L >= 8));
        const R = 54 * (L >= 3 ? 1.3 : 1) * A, dur = L >= 5 ? 3.6 : 2.6;
        const cnt = 1 + (L >= 4) + (L >= 7) + n;
        const tg = this.nearestN(P.x, P.y, 340, 10);
        for (let i = 0; i < cnt; i++) {
          const e = tg.length ? pick(tg) : null;
          const tx = e ? e.x : P.x + rnd(-200, 200), ty = e ? e.y : P.y + rnd(-200, 200);
          const fk = this.tex('obj_frasco', 'flask'); const s = this.add.image(P.x, P.y - 40, fk).setDepth(900000); if (fk === 'obj_frasco') s.setScale(30 / s.height);
          const o = { k: 0 };
          this.tweens.add({ targets: o, k: 1, duration: 450, onUpdate: () => { s.x = P.x + (tx - P.x) * o.k; s.y = (P.y - 40) + (ty - (P.y - 40)) * o.k - Math.sin(o.k * Math.PI) * 90; s.rotation = o.k * 8; },
            onComplete: () => { s.destroy(); this.makePuddle(tx, ty, R, dur, dmg); } });
        }
        return 3.2;
      }
      case 'loteria': {
        const dmg = 10 * gm * (1 + 0.2 * (L >= 2) + 0.25 * (L >= 5) + 0.35 * (L >= 8));
        const cnt = 3 + (L >= 3) + (L >= 6) + n, sp = L >= 7 ? 540 : 430;
        for (let i = 0; i < cnt; i++) {
          const a = P.face + (i - (cnt - 1) / 2) * 0.24;
          const ckey = this.tex('obj_carta' + (i % 5 + 1), 'card' + (i % 5)); const s = this.add.image(P.x, P.y - 40, ckey).setDepth(900000); s.setScale(ckey.startsWith('obj_') ? 36 / s.height : 1.2);
          const fx = w.evo ? i % 5 : -1; // Gran Lotería: 0 fuego, 1 hielo, 2 corazón, 3 estrella, 4 calavera
          if (fx >= 0) s.setTint([0xff7a3a, 0x7fd8ff, 0xff6a8a, 0xffe060, 0xb07aff][fx]);
          this.B.push({ kind: 'card', x: P.x, y: P.y - 40, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.95, dmg: dmg * (fx === 0 ? 1.6 : 1), r: 14, pierce: 2 + (L >= 4) + (fx === 3 ? 3 : 0), hit: new Set(), s, fx });
        }
        this.attackPose(); Sfx.play('swing');
        return 1.45;
      }
      case 'lazo': {
        const ev = w.evo;
        const dmg = 14 * gm * (1 + 0.25 * (L >= 2) + 0.25 * (L >= 5) + 0.35 * (L >= 8)) * (ev ? 1.25 : 1);
        const len = 270 * (L >= 3 ? 1.2 : 1) * A * (ev ? 1.2 : 1), stun = L >= 4 ? 1.0 : 0.6;
        const t0 = this.nearest(P.x, P.y, len);
        const a = t0 ? Math.atan2(t0.y - t0.d.size * 0.3 - (P.y - 30), t0.x - P.x) : P.face;
        this.lasso(a, len, dmg, stun, ev);
        if (L >= 7) this.time.delayedCall(170, () => this.lasso(a + Math.PI, len, dmg, stun, ev));
        this.attackPose(); Sfx.play('swing');
        return 1.6 * (L >= 6 ? 0.85 : 1);
      }
    }
    return 1;
  }

  // Lazo: reata en línea recta; a la fila que toca la jala hacia ti y la aturde (el Lazo de fuego además quema)
  lasso(a, len, dmg, stun, fire) {
    const P = this.P, cx = P.x, cy = P.y - 30, ca = Math.cos(a), sa = Math.sin(a);
    const g = this.add.graphics().setDepth(950000), o = { k: 0 };
    let done = false;
    const draw = () => {
      const ext = o.k < 0.45 ? o.k / 0.45 : 1 - (o.k - 0.45) / 0.55, L = len * ext;
      const tx = cx + ca * L, ty = cy + sa * L;
      g.clear();
      g.lineStyle(fire ? 12 : 10, fire ? 0xc83a0a : 0x3a1e08, 1).lineBetween(cx, cy, tx, ty);
      g.lineStyle(fire ? 6 : 5, fire ? 0xffb030 : 0xd9a85a, 1).lineBetween(cx, cy, tx, ty);
      g.lineStyle(9, fire ? 0xc83a0a : 0x3a1e08, 1).strokeEllipse(tx, ty, 50, 34);
      g.lineStyle(4, fire ? 0xffe070 : 0xe8bc6a, 1).strokeEllipse(tx, ty, 50, 34);
      if (fire && Math.random() < 0.8) this.fxSpark.emitParticleAt(cx + ca * L * Math.random(), cy + sa * L * Math.random(), 1);
      if (!done && o.k >= 0.45) {
        done = true;
        this.near(cx + ca * len / 2, cy + sa * len / 2, len / 2 + 40, (e) => {
          const ex = e.x - cx, ey = e.y - e.d.size * 0.3 - cy, along = ex * ca + ey * sa, across = Math.abs(-ex * sa + ey * ca);
          if (along < -10 || along > len + 10 || across > 34 + e.r) return;
          this.hurt(e, dmg, -ca * 260, -sa * 260, { stun, dot: fire ? 0.35 : 0 });
        });
      }
    };
    draw();
    this.tweens.add({ targets: o, k: 1, duration: 300, onUpdate: draw, onComplete: () => g.destroy() });
  }

  // Granizada: lluvia de piedras sobre enemigos cercanos
  hail(dmg, cnt) {
    const tg = this.nearestN(this.P.x, this.P.y, 400, 14);
    for (let i = 0; i < cnt; i++) {
      const e = tg.length ? pick(tg) : null;
      const x = e ? e.x + rnd(-25, 25) : this.P.x + rnd(-260, 260), y = e ? e.y + rnd(-20, 20) : this.P.y + rnd(-200, 200);
      this.time.delayedCall(i * 90, () => {
        const sk = this.tex('obj_piedra', 'stone'); const s = this.add.image(x, y - 320, sk).setDepth(900000).setTint(0xbfe8ff); if (sk === 'obj_piedra') s.setScale(26 / s.width);
        this.tweens.add({ targets: s, y, duration: 260, ease: 'Quad.In', onComplete: () => {
          s.destroy(); this.near(x, y, 52 * this.areaMul, (o) => this.hurt(o, dmg, 0, 0, { stun: 0.25 }));
          this.ring(x, y, 52 * this.areaMul, 0xbfe8ff, 220, true);
        } });
      });
    }
  }

  slash(a, R, dmg, obsidiana) {
    const P = this.P, cx = P.x, cy = P.y - 30;
    this.near(cx, cy, R, (e) => {
      const ea = Math.atan2(e.y - e.d.size * 0.3 - cy, e.x - cx);
      if (angDiff(ea, a) < 1.15 || Math.hypot(e.x - cx, e.y - cy) < 40) this.hurt(e, dmg, Math.cos(ea) * 170, Math.sin(ea) * 170, obsidiana ? { dot: 0.15 } : {});
    });
    const c1 = obsidiana ? 0xff2a5a : 0xff9d1f, c2 = obsidiana ? 0xd0a0ff : 0xfff2a0;
    const g = this.add.graphics().setDepth(950000).setBlendMode(Phaser.BlendModes.ADD);
    const draw = (k) => {
      g.clear();
      const a0 = a - 1.15, a1 = a + 1.15, ri = R * 0.62, ro = R * (0.92 + 0.12 * k);
      g.fillStyle(c1, 0.55 * (1 - k)); g.beginPath();
      for (let i = 0; i <= 16; i++) { const t = a0 + (a1 - a0) * i / 16; g.lineTo(cx + Math.cos(t) * ro, cy + Math.sin(t) * ro); }
      for (let i = 16; i >= 0; i--) { const t = a0 + (a1 - a0) * i / 16; const rr = ro - (ro - ri) * Math.sin(i / 16 * Math.PI); g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr); }
      g.closePath(); g.fillPath();
      g.lineStyle(4, c2, 0.9 * (1 - k)); g.beginPath(); g.arc(cx, cy, ro, a0, a1); g.strokePath();
    };
    const o = { k: 0 }; draw(0);
    this.tweens.add({ targets: o, k: 1, duration: 190, onUpdate: () => draw(o.k), onComplete: () => g.destroy() });
  }

  copal(w, dt) {
    const L = w.lv, P = this.P, ev = w.evo;
    const R = 80 * (1 + 0.15 * (L >= 2) + 0.15 * (L >= 4) + 0.15 * (L >= 7)) * this.areaMul * (ev ? 1.6 : 1);
    const dmg = 5 * (this.gear.copal ? this.gear.copal.dmg : 1) * (1 + 0.3 * (L >= 3) + 0.3 * (L >= 6) + 0.4 * (L >= 8)) * (ev ? 1.4 : 1);
    this.aura.setDisplaySize(R * 2.3, R * 2.3 * 0.75).setAlpha(0.75 + 0.2 * Math.sin(this.t * 4));
    this.aura.rotation += dt * 0.6;
    if (Math.random() < dt * 14) this.fxSmoke.emitParticleAt(P.x + rnd(-R, R) * 0.8, P.y - 10 + rnd(-R, R) * 0.5, 1);
    w.t -= dt;
    if (w.t <= 0) {
      w.t = 0.5 * this.cdMul * (this.gear.copal ? this.gear.copal.cd : 1);
      this.near(P.x, P.y - 10, R, (e) => this.hurt(e, dmg, 0, 0, { slow: 0.6, quiet: true }));
      if (L >= 5) this.near(P.x, P.y - 10, R, (e) => { e.slowT = Math.max(e.slowT, ev ? 1.4 : 0.9); });
    }
  }

  makePuddle(x, y, R, dur, dmg) {
    const img = this.add.image(x, y, 'puddle').setDisplaySize(R * 2.2, R * 1.3).setDepth(-50000).setAlpha(0.9);
    this.puddles.push({ x, y, R, t: dur, tick: 0, dmg, img });
    this.fxDeath.setParticleTint(0x7ff7ea); this.fxDeath.explode(8, x, y);
  }
  updatePuddles(dt) {
    for (const p of this.puddles) {
      p.t -= dt; p.tick -= dt;
      if (p.tick <= 0) { p.tick = 0.4 * this.cdMul; this.near(p.x, p.y, p.R, (e) => this.hurt(e, p.dmg, 0, 0, { slow: 0.5, quiet: true })); }
      if (p.t < 0.5) p.img.setAlpha(p.t / 0.5 * 0.9);
      if (p.t <= 0) { p.img.destroy(); p.dead = true; }
    }
    if (this.puddles.some(p => p.dead)) this.puddles = this.puddles.filter(p => !p.dead);
  }

  explode(x, y, R, dmg) {
    this.near(x, y, R, (e) => { const a = Math.atan2(e.y - y, e.x - x); this.hurt(e, dmg, Math.cos(a) * 200, Math.sin(a) * 200); });
    this.fxSpark.explode(18, x, y);
    this.ring(x, y, R, pick([0xff5a8a, 0xffd25a, 0x5ad0ff, 0x7dff8a]), 260, true);
    Sfx.play('boom');
  }

  // Castillo de fuegos: cada explosión suelta 3 más pequeñas alrededor
  chain(x, y, R, dmg) {
    for (let i = 0; i < 3; i++) {
      const a = rnd(0, 6.28) , d = R * rnd(0.9, 1.4);
      this.time.delayedCall(140 + i * 110, () => this.explode(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, R * 0.65, dmg * 0.5));
    }
  }

  ring(x, y, R, col, ms, fill) {
    const g = this.add.graphics().setDepth(950000).setBlendMode(Phaser.BlendModes.ADD), o = { k: 0 };
    const draw = () => { g.clear(); if (fill) { g.fillStyle(col, 0.35 * (1 - o.k)); g.fillCircle(x, y, R * (0.4 + 0.6 * o.k)); } g.lineStyle(5, col, 0.9 * (1 - o.k)); g.strokeCircle(x, y, R * (0.4 + 0.6 * o.k)); };
    draw(); this.tweens.add({ targets: o, k: 1, duration: ms, onUpdate: draw, onComplete: () => g.destroy() });
  }

  updateProjectiles(dt) {
    const P = this.P;
    for (const b of this.B) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.kind === 'lasso') {
        const o = b.owner; b.g.clear();
        b.g.lineStyle(5, 0xc050ff, 0.85).lineBetween(o.x, o.y - 70, b.x, b.y);
        b.g.lineStyle(4, 0xe8a0ff, 0.9).strokeCircle(b.x, b.y, 18);
        if (Math.hypot(P.x - b.x, P.y - 30 - b.y) < 34 && P.inv <= 0 && P.jump <= 0) {
          b.dead = true; this.hurtPlayer(10, true);
          const a = Math.atan2(o.y - P.y, o.x - P.x); P.pushVx = Math.cos(a) * 520; P.pushVy = Math.sin(a) * 520; P.pushT = 0.4;
          this.dmgText(P.x, P.y - 100, '¡Te lazó!', '#e8a0ff');
        }
        if (b.life <= 0 || !o.alive) b.dead = true;
        if (b.dead) b.g.destroy();
        continue;
      }
      b.s.setPosition(b.x, b.y);
      if (b.kind === 'card') b.s.rotation += dt * 14;
      if (b.kind === 'stone') b.s.rotation = Math.atan2(b.vy, b.vx);
      if (b.kind === 'rocket') { b.s.rotation = Math.atan2(b.vy, b.vx); if (Math.random() < 0.7) { this.fxSpark.emitParticleAt(b.x - b.vx * 0.03, b.y - b.vy * 0.03, 1); } }
      let hitOne = null;
      this.near(b.x, b.y + 30, b.r, (e) => { if (!hitOne && !e.ghost && !(b.hit && b.hit.has(e))) hitOne = e; });
      if (hitOne) {
        const e = hitOne;
        if (b.kind === 'rocket') { b.dead = true; this.explode(b.x, b.y + 30, b.blast, b.dmg); if (b.evo) this.chain(b.x, b.y + 30, b.blast, b.dmg); }
        else if (b.kind === 'stone') {
          this.hurt(e, b.dmg, b.vx * 0.25, b.vy * 0.25); b.hit.add(e);
          if (b.bounces-- > 0) { const n = this.nearest(e.x, e.y, 280, b.hit); if (n) { const a = Math.atan2(n.y - e.y, n.x - e.x); b.vx = Math.cos(a) * 560; b.vy = Math.sin(a) * 560; b.life = 0.8; } else b.dead = true; }
          else b.dead = true;
        } else if (b.kind === 'card') {
          this.hurt(e, b.dmg, b.vx * 0.2, b.vy * 0.2, b.fx === 1 ? { stun: 0.8 } : {}); b.hit.add(e);
          if (b.fx === 2) this.heal(1);
          if (b.fx === 4) { this.near(e.x, e.y, 60 * this.areaMul, (o) => { if (o !== e) this.hurt(o, b.dmg * 0.6, 0, 0, { quiet: true }); }); this.ring(e.x, e.y - 20, 60 * this.areaMul, 0xb07aff, 220, true); }
          if (b.pierce-- <= 0) b.dead = true;
        }
      }
      if (b.life <= 0 && !b.dead) { b.dead = true; if (b.kind === 'rocket') { this.explode(b.x, b.y + 30, b.blast, b.dmg); if (b.evo) this.chain(b.x, b.y + 30, b.blast, b.dmg); } }
      if (b.dead) b.s.destroy();
    }
    if (this.B.some(b => b.dead)) this.B = this.B.filter(b => !b.dead);
  }

  // ---------- Habilidad del cazador ----------
  ability() {
    if (this.over || this.energy < this.energyNeed || this.scene.isPaused()) return;
    this.energy = 0; Sfx.play('ability');
    const P = this.P, A = this.areaMul;
    this.attackPose();
    switch (this.hunterId) {
      case 'machetero': {
        const R = 180 * A;
        this.tweens.add({ targets: this.pSpr, angle: 360, duration: 380, onComplete: () => this.pSpr.setAngle(0) });
        for (let i = 0; i < 4; i++) this.time.delayedCall(i * 80, () => this.slash(P.face + i * Math.PI / 2, R, 0));
        P.inv = Math.max(P.inv, 0.6);
        this.near(P.x, P.y - 20, R, (e) => { const a = Math.atan2(e.y - P.y, e.x - P.x); this.hurt(e, 95, Math.cos(a) * 420, Math.sin(a) * 420, { big: true, stun: 0.5 }); });
        this.ring(P.x, P.y - 20, R, 0xff9d1f, 380, true);
        this.banner('¡Remolino!', '', 700);
        break;
      }
      case 'curandera': {
        this.heal(this.maxHp * 0.25);
        this.near(P.x, P.y, 250 * A, (e) => { const a = Math.atan2(e.y - P.y, e.x - P.x); this.hurt(e, 20, Math.cos(a) * 520, Math.sin(a) * 520, { slow: 2 }); });
        this.ring(P.x, P.y - 20, 250 * A, 0x3fe0d0, 500, true);
        this.fxSmoke.explode(40, P.x, P.y - 20);
        this.dmgText(P.x, P.y - 110, '+25% vida', '#7dff8a');
        this.banner('¡Limpia!', '', 700);
        break;
      }
      case 'luchadora': {
        P.inv = 0.7;
        this.tweens.add({ targets: P, jump: 120, duration: 260, yoyo: true, ease: 'Quad.Out', onComplete: () => {
          P.jump = 0;
          const R = 200 * A;
          this.near(P.x, P.y, R, (e) => { const a = Math.atan2(e.y - P.y, e.x - P.x); this.hurt(e, 95, Math.cos(a) * 260, Math.sin(a) * 260, { stun: 1.3, big: true }); });
          this.ring(P.x, P.y, R, 0xffd25a, 420, true); this.cameras.main.shake(300, 0.012); Sfx.play('boom');
          this.banner('¡Plancha!', '', 700);
        } });
        break;
      }
      case 'cohetero': {
        for (let i = 0; i < 16; i++) this.time.delayedCall(i * 75, () => {
          const a = rnd(0, 6.28), d = rnd(60, 330), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
          this.explode(x, y, 72 * A, 48);
        });
        this.banner('¡Castillo!', '', 700);
        break;
      }
    }
  }

  // ---------- Mundo: adornos por zonas ----------
  updateWorld() {
    const v = this.cameras.main.worldView;
    this.groundTS.setPosition(v.x - 2, v.y - 2).setSize(v.width + 4, v.height + 4);
    this.groundTS.setTilePosition((v.x - 2) / this.groundScale, (v.y - 2) / this.groundScale);
    const CH = 420, x0 = Math.floor((v.x - 100) / CH), x1 = Math.floor((v.right + 100) / CH), y0 = Math.floor((v.y - 100) / CH), y1 = Math.floor((v.bottom + 140) / CH);
    const keep = new Set();
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const key = cx + ',' + cy; keep.add(key);
      if (this.chunks.has(key)) continue;
      const r = seeded((cx * 73856093) ^ (cy * 19349663)), items = [];
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        if (Math.abs(cx) + Math.abs(cy) === 0 && i === 0) continue;
        const P = this.propList(), tot = P.reduce((a, q) => a + q.w, 0);
        let rr = r() * tot, q = P[0]; for (const o of P) { rr -= o.w; if (rr <= 0) { q = o; break; } }
        const x = cx * CH + r() * CH, y = cy * CH + r() * CH;
        const im = (this.propPool.pop() || this.add.image(0, 0, q.k)).setTexture(q.k).setVisible(true).setOrigin(0.5, 0.95).setPosition(x, y).setDepth(y).setFlipX(q.flip !== false && r() < 0.5);
        im.setScale(q.h / im.height * (0.9 + r() * 0.2));
        items.push(im);
        if (q.glow) { const gl = (this.propPool.pop() || this.add.image(0, 0, 'glow')).setTexture('glow').setVisible(true).setOrigin(0.5).setPosition(x, y + q.glow[0]).setDepth(-85000).setScale(q.glow[1]).setFlipX(false); gl.setBlendMode(Phaser.BlendModes.ADD).setTint(0xffa030).setAlpha(0.5); items.push(gl); }
      }
      this.chunks.set(key, items);
    }
    for (const [key, items] of this.chunks) if (!keep.has(key)) { for (const im of items) { im.setVisible(false).setBlendMode(Phaser.BlendModes.NORMAL).clearTint().setAlpha(1); this.propPool.push(im); } this.chunks.delete(key); }
  }

  propList() {
    if (this._props) return this._props;
    const L = [
      { k: 'prop_tumba1', h: 92, w: 3 }, { k: 'prop_tumba2', h: 92, w: 2, glow: [-20, 1.2] }, { k: 'prop_cruz', h: 88, w: 2 },
      { k: 'prop_velas', h: 58, w: 2, glow: [-40, 1.8] }, { k: 'prop_ofrenda', h: 88, w: 1, glow: [-60, 1.8] }, { k: 'prop_cempasuchil', h: 50, w: 3 },
      { k: 'prop_nopal', h: 86, w: 2 }, { k: 'prop_maguey', h: 70, w: 2 }, { k: 'prop_arbol', h: 200, w: 1 },
      { k: 'prop_farol', h: 180, w: 1, glow: [-150, 2.2], flip: false }, { k: 'prop_carreta', h: 95, w: 1 }, { k: 'prop_ollas', h: 58, w: 2 },
      { k: 'prop_craneo', h: 30, w: 2 }, { k: 'prop_rocas', h: 52, w: 3 },
    ].filter(q => this.textures.exists(q.k));
    this._props = L.length ? L : [{ k: 'tumba', h: 80, w: 2 }, { k: 'velas', h: 56, w: 1, glow: [-30, 1.6] }, { k: 'cempa', h: 44, w: 2 }, { k: 'craneo', h: 28, w: 1 }];
    return this._props;
  }

  drawShadows() {
    const g = this.shadows; g.clear(); g.fillStyle(0x0a0414, 0.45);
    const v = this.cameras.main.worldView;
    for (const e of this.E) {
      if (e.x < v.x - 80 || e.x > v.right + 80 || e.y < v.y - 40 || e.y > v.bottom + 120) continue;
      const w = e.d.size * (e.d.flyer ? 0.45 : 0.6);
      g.fillEllipse(e.x, e.y - 2, w, w * 0.3);
    }
    g.fillEllipse(this.P.x, this.P.y - 2, 50 * (1 - this.P.jump / 240), 15);
  }

  // ---------- Textos ----------
  dmgNum(x, y, v, big) {
    if (this.numPool.length === 0 && (this.numCount || 0) > 30) return;
    this.dmgText(x + rnd(-10, 10), y, String(Math.round(v)), big ? '#ffcf5a' : '#ffffff', big ? 26 : 17);
  }
  dmgText(x, y, str, col = '#fff', size = 22) {
    let t = this.numPool.pop();
    if (!t) { t = this.add.text(0, 0, '', { fontFamily: '"Lilita One", system-ui', fontSize: '20px', color: '#fff', stroke: '#1a0b2b', strokeThickness: 5 }).setOrigin(0.5); this.numCount = (this.numCount || 0) + 1; }
    t.setText(str).setColor(col).setFontSize(size).setPosition(x, y).setAlpha(1).setVisible(true).setDepth(1e6).setScale(1);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 600, ease: 'Quad.Out', onComplete: () => { t.setVisible(false); this.numPool.push(t); } });
  }
  banner(title, sub, ms) { this.hud.banner(title, sub, ms); }

  // ---------- Cartas ----------
  levelUpAuto() { const opts = this.cardOptions(); if (opts.length) this.applyCard(opts[0]); this.level++; }

  cardOptions() {
    const opts = [];
    for (const w of this.W) if (w.lv < 8) opts.push({ type: 'w', id: w.id, lv: w.lv + 1, weight: 3 });
    if (this.W.length < (this.cursed('mochila') ? 3 : 6)) for (const id in WEAPONS) if (!this.wl(id)) opts.push({ type: 'w', id, lv: 1, weight: 1.6 });
    const pc = Object.keys(this.Pass).length;
    for (const id in PASSIVES) { const l = this.pl(id); if (l > 0 && l < 5) opts.push({ type: 'p', id, lv: l + 1, weight: 1.6 }); else if (l === 0 && pc < 6) opts.push({ type: 'p', id, lv: 1, weight: 1 }); }
    const out = [];
    const n = 3 + tl('for_cuatro');
    while (out.length < n && opts.length) {
      let tot = opts.reduce((s, o) => s + o.weight, 0), r = Math.random() * tot, i = 0;
      for (; i < opts.length; i++) { r -= opts[i].weight; if (r <= 0) break; }
      out.push(opts.splice(Math.min(i, opts.length - 1), 1)[0]);
    }
    if (out.length < n) out.push({ type: 'pan', id: 'pan', lv: 0 });
    return out;
  }
  applyCard(o) {
    if (o.type === 'w') {
      const w = this.W.find(w => w.id === o.id);
      if (w) w.lv++;
      else if (this.W.length >= (this.cursed('mochila') ? 3 : 6)) { const m = this.W.filter(w => w.lv < 8).sort((a, b) => a.lv - b.lv)[0]; if (m) m.lv++; else this.heal(this.maxHp * 0.3); }
      else this.addWeapon(o.id);
    }
    else if (o.type === 'p') { this.Pass[o.id] = (this.Pass[o.id] || 0) + 1; if (o.id === 'maguey') this.P.hp += 20; }
    else this.heal(this.maxHp * 0.3);
    this.hud.slots();
  }

  // ---------- Partida a medias: se guarda sola y se recupera al volver ----------
  get counts() { return (!GOD && START_T === 0 && !AUTO) || DEV; }
  saveRun() {
    if (this.over || !this.counts) return;
    const P = this.P, r1 = (v) => Math.round(v * 10) / 10;
    const run = {
      v: 1, at: Date.now(), hunter: this.hunterId, t: r1(this.t), kills: this.kills, level: this.level, xp: r1(this.xp), xpNeed: this.xpNeed, pendingLv: this.pendingLv,
      energy: this.energy, W: this.W.map(w => [w.id, w.lv, w.evo ? 1 : 0]), Pass: this.Pass, mapChests: this.mapChests, chestFlores: this.chestFlores, punHits: this.punHits, killsAt10: this.killsAt10,
      obj: this.obj.id, curses: [...this.curses], evT: r1(this.evT), lastEv: this.lastEv, moonT: r1(this.moonT || 0),
      objSt: { done: this.obj.done, failed: this.obj.failed, n: this.obj.n, esc: this.obj.esc, di: this.obj.di, cart: this.obj.cart ? { ...this.obj.cart, x: this.obj.cart.x - P.x, y: this.obj.cart.y - P.y, tx: this.obj.cart.tx - P.x, ty: this.obj.cart.ty - P.y } : null, ofr: this.obj.ofr ? { ...this.obj.ofr, x: this.obj.ofr.x - P.x, y: this.obj.ofr.y - P.y } : null }, hp: r1(P.hp), rerolls: this.rerolls, revived: this.revived, gear: this.gear,
      bossDone: this.bossDone, bossKills: this.bossKills, won: this.won, bossN: this.bossN, nextBossT: this.nextBossT === Infinity ? -1 : r1(this.nextBossT),
      helpT: r1(this.helpT), flockT: r1(this.flockT), dmgTaken: Math.round(this.dmgTaken || 0),
      E: this.E.filter(e => e.alive).slice(0, 260).map(e => [e.k, Math.round(e.x - P.x), Math.round(e.y - P.y), Math.round(e.hp), Math.round(e.max), e.boss ? 1 : 0, e.n || 0, e.loop || 0, e.wolf ? 1 : 0, e.stolen || 0, r1(e.dmg), r1(e.spd)]),
      S: this.S.slice(0, 300).map(o => [Math.round(o.x - P.x), Math.round(o.y - P.y), o.v]),
      C: this.chests.map(c => [Math.round(c.x - P.x), Math.round(c.y - P.y), c.cursed ? 1 : 0]),
      H: this.helpers.map(h => [h.k, Math.round(h.x - P.x), Math.round(h.y - P.y)]),
    };
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (e) { /* sin espacio */ }
  }
  restore(r) {
    const P = this.P;
    Object.assign(this, { t: r.t, kills: r.kills, level: r.level, xp: r.xp, xpNeed: r.xpNeed, pendingLv: r.pendingLv, energy: r.energy, rerolls: r.rerolls, revived: r.revived,
      bossDone: r.bossDone || {}, bossKills: r.bossKills || [], won: !!r.won, bossN: r.bossN || 0, nextBossT: r.nextBossT < 0 ? Infinity : r.nextBossT, helpT: r.helpT, flockT: r.flockT, dmgTaken: r.dmgTaken || 0 });
    this.gear = r.gear || {};
    this.W = []; this.aura.setVisible(false);
    for (const [id, lv, evo] of r.W) { if (!WEAPONS[id]) continue; this.addWeapon(id); const w = this.W[this.W.length - 1]; w.lv = lv; w.evo = !!evo; if (w.evo && id === 'copal') this.aura.setTint(0x7dffb0); }
    this.mapChests = r.mapChests || {}; this.chestFlores = r.chestFlores || 0; this.punHits = r.punHits || 0; this.killsAt10 = r.killsAt10 != null ? r.killsAt10 : null;
    if (r.evT != null) { this.evT = r.evT; this.lastEv = r.lastEv || ''; this.moonT = r.moonT || 0; }
    if (r.objSt) { Object.assign(this.obj, { done: r.objSt.done, failed: r.objSt.failed, n: r.objSt.n || 0, esc: r.objSt.esc || 0, di: r.objSt.di || 0, cart: r.objSt.cart, ofr: r.objSt.ofr }); this.buildObjectiveProps(); }
    this.Pass = r.Pass || {};
    P.hp = Math.min(this.maxHp, r.hp);
    for (const a of r.E) {
      const [k, dx, dy, hp, max, boss, n, loop, wolf, stolen, dmg, spd] = a; if (!ENEMIES[k]) continue;
      const e = this.spawn(k, dx, dy);
      Object.assign(e, { hp, max, dmg, spd, stolen });
      if (wolf && k === 'nahual') { e.wolf = true; e.d = ENEMIES.lobo; e.bs = ENEMIES.lobo.size / 205; e.r = ENEMIES.lobo.r; }
      if (boss) { e.boss = true; e.cd = 2.5; e.cd2 = 6; e.cd3 = 9; e.n = n; e.loop = loop; e.bs = e.d.size / 336; e.s.setScale(e.bs); this.bossAlive = e; }
    }
    for (const [dx, dy, v] of r.S) this.dropSoul(dx, dy, v);
    for (const [dx, dy, cu] of r.C || []) this.spawnChest(dx, dy, !!cu);
    for (const [k, dx, dy] of r.H || []) this.spawnHelper(k, dx, dy);
    this.hud.slots();
    // después de dibujar dos cuadros (la cámara ya sabe qué se ve y el suelo queda completo)
    this.events.once('postupdate', () => this.events.once('postupdate', () => { this.updateWorld(); this.hud.countdown('¡Recuperaste tu partida!'); }));
  }

  endRun(win) {
    if (this.over) return;
    this.over = true;
    clearRun();
    this.reward = this.flowerReward(win);
    Sfx.play(win ? 'win' : 'lose');
    this.time.delayedCall(win ? 200 : 700, () => this.hud.end(win));
  }
}

function flowerLines(sc, win) {
  const F = FLOWERS, tA = Math.min(sc.t, F.afterT), tB = Math.max(0, sc.t - F.afterT);
  const kA = sc.killsAt10 != null ? sc.killsAt10 : sc.kills, kB = sc.kills - kA;
  const r = { tiempo: Math.floor((tA + tB * F.afterMul) / F.perSeconds), enemigos: Math.floor((kA + kB * F.afterMul) / F.perKills), jefes: 0, cofres: sc.chestFlores || 0,
    objetivo: sc.obj && sc.obj.done ? OBJECTIVES[sc.obj.id].flores : 0, maldiciones: sc.curses ? sc.curses.size : 0 };
  for (const b of sc.bossKills) r.jefes += F.boss[b.k] || 0;
  return r;
}
Play.prototype.flowerReward = function (win) {
  const r = flowerLines(this, win);
  let base = r.tiempo + r.enemigos + r.jefes + r.cofres;
  r.tope = base > FLOWERS.cap; base = Math.min(base, FLOWERS.cap) + r.objetivo;
  base *= 1 + CURSE_BONUS * r.maldiciones;
  const cosecha = 1 + 0.08 * tl('for_cosecha');
  const first = save.dia !== today();
  const total = Math.round(base * cosecha * (first ? FLOWERS.firstOfDay : 1));
  const counts = (!GOD && START_T === 0 && !AUTO) || DEV;
  if (counts) {
    save.flores += total; save.ganadas += total; save.partidas++; save.mejor = Math.max(save.mejor, Math.floor(this.t));
    if (win) save.victorias++;
    if (first) save.dia = today();
    persist();
  }
  return { ...r, cosecha, first, total, counts };
};

// ---------- Interfaz (HTML encima del juego) ----------
class Hud {
  constructor(sc) { this.sc = sc; this.acc = 0; this.cardsOpen = false; this.bannerT = null; }
  show() {
    $('hud').classList.remove('hidden');
    $('abilityImg').src = IMG[`${this.sc.hunterId}_ataque`];
    $('abilityLbl').textContent = HUNTERS[this.sc.hunterId].ability;
    $('hint').textContent = 'Arrastra para moverte · doble toque para esquivar';
    setTimeout(() => { $('hint').textContent = ''; }, 6000);
    this.slots();
  }
  slots() {
    const sc = this.sc, el = $('slots'); el.innerHTML = '';
    for (const w of sc.W) el.insertAdjacentHTML('beforeend', `<div class="slot${w.evo ? ' evo' : ''}">${wIcon(w)}<b>${w.evo ? '★' : w.lv}</b></div>`);
    for (const id in sc.Pass) el.insertAdjacentHTML('beforeend', `<div class="slot p">${icon(id, PASSIVES[id].icon)}<b>${sc.Pass[id]}</b></div>`);
  }
  tick(dt) {
    this.acc += dt; if (this.acc < 0.1) return; this.acc = 0;
    const sc = this.sc;
    $('xpfill').style.width = (sc.xp / sc.xpNeed * 100).toFixed(1) + '%';
    $('lvl').textContent = 'Nv ' + sc.level;
    $('timer').textContent = fmt(sc.t);
    $('objhud').textContent = sc.objText();
    $('kills').textContent = '💀 ' + sc.kills;
    const f = sc.energy / sc.energyNeed;
    $('abilityFill').style.height = (f * 100) + '%';
    $('abilityBtn').classList.toggle('ready', f >= 1);
    $('dashBtn').classList.toggle('cd', sc.P.dashCd > 0);
    const b = sc.bossAlive;
    $('boss').classList.toggle('hidden', !b);
    if (b) { $('bossName').textContent = sc.bossLabel(b); $('bossFill').style.width = Math.max(0, b.hp / b.max * 100) + '%'; }
  }
  banner(title, sub, ms) {
    const el = $('banner'); el.innerHTML = title + (sub ? `<small>${sub}</small>` : ''); el.classList.add('on');
    clearTimeout(this.bannerT); this.bannerT = setTimeout(() => el.classList.remove('on'), ms);
  }
  openCards(again) {
    const sc = this.sc;
    if (sc.over || sc.pendingLv <= 0) return;
    this.cardsOpen = true; sc.scene.pause(); if (!again) Sfx.play(sc.chestPick ? 'chest' : 'lvl');
    $('luTitle').textContent = sc.chestPick ? '¡Abriste un cofre!' : '¡Subiste de nivel!';
    $('luSub').textContent = sc.chestPick ? `Te curaste un 25% · +${CHEST_FLORES} 🌼 · elige una carta` : `Nivel ${sc.level} · elige una carta`;
    const opts = sc.cardOptions(), box = $('cards'); box.innerHTML = '';
    const rr = $('rerollBtn');
    rr.classList.toggle('hidden', !(sc.rerolls > 0));
    rr.textContent = `🔄 Cambiar cartas (${sc.rerolls})`;
    rr.onclick = () => { if (sc.rerolls <= 0) return; sc.rerolls--; this.openCards(true); };
    opts.forEach((o) => {
      const div = document.createElement('div'); div.className = 'card' + (o.lv === 1 ? ' new' : '');
      if (o.type === 'pan') div.innerHTML = `<div class="ic">${icon('pan', '🍞')}</div><div class="n">Pan de muerto</div><div class="d">Te cura un 30% de vida.</div>`;
      else {
        const D = o.type === 'w' ? WEAPONS[o.id] : PASSIVES[o.id];
        const lvTxt = o.lv === 1 ? '<span class="tag">NUEVO</span>' : `<div class="lv">Nivel ${o.lv - 1} → ${o.lv}</div>`;
        let d = o.type === 'w' && o.lv > 1 ? D.lv[o.lv - 1] : D.desc;
        if (o.type === 'w' && o.lv === 8 && EVOS[o.id]) d += ' · <b class="evohint">¡Ya puede evolucionar!</b>';
        div.innerHTML = `<div class="ic">${icon(o.id, D.icon)}</div>${lvTxt}<div class="n">${D.name}</div><div class="d">${d}</div>`;
      }
      div.onclick = () => this.choose(o);
      box.appendChild(div);
    });
    $('levelup').classList.remove('hidden');
    if (AUTO) setTimeout(() => this.choose(opts[0]), 150);
  }
  choose(o) {
    const sc = this.sc;
    sc.applyCard(o); sc.pendingLv--; sc.chestPick = false;
    $('levelup').classList.add('hidden');
    if (sc.pendingLv > 0) { this.openCards(); return; }
    this.cardsOpen = false; sc.scene.resume();
  }
  pause() {
    const sc = this.sc; if (sc.over || this.cardsOpen) return;
    if (this.counting) { this.stopCount(); }
    else if (sc.scene.isPaused()) { this.resume(); return; }
    sc.scene.pause();
    $('pauseStats').innerHTML = `Tiempo <b>${fmt(sc.t)}</b> · Nivel <b>${sc.level}</b> · Enemigos <b>${sc.kills}</b>`;
    $('pause').classList.remove('hidden');
  }
  resume() { $('pause').classList.add('hidden'); this.countdown(); }
  // 3 segundos para reaccionar antes de que el juego siga (al volver de la pausa o al recuperar la partida)
  countdown(title) {
    const sc = this.sc; if (sc.over) return;
    this.stopCount(); this.counting = true; sc.scene.pause();
    const el = $('count'); let n = 3;
    const show = () => { el.innerHTML = (title ? `<small>${title}</small>` : '') + `<b>${n}</b>`; el.classList.remove('hidden'); el.firstElementChild && el.querySelector('b').animate([{ transform: 'scale(1.6)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], 260); };
    show(); Sfx.play('pick');
    this.countT = setInterval(() => {
      n--;
      if (n > 0) { show(); Sfx.play('pick'); return; }
      this.stopCount(); sc.scene.resume(); Sfx.play('dash');
      if (sc.pendingLv > 0) this.openCards(true);
    }, 1000);
  }
  stopCount() { clearInterval(this.countT); this.counting = false; $('count').classList.add('hidden'); }
  end(win) {
    const sc = this.sc;
    $('hud').classList.add('hidden');
    $('endTitle').textContent = 'La noche te alcanzó';
    const jefes = sc.bossKills.length, loopMax = sc.bossKills.reduce((m, b) => Math.max(m, b.loop), 0);
    const brag = win ? `<div class="won txt">🏆 Venciste a La Llorona${loopMax > 1 ? ` · llegaste a la vuelta ${loopMax}` : ''}</div>` : '';
    const best = sc.reward && sc.reward.counts && Math.floor(sc.t) >= save.mejor ? ' · <b class="rec">¡Récord!</b>' : '';
    const O = OBJECTIVES[sc.obj.id], objLine = `<div class="objend ${sc.obj.done ? 'ok' : 'no'}">${sc.obj.done ? '✅' : '❌'} ${O.name}${sc.curses.size ? ` · ${[...sc.curses].map(c => CURSES[c].icon).join(' ')}` : ''}</div>`;
    $('endStats').innerHTML = `${brag}${objLine}${HUNTERS[sc.hunterId].name}<br>Tiempo <b>${fmt(sc.t)}</b>${best} · Nivel <b>${sc.level}</b> · Enemigos <b>${sc.kills}</b>${jefes ? ` · Jefes <b>${jefes}</b>` : ''}<br>` +
      sc.W.map(w => `<span class="endw${w.evo ? ' evo' : ''}">${wIcon(w)} ${wName(w)}${w.evo ? '' : ' ' + w.lv}</span>`).join(' ');
    const r = sc.reward;
    if (r) {
      const extra = [r.cosecha > 1 ? `Cosecha ×${r.cosecha.toFixed(2)}` : '', r.first ? '1ª partida del día ×2' : ''].filter(Boolean).join(' · ');
      $('endFlowers').innerHTML = `<div class="fl-big">+${r.total} 🌼</div><div class="fl-rows">Tiempo ${r.tiempo} · Enemigos ${r.enemigos}${r.jefes ? ` · Jefes ${r.jefes}` : ''}${r.cofres ? ` · Cofres ${r.cofres}` : ''}${r.tope ? ` · Tope ${FLOWERS.cap}` : ''}${r.objetivo ? `<br>Objetivo +${r.objetivo}` : ''}${r.maldiciones ? `${r.objetivo ? ' · ' : '<br>'}Maldiciones ×${(1 + CURSE_BONUS * r.maldiciones).toFixed(1)}` : ''}${extra ? `<br>${extra}` : ''}${r.counts ? '' : '<br><i>Partida de prueba: no cuenta</i>'}</div><div class="fl-tot">Tienes ${save.flores} 🌼</div>`;
    }
    $('end').classList.remove('hidden');
  }
}

// ---------- Menú y arranque ----------
let selected = 'machetero';
let game = null;

const owned = (id) => save.cazadores.includes(id);
const HUNTER_TAG = { machetero: 'Cazador de nahuales', curandera: 'Guardiana del copal', luchadora: 'Campeona de la arena', cohetero: 'Maestro de la pólvora' };
const portrait = (id) => IMG['retrato_' + id] || IMG[id + '_quieto'] || IMG[id + '_ataque'];
const wIco = (id) => IMG['icono_' + id] ? `<img src="${IMG['icono_' + id]}" alt="">` : (WEAPONS[id] ? WEAPONS[id].icon : '');
const starsH = (e) => '★'.repeat(e || 0) + '<i>' + '★'.repeat(MAX_STARS - (e || 0)) + '</i>';
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const shake = (el) => el && el.animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'none' }], 250);
function unlockHunter(id, el) {
  const cost = HUNTER_COST[id] || 0;
  if (save.flores < cost) { shake(el); return false; }
  save.flores -= cost; save.cazadores.push(id); persist(); Sfx.init(); Sfx.play('chest'); return true;
}
let viewing = null; // cazador que se ve en la pestaña Cazadores
let tab = 'jugar', arsSeg = 'armas';
const TAB_SCREEN = { jugar: 'menu', cazadores: 'cazadores', arsenal: 'arsenal', talentos: 'tree', pinata: 'pinata' };

function hubTop() {
  $('curFl').textContent = `🌼 ${save.flores}`;
  const b = pinBoletos(); $('curBo').textContent = `🎟️ ${b}`; $('curBo').classList.toggle('hidden', !b && !nube.on);
  $('profImg').src = portrait(selected);
  $('profName').textContent = nube.on ? nube.name : 'Invitado';
  $('profRec').textContent = save.mejor ? `Mejor noche ${fmtT(save.mejor)}` : 'Aún sin récord';
  $('dotPin').classList.toggle('hidden', save.pin.dia === today());
  $('dotTal').classList.toggle('hidden', !TALENTS.some(t => { const st = talentState(t); return st.st === 'can' && st.cost <= save.flores; }));
  $('dotArs').classList.toggle('hidden', !(Object.keys(save.armas || {}).length && !save.equipo));
}
function showTab(t) {
  tab = t;
  for (const id of Object.values(TAB_SCREEN)) $(id).classList.add('hidden');
  $('hub').classList.remove('hidden'); showScene(true);
  document.querySelectorAll('.hubnav button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  if (t === 'jugar') buildMenu();
  else if (t === 'cazadores') buildCaz();
  else if (t === 'arsenal') buildArs();
  else if (t === 'talentos') buildTree();
  else if (t === 'pinata') openPinata('menu');
  $(TAB_SCREEN[t]).classList.add('tabp'); $(TAB_SCREEN[t]).classList.remove('hidden'); $(TAB_SCREEN[t]).scrollTop = 0;
  hubTop();
}
function hideHub() { $('hub').classList.add('hidden'); for (const id of Object.values(TAB_SCREEN)) $(id).classList.add('hidden'); }

function buildMenu() {
  $('logo').src = IMG.logo;
  if (!owned(selected)) selected = 'machetero';
  const h = HUNTERS[selected];
  $('stageImg').src = portrait(selected);
  $('plName').textContent = h.name; $('plTag').textContent = HUNTER_TAG[selected] || '';
  const eq = save.equipo && save.armas[save.equipo];
  if (eq) {
    const R = RARITIES[eq.r];
    $('eqIn').innerHTML = `<span class="ico" style="--rc:${R.color}">${wIco(save.equipo)}</span><span class="tx">Arma equipada<b style="color:${R.color}">${WEAPONS[save.equipo].name}</b><span class="st">${starsH(eq.e)}</span></span>`;
  } else $('eqIn').innerHTML = `<span class="ico">🪅</span><span class="tx">Arma equipada<b>Ninguna</b>${save.pin.dia !== today() ? 'Tirada gratis en la Piñata' : 'Consíguelas en la Piñata'}</span>`;
  $('eqCard').onclick = () => showTab(eq ? 'arsenal' : 'pinata');
  $('abIn').innerHTML = `<span class="ico" style="--rc:#3ff0d8">${wIco(h.weapon)}</span><span class="tx">${WEAPONS[h.weapon].name} · ${h.hp} ❤️<b style="color:#9ff7ea">${h.ability}</b>Habilidad</span>`;
  hubTop();
}

function buildCaz() {
  if (!viewing || !HUNTERS[viewing]) viewing = selected;
  const g = $('cazGrid'); g.innerHTML = '';
  for (const [k, hh] of Object.entries(HUNTERS)) {
    const lk = !owned(k), d = document.createElement('div');
    d.className = 'frame ccard' + (lk ? ' locked' : '') + (k === viewing ? ' view' : '');
    d.innerHTML = `<div class="in"><img src="${portrait(k)}" alt="">${lk ? `<div class="lk">🔒 ${HUNTER_COST[k]}🌼</div>` : ''}${k === selected ? '<div class="ok">✔</div>' : ''}<div class="tn">${hh.name}</div></div>`;
    d.onclick = () => { viewing = k; Sfx.init(); Sfx.play('pick'); buildCaz(); };
    g.appendChild(d);
  }
  const id = viewing, h = HUNTERS[id], lock = !owned(id), cost = HUNTER_COST[id] || 0, W = WEAPONS[h.weapon];
  const pct = (v, lo, hi) => Math.round(100 * Math.max(0.12, Math.min(1, (v - lo) / (hi - lo))));
  const det = $('cazDet'); det.className = 'in' + (lock ? ' locked' : '');
  det.innerHTML = `<div class="big"><img src="${portrait(id)}" alt=""></div><div class="info">
    <div class="nm">${h.name}</div><div class="tg">${HUNTER_TAG[id] || ''}</div>
    <div class="ds">${h.blurb}</div>
    <div class="sbar"><span>❤️ Vida</span><div class="bar"><i style="width:${pct(h.hp, 70, 145)}%"></i></div><em>${h.hp}</em></div>
    <div class="sbar"><span>💨 Velocidad</span><div class="bar"><i style="width:${pct(h.speed, 130, 160)}%"></i></div><em>${h.speed}</em></div>
    <div class="ds ab">⚔️ <b>${W.name}:</b> ${W.desc}</div>
    <div class="ds ab">✨ <b>${h.ability}:</b> ${h.abilityDesc}</div>
    ${lock ? `<button class="obtn" id="cazAct"><b>🔒</b>Abrir por ${cost} 🌼</button><div class="ds" style="font-size:11px">${save.flores >= cost ? '¡Ya te alcanza!' : `Te faltan ${cost - save.flores} 🌼`}</div>`
      : id === selected ? '<div class="tagok">✔ Es tu cazador</div>' : '<button class="obtn" id="cazAct"><b>✔</b>Elegir</button>'}
  </div>`;
  const act = $('cazAct');
  if (act) act.onclick = () => {
    if (lock && !unlockHunter(id, act)) return;
    selected = id; Sfx.init(); Sfx.play('pick'); buildCaz(); hubTop();
  };
}

function buildArs() {
  document.querySelectorAll('#arsSeg button').forEach(b => { b.classList.toggle('on', b.dataset.s === arsSeg); b.onclick = () => { arsSeg = b.dataset.s; Sfx.init(); Sfx.play('pick'); buildArs(); }; });
  const L = $('arsList'); L.innerHTML = '';
  if (arsSeg === 'armas') {
    const have = Object.keys(save.armas || {}).length;
    $('arsTop').innerHTML = `Tienes <b>${have}/${Object.keys(WEAPONS).length}</b> armas de la Piñata. La que equipes entra contigo a la partida con su bono.`;
    const order = Object.keys(WEAPONS).sort((x, y) => (y === save.equipo) - (x === save.equipo) || ((save.armas[y] ? save.armas[y].r + 1 : 0) - (save.armas[x] ? save.armas[x].r + 1 : 0)));
    for (const id of order) {
      const a = save.armas[id], W = WEAPONS[id], R = a && RARITIES[a.r], on = save.equipo === id;
      const d = document.createElement('div'); d.className = 'frame wrow' + (a ? '' : ' none') + (on ? ' eq' : '');
      let tx;
      if (a) { const bb = gearBonus(a); tx = `<b>${W.name}</b><span class="rr" style="color:${R.color}">${R.name} <span class="st">${starsH(a.e)}</span></span><span>+${Math.round((bb.dmg - 1) * 100)}% de daño${bb.cd < 1 ? ` · −${Math.round((1 - bb.cd) * 100)}% espera` : ''}${bb.lv > 1 ? ` · nivel ${bb.lv}` : ''}</span>`; }
      else tx = `<b>${W.name}</b><span>${W.desc}</span><span style="color:#8a7aa8">Consíguela en la Piñata</span>`;
      d.innerHTML = `<div class="in"><span class="ico" style="--rc:${R ? R.color : '#3a2d4a'}">${wIco(id)}</span><span class="tx">${tx}</span>${a ? (on ? '<span class="eqt">✔ EQUIPADA</span><button class="obtn" data-q>Quitar</button>' : '<button class="obtn" data-e>Equipar</button>') : ''}</div>`;
      const be = d.querySelector('[data-e]'), bq = d.querySelector('[data-q]');
      if (be) be.onclick = () => { save.equipo = id; persist(); Sfx.init(); Sfx.play('chest'); buildArs(); hubTop(); };
      if (bq) bq.onclick = () => { save.equipo = ''; persist(); Sfx.init(); Sfx.play('pick'); buildArs(); hubTop(); };
      L.appendChild(d);
    }
    const go = document.createElement('button'); go.className = 'obtn'; go.innerHTML = '<b>🪅</b>Ir a la Piñata'; go.style.alignSelf = 'center'; go.onclick = () => showTab('pinata'); L.appendChild(go);
  } else {
    const ev = save.evos || [];
    $('arsTop').innerHTML = `Descubriste <b>${ev.length}/${Object.keys(EVOS).length}</b> evoluciones. Sube un arma a nivel 8, junta su objeto pareja y abre un cofre.`;
    const g = document.createElement('div'); g.className = 'egrid';
    for (const [w, E] of Object.entries(EVOS)) {
      const k = ev.includes(w), im = IMG['icono_evo_' + w] || IMG['icono_' + w];
      const d = document.createElement('div'); d.className = 'frame ecard' + (k ? '' : ' unk');
      d.innerHTML = `<div class="in"><span class="ico">${im ? `<img src="${im}" alt="">` : '❔'}</span><span class="tx">${k ? `<b>${E.name}</b>${WEAPONS[w].name} + ${PASSIVES[E.pas].name}<br>${E.desc}` : `<b>???</b>Sube <b style="display:inline;color:#cdbde6">${WEAPONS[w].name}</b> a nivel 8 y descubre su pareja.`}</span></div>`;
      g.appendChild(d);
    }
    L.appendChild(g);
  }
}

function showScene(on) {
  $('scene').classList.toggle('hidden', !on);
  const bg = $('bgimg'); if (bg && IMG.menu_fondo_v) { bg.style.setProperty('--bgv', `url(${IMG.menu_fondo_v})`); bg.style.setProperty('--bgh', `url(${IMG.menu_fondo_h || IMG.menu_fondo_v})`); }
}
(function petals() {
  const box = document.getElementById('petals'); if (!box) return;
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`; p.style.animationDuration = `${9 + Math.random() * 9}s`; p.style.animationDelay = `${-Math.random() * 18}s`;
    p.style.transform = `scale(${0.6 + Math.random() * 0.8})`; box.appendChild(p);
  }
})();
function openTitle() {
  showScene(true); $('tLogo').src = IMG.logo; $('tVer').textContent = 'v' + VERSION;
  $('title').classList.remove('hidden');
  $('title').onclick = () => { Sfx.init(); $('title').classList.add('hidden'); showTab('jugar'); offerResume(); };
}
function setupHub() {
  document.querySelectorAll('.hubnav button').forEach(b => { b.onclick = () => { Sfx.init(); Sfx.play('pick'); if (b.dataset.t === 'jugar' && tab === 'jugar' && !$('menu').classList.contains('hidden')) { openPrep(); return; } showTab(b.dataset.t); }; });
  const open = (id) => { $(id).classList.remove('hidden'); };
  document.querySelectorAll('.modal').forEach(m => { m.onclick = (e) => { if (e.target === m || e.target.hasAttribute('data-close')) m.classList.add('hidden'); }; });
  $('setBtn').onclick = () => {
    $('setVer').textContent = 'v' + VERSION; $('sndVal').textContent = Sfx.on ? 'Sí' : 'No';
    const ac = $('acct');
    if (nube.on) { $('acctVal').textContent = nube.name; ac.removeAttribute('href'); }
    else if (nube.can) { $('acctVal').textContent = 'Iniciar sesión ›'; ac.href = loginUrl(); }
    else { $('acctVal').textContent = 'Solo en leyendas.darkshadow-studios.com'; ac.removeAttribute('href'); }
    open('setBox');
  };
  $('sndBtn').onclick = () => { Sfx.on = !Sfx.on; try { localStorage.setItem('ndl_snd', Sfx.on ? '1' : '0'); } catch (e) { /* nada */ } $('sndVal').textContent = Sfx.on ? 'Sí' : 'No'; };
  try { if (localStorage.getItem('ndl_snd') === '0') Sfx.on = false; } catch (e) { /* nada */ }
  $('howBtn').onclick = () => { $('setBox').classList.add('hidden'); open('howBox'); };
  $('profBtn').onclick = () => {
    const ev = (save.evos || []).length, ar = Object.keys(save.armas || {}).length;
    $('profStats').innerHTML = [['Mejor noche', save.mejor ? fmtT(save.mejor) : '—'], ['Partidas', save.partidas || 0], ['Victorias contra La Llorona', save.victorias || 0],
      ['Flores ganadas', save.ganadas || 0], ['Cazadores', `${save.cazadores.length}/${Object.keys(HUNTERS).length}`], ['Armas', `${ar}/${Object.keys(WEAPONS).length}`],
      ['Evoluciones', `${ev}/${Object.keys(EVOS).length}`], ['Talentos', TALENTS.reduce((n, t) => n + tl(t.id), 0)]].map(([k, v]) => `<div><b>${v}</b>${k}</div>`).join('');
    open('profBox');
  };
  setInterval(() => { if (!$('hub').classList.contains('hidden')) hubTop(); }, 700);
}

// ---------- Árbol de talentos ----------
let treeTab = 'ataque';
function branchSpent(b) { return TALENTS.filter(t => t.b === b && !t.final).reduce((n, t) => n + tl(t.id), 0); }
function talentState(t) {
  const lv = tl(t.id), list = TALENTS.filter(x => x.b === t.b), i = list.indexOf(t);
  if (lv >= t.max) return { st: 'max', lv };
  if (t.final && branchSpent(t.b) < FINAL_NEEDS) return { st: 'lock', lv, why: `Gasta ${FINAL_NEEDS} niveles en esta rama (${branchSpent(t.b)}/${FINAL_NEEDS})` };
  if (i > 0 && !t.final && tl(list[i - 1].id) < 1) return { st: 'lock', lv, why: `Primero: ${list[i - 1].name}` };
  return { st: 'can', lv, cost: talentCost(t, lv + 1) };
}
function buildTree() {
  $('treeFlores').textContent = `🌼 ${save.flores}`;
  $('treeTabs').innerHTML = Object.entries(BRANCHES).map(([k, b]) => `<button data-b="${k}" class="${k === treeTab ? 'on' : ''}">${b.icon} ${b.name}</button>`).join('');
  $('treeTabs').querySelectorAll('button').forEach(bt => { bt.onclick = () => { treeTab = bt.dataset.b; buildTree(); }; });
  const box = $('branches'); box.innerHTML = '';
  for (const [k, b] of Object.entries(BRANCHES)) {
    const col = document.createElement('div'); col.className = 'branch' + (k === treeTab ? ' on' : '');
    col.innerHTML = `<h3 class="txt" style="color:${b.color}">${b.icon} ${b.name}</h3><div class="spent">${branchSpent(k)} niveles</div>`;
    for (const t of TALENTS.filter(x => x.b === k)) {
      const s = talentState(t);
      const now = s.lv > 0 ? t.txt(s.lv) : 'Sin aprender';
      const next = s.lv < t.max ? `<br>Siguiente: <i>${t.txt(s.lv + 1)}</i>` : '';
      const pips = t.max > 1 ? `<div class="pips">${[...Array(t.max)].map((_, i) => `<span class="${i < s.lv ? 'on' : ''}"></span>`).join('')}</div>` : '';
      const node = document.createElement('div'); node.className = `tnode ${s.st}${t.final ? ' final' : ''}`;
      const btn = s.st === 'max' ? '<button class="buy" disabled>MÁX</button>' : s.st === 'lock' ? '<button class="buy" disabled>🔒</button>' : `<button class="buy"${save.flores < s.cost ? ' disabled' : ''}>${s.cost} 🌼</button>`;
      node.innerHTML = `<div class="ti">${t.icon}</div><div class="tb"><div class="tn txt">${t.name}${t.final ? ' ★' : ''}</div><div class="td">${s.st === 'lock' ? s.why : now + next}</div>${pips}</div>${btn}`;
      const bb = node.querySelector('.buy');
      if (s.st === 'can') bb.onclick = () => {
        if (save.flores < s.cost) return;
        save.flores -= s.cost; save.tal[t.id] = s.lv + 1; persist(); Sfx.init(); Sfx.play('lvl'); buildTree();
      };
      col.appendChild(node);
    }
    box.appendChild(col);
  }
}
function openTree(from) { treeFrom = from; ['menu', 'end', 'pinata'].forEach(id => $(id).classList.add('hidden')); buildTree(); $('tree').classList.remove('hidden'); }
let treeFrom = 'menu';

// ---------- Antes de jugar: objetivo (2 al azar) y maldiciones opcionales ----------
const prep = { opts: [], obj: 'llorona' };
function openPrep() {
  const ids = Object.keys(OBJECTIVES);
  prep.opts = []; while (prep.opts.length < 2) { const k = pick(ids); if (!prep.opts.includes(k)) prep.opts.push(k); }
  prep.obj = prep.opts[0];
  save.malds = (save.malds || []).filter(c => CURSES[c]);
  ['menu', 'end'].forEach(id => $(id).classList.add('hidden')); hideHub();
  buildPrep(); $('prep').classList.remove('hidden');
}
function buildPrep() {
  $('prepObjs').innerHTML = prep.opts.map(k => { const O = OBJECTIVES[k]; return `<div class="pobj${k === prep.obj ? ' on' : ''}" data-k="${k}"><div class="pi">${O.icon}</div><div class="pn">${O.name}</div><div class="pd">${O.desc}</div><div class="pf">+${O.flores} 🌼</div></div>`; }).join('');
  $('prepObjs').querySelectorAll('.pobj').forEach(el => { el.onclick = () => { prep.obj = el.dataset.k; Sfx.play('pick'); buildPrep(); }; });
  $('prepCurses').innerHTML = Object.entries(CURSES).map(([k, C]) => `<button class="pcur${save.malds.includes(k) ? ' on' : ''}" data-k="${k}"><b>${C.icon} ${C.name}</b><span>${C.desc}</span></button>`).join('');
  $('prepCurses').querySelectorAll('.pcur').forEach(el => { el.onclick = () => {
    const k = el.dataset.k; save.malds = save.malds.includes(k) ? save.malds.filter(x => x !== k) : [...save.malds, k]; persist(); Sfx.play('pick'); buildPrep();
  }; });
  const n = save.malds.length;
  $('prepBonus').innerHTML = n ? `Flores ×${(1 + CURSE_BONUS * n).toFixed(1)} por ${n} ${n === 1 ? 'maldición' : 'maldiciones'}` : 'Cada maldición da +20 % de flores';
}

function startRun(resume) {
  dsTrack('game_started', 'leyendas');   // analítica anónima del estudio: empezó una partida
  Sfx.init();
  if (!resume) clearRun();
  if (!owned(selected)) selected = 'machetero';
  ['menu', 'end', 'pause', 'levelup', 'tree', 'resumeBox', 'pinata', 'prep', 'title', 'howBox', 'setBox', 'profBox'].forEach(id => $(id).classList.add('hidden')); hideHub(); showScene(false);
  const sm = game.scene;
  if (sm.getScene('play')) sm.stop('play');
  sm.start('play', { hunter: resume ? resume.hunter : selected, resume: resume || null,
    obj: Q.get('obj') || prep.obj, curses: Q.has('mald') ? Q.get('mald').split(',') : (save.malds || []) });
}

function toMenu() {
  const s = game.scene.getScene('play');
  if (s && s.hud) s.hud.stopCount();
  if (s && s.sys.isActive() && !s.over) clearRun(); // salir a la mitad = se abandona
  if (s) game.scene.stop('play');
  ['end', 'pause', 'levelup', 'hud', 'count', 'fog', 'prep'].forEach(id => $(id).classList.add('hidden'));
  showTab('jugar');
  offerResume();
}

// ¿Quedó una partida a medias (se cerró la app, se apagó el celular…)?
function offerResume() {
  const r = readRun();
  if (!r || !HUNTERS[r.hunter]) { $('resumeBox').classList.add('hidden'); return; }
  $('resumeInfo').innerHTML = `${HUNTERS[r.hunter].name} · <b>${fmt(r.t)}</b> · Nivel ${r.level}${r.won ? ' · 🏆' : ''}`;
  $('resumeBox').classList.remove('hidden');
  $('resumeGo').onclick = () => startRun(readRun());
  $('resumeDrop').onclick = () => {
    if ($('resumeDrop').dataset.sure !== '1') { $('resumeDrop').dataset.sure = '1'; $('resumeDrop').textContent = '¿Seguro? Se pierde'; return; }
    clearRun(); $('resumeDrop').dataset.sure = ''; $('resumeDrop').textContent = 'Abandonar'; $('resumeBox').classList.add('hidden');
  };
}

async function boot() {
  dsTrack('game_opened', 'leyendas');    // analítica anónima del estudio: se abrió el juego
  try { await document.fonts.load('20px "Lilita One"'); } catch (e) { /* sigue */ }
  game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', backgroundColor: '#140c20',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { antialias: true, powerPreference: 'high-performance' },
    input: { activePointers: 3 },
    audio: { noAudio: true },
    scene: [],
  });
  game.scene.add('play', Play, false); if (DEV) window.__g = game;
  setupHub();
  $('startBtn').onclick = () => { Sfx.init(); openPrep(); };
  $('prepGo').onclick = () => { prep.go = true; startRun(); };
  $('prepBack').onclick = () => { $('prep').classList.add('hidden'); showTab('jugar'); };
  $('againBtn').onclick = () => startRun();
  $('menuBtn').onclick = toMenu;
  setupPinata(IMG, (k) => { Sfx.init(); Sfx.play(k); });
  $('endPinataBtn').onclick = () => { Sfx.init(); toMenu(); showTab('pinata'); };
  $('endTreeBtn').onclick = () => { toMenu(); showTab('talentos'); };
  onNube(() => { if (!$('hub').classList.contains('hidden')) showTab(tab); });
  startNube();
  $('quitBtn').onclick = toMenu;
  $('resumeBtn').onclick = () => game.scene.getScene('play').hud.resume();
  $('pauseBtn').onclick = () => game.scene.getScene('play').hud.pause();
  $('dashBtn').onclick = (ev) => { ev.stopPropagation(); game.scene.getScene('play').dash(); };
  $('abilityBtn').onclick = (ev) => { ev.stopPropagation(); game.scene.getScene('play').ability(); };
  // Al cerrar, suspender o cambiar de app: se guarda la partida y se pausa
  const leave = () => { const s = game.scene.getScene('play'); if (s && s.sys.isActive() && !s.over) { s.saveRun(); s.hud.pause(); } };
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  window.addEventListener('pagehide', leave);
  window.addEventListener('blur', () => { const s = game.scene.getScene('play'); if (s && s.sys.isActive() && !s.over) s.saveRun(); });
  if (Q.has('go')) { if (HUNTERS[Q.get('go')]) { selected = Q.get('go'); if (!owned(selected) && (DEV || AUTO)) save.cazadores.push(selected); } startRun(); }
  else if (Q.has('menu')) { showTab(Q.get('menu') || 'jugar'); offerResume(); }
  else openTitle();
}
boot();

// ---------- Jugar sin internet (app instalable) ----------
(function offline() {
  const web = location.protocol === 'https:' || location.hostname === 'localhost';
  const inFrame = window.top !== window.self;
  if (!web || inFrame || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  const standalone = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || navigator.standalone;
  if (standalone) return;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('installBtn').classList.remove('hidden'); });
  $('installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch (e) { /* nada */ } deferred = null; $('installBtn').classList.add('hidden'); };
  window.addEventListener('appinstalled', () => $('installBtn').classList.add('hidden'));
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) $('iosHint').classList.remove('hidden');
})();
