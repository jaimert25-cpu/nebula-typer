// =====================================================================
// enemies.js — ENEMIGOS + DIRECTOR
// `enemies` es el arreglo vivo compartido (otros modulos lo leen/mutan,
// nunca lo reasignan, para conservar la misma referencia).
// makeEnemy y Director reciben level/diff como PARAMETROS en vez de leer
// el objeto Game directamente: asi no dependen de game.js (evitamos
// dependencias circulares). Eso es "inyeccion de dependencias".
// =====================================================================

import { CONFIG, TYPES } from './config.js';
import { ctx, view } from './viewport.js';
import { rand, clamp, pickWordByLen } from './utils.js';

export const enemies = [];

export function makeEnemy(typeKey, level, diff){
  const T = TYPES[typeKey];
  let word;
  if (typeKey === 'fast')       word = pickWordByLen(3, level < 5 ? 4 : 5);
  else if (typeKey === 'tank')  word = pickWordByLen(Math.min(8, 6 + Math.floor(level / 2)), 13);
  else if (typeKey === 'bonus') word = pickWordByLen(5, 7);
  else {
    const max = Math.min(11, 4 + level);
    const min = level <= 2 ? 3 : Math.min(5 + Math.floor((level - 3) / 3), 7);
    word = pickWordByLen(min, max);
  }
  // intentar que la primera letra sea unica frente a enemigos vivos
  for (let k = 0; k < 6 && enemies.some(e => !e.dead && e.word[0] === word[0]); k++){
    if (typeKey === 'fast')       word = pickWordByLen(3, level < 5 ? 4 : 5);
    else if (typeKey === 'tank')  word = pickWordByLen(Math.min(8, 6 + Math.floor(level / 2)), 13);
    else if (typeKey === 'bonus') word = pickWordByLen(5, 7);
    else                          word = pickWordByLen(level <= 2 ? 3 : 5, Math.min(11, 4 + level));
  }

  ctx.font = '700 ' + view.wordPx + 'px "Share Tech Mono",monospace';
  const w = ctx.measureText(word).width + 22;
  const x = clamp(rand(0, view.W), w / 2 + 16, view.W - w / 2 - 16);
  const dspd = CONFIG.diff[diff].spd;
  const speed = (CONFIG.baseFall + level * CONFIG.fallPerLevel) * T.spd * dspd * view.scale + rand(-3, 5) * view.scale;

  return {
    type: typeKey, T, word, typed: 0, mistakes: 0, x, y: -30, speed,
    emoji: T.emojis[(Math.random() * T.emojis.length) | 0],
    glow: T.glow, bob: rand(0, 6.28), errorT: 0, dead: false
  };
}

export const Director = (() => {
  let timer = 0;
  function reset(){ timer = 0.6; }
  function interval(level, diff){
    return Math.max(CONFIG.spawnMin, (CONFIG.spawnBase - level * CONFIG.spawnPerLevel)) * CONFIG.diff[diff].spawn;
  }
  function pickType(level){
    if (Math.random() < 0.06) return 'bonus';
    const r = Math.random();
    if (level >= 3 && r < 0.16 + level * 0.012) return 'tank';
    if (r < 0.18 + level * 0.03) return 'fast';
    return 'normal';
  }
  function update(dt, level, diff){
    timer -= dt;
    if (timer <= 0){
      enemies.push(makeEnemy(pickType(level), level, diff));
      timer = interval(level, diff);
      if (level >= 5 && Math.random() < 0.22) enemies.push(makeEnemy(pickType(level), level, diff));
    }
  }
  return { reset, update };
})();
