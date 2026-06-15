// =====================================================================
// enemies.js - ENEMIGOS + DIRECTOR
// `enemies` es el arreglo vivo compartido. Tipos: normal/fast/tank/bonus,
// power-ups (e.power) y jefes (e.words/e.hp). En oleadas multiplo de 5
// el Director manda un JEFE y pausa los enemigos normales (duelo).
// =====================================================================

import { CONFIG, TYPES, POWERS, lang } from './config.js';
import { ctx, view } from './viewport.js';
import { rand, clamp, pickWordByLen } from './utils.js';

export const enemies = [];

export function makeEnemy(typeKey, level, diff){
  const T = TYPES[typeKey];
  let word, power = null, words = null, hp = 0, maxhp = 0;
  if (typeKey === 'boss'){
    words = [pickWordByLen(6, 9), pickWordByLen(6, 9), pickWordByLen(6, 9), pickWordByLen(6, 9), pickWordByLen(6, 9)];
    word = words[0]; hp = 5; maxhp = 5;
  }
  else if (typeKey === 'power'){
    const p = POWERS[(Math.random() * POWERS.length) | 0];
    power = p.fx; word = p[lang] || p.es;
  }
  else if (typeKey === 'fast')  word = pickWordByLen(3, level < 5 ? 4 : 5);
  else if (typeKey === 'tank')  word = pickWordByLen(Math.min(8, 6 + Math.floor(level / 2)), 13);
  else if (typeKey === 'bonus') word = pickWordByLen(5, 7);
  else {
    const max = Math.min(11, 4 + level);
    const min = level <= 2 ? 3 : Math.min(5 + Math.floor((level - 3) / 3), 7);
    word = pickWordByLen(min, max);
  }
  // primera letra unica (no aplica a power-ups ni jefes)
  for (let k = 0; k < 6 && typeKey !== 'power' && typeKey !== 'boss' && enemies.some(e => !e.dead && e.word[0] === word[0]); k++){
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
    type: typeKey, T, word, words, hp, maxhp, power, typed: 0, mistakes: 0, x, y: -30, speed,
    emoji: T.emojis[(Math.random() * T.emojis.length) | 0],
    glow: T.glow, bob: rand(0, 6.28), errorT: 0, dead: false
  };
}

export const Director = (() => {
  let timer = 0, lastBoss = 0;
  function reset(){ timer = 0.6; lastBoss = 0; }
  function interval(level, diff){
    return Math.max(CONFIG.spawnMin, (CONFIG.spawnBase - level * CONFIG.spawnPerLevel)) * CONFIG.diff[diff].spawn;
  }
  function pickType(level){
    if (Math.random() < 0.06) return 'bonus';
    if (Math.random() < 0.03) return 'power';
    const r = Math.random();
    if (level >= 3 && r < 0.16 + level * 0.012) return 'tank';
    if (r < 0.18 + level * 0.03) return 'fast';
    return 'normal';
  }
  function update(dt, level, diff){
    const bossAlive = enemies.some(e => e.type === 'boss' && !e.dead);
    if (bossAlive) return;                          // duelo: no salen normales
    if (level % 5 === 0 && lastBoss !== level){     // oleada de JEFE
      lastBoss = level;
      enemies.push(makeEnemy('boss', level, diff));
      return;
    }
    timer -= dt;
    if (timer <= 0){
      enemies.push(makeEnemy(pickType(level), level, diff));
      timer = interval(level, diff);
      if (level >= 5 && Math.random() < 0.22) enemies.push(makeEnemy(pickType(level), level, diff));
    }
  }
  return { reset, update };
})();