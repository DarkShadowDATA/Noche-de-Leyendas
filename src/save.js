// Noche de Leyendas: guardado en el celular (localStorage). Más adelante se sube a la cuenta DarkShadow.
const KEY = 'ndl_save_v1';
const DEF = () => ({ flores: 0, ganadas: 0, tal: {}, cazadores: ['machetero', 'curandera'], dia: '', partidas: 0, mejor: 0, victorias: 0 });

function read() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s ? Object.assign(DEF(), s) : DEF(); } catch (e) { return DEF(); }
}
export const save = read();
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* sin espacio o bloqueado */ } }
export const tl = (id) => save.tal[id] || 0;
export const today = () => { try { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); } catch (e) { return new Date().toISOString().slice(0, 10); } };
