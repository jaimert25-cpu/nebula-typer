// =====================================================================
// game.js — EL CEREBRO
// Estado central (score, escudos, combo, focus...), maquina de estados
// (menu/countdown/playing/paused/over) y TODAS las reglas del juego.
// No sabe nada de pixeles: el dibujado vive en render.js. Llama a la UI
// (banner, pantallas) y a los sistemas (audio, fx, stars, enemies).
// =====================================================================

import { CONFIG } from './config.js';
import { lerp, clamp, lerpAngle } from './utils.js';
import { view } from './viewport.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { FX } from './fx.js';
import { Stars } from './stars.js';
import { enemies, makeEnemy, Director } from './enemies.js';
import { banner, setCd, showCountdown, showScreen, refreshMenuBest, showGameOver } from './ui.js';

// estado compartido con render.js (live bindings)
export let active = null;
export let shipAngle = -Math.PI / 2;
export const lasers = [];

function fireLaser(e){
  const px = view.W / 2, py = view.H - CONFIG.shipY;
  lasers.push({ x1: px, y1: py - 18, x2: e.x, y2: e.y, t: 0.16 });
}

export const Game = {
  state: 'menu',                 // menu | countdown | playing | paused | over
  diff: Storage.get('nt_diff', 'normal'),
  score: 0, level: 1, shields: 3, maxShields: 3, combo: 0, bestCombo: 0,
  comboTimer: 0, focus: 0, overdrive: 0, enemyTime: 1, freeze: 0, x2: 0,
  enemiesDestroyed: 0, correctChars: 0, totalKeys: 0, wordsDone: 0, perfect: 0,
  startTime: 0, wpm: 0, shake: 0, damageFlash: 0,
  cd: { i: 0, t: 0 }, steps: ['3', '2', '1', 'GO!'],

  resetRun(){
    const d = CONFIG.diff[this.diff];
    this.score = 0; this.level = 1; this.maxShields = d.shields; this.shields = d.shields;
    this.combo = 0; this.bestCombo = 0; this.comboTimer = 0; this.focus = 0; this.overdrive = 0; this.enemyTime = 1; this.freeze = 0; this.x2 = 0;
    this.enemiesDestroyed = 0; this.correctChars = 0; this.totalKeys = 0; this.wordsDone = 0; this.perfect = 0;
    this.wpm = 0; this.shake = 0; this.damageFlash = 0;
    enemies.length = 0; lasers.length = 0; active = null; shipAngle = -Math.PI / 2;
    FX.clear(); Director.reset();
  },

  beginCountdown(){
    Audio.init(); Audio.resume(); Audio.musicOn(true);
    this.resetRun(); this.state = 'countdown'; this.cd.i = 0; this.cd.t = 0;
    showScreen(null); showCountdown(true);
    setCd(this.steps[0], false); Audio.type(0);
  },
  start(){
    this.state = 'playing'; this.startTime = performance.now(); showCountdown(false);
    Audio.musicLevel(this.level); banner('OLEADA 1', '#39e0ff');
  },
  pause(){ if (this.state !== 'playing') return; this.state = 'paused'; Audio.musicOn(false); showScreen('pause'); },
  resume(){ if (this.state !== 'paused') return; this.state = 'playing'; Audio.resume(); Audio.musicOn(true); showScreen(null); },
  toMenu(){ this.state = 'menu'; Audio.musicOn(true); showScreen('menu'); refreshMenuBest(); },

  addScore(n){ this.score += n; },
  addFocus(n){ this.focus = clamp(this.focus + n, 0, CONFIG.focusMax); },

  onLetter(ch){
    if (this.state !== 'playing') return;
    this.totalKeys++;
    if (!active){
      let cand = null;
      for (const e of enemies){ if (!e.dead && e.word[0] === ch && (!cand || e.y > cand.y)) cand = e; }
      if (cand){
        active = cand; active.typed = 1; this.correctChars++; this.addFocus(CONFIG.focusPerChar);
        Audio.type(0); FX.spark(active.x, active.y, '#7CFF4F', 4, 80);
        if (active.typed === active.word.length) this.complete(active);
      } else { this.combo = 0; Audio.error(); }
    } else {
      if (ch === active.word[active.typed]){
        active.typed++; this.correctChars++; this.addFocus(CONFIG.focusPerChar);
        Audio.type(active.typed / active.word.length); FX.spark(active.x, active.y, '#7CFF4F', 4, 80);
        if (active.typed === active.word.length) this.complete(active);
      } else { active.mistakes++; active.errorT = 0.25; this.combo = 0; Audio.error(); }
    }
  },

  complete(e){
    this.combo++; if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.comboTimer = Math.max(CONFIG.comboWindowMin, CONFIG.comboWindow - this.level * 0.18);
    const mult = 1 + Math.floor(this.combo / 5) * 0.5;
    const od = this.overdrive > 0 ? 2 : 1;
    const gain = Math.round((e.T.base + e.word.length * 4) * mult * od * (this.x2 > 0 ? 2 : 1));
    this.addScore(gain);
    fireLaser(e); FX.explosion(e.x, e.y, e.glow);
    FX.text('+' + gain, e.x, e.y - 10, '#7CFF4F');
    if (this.combo >= 3) FX.text('x' + this.combo, e.x, e.y - 32, '#ffd23f', 13);
    if (e.mistakes === 0 && e.word.length >= 4){
      this.perfect++; this.addFocus(CONFIG.focusPerWord);
      FX.text('PERFECT', e.x, e.y - 52, '#39e0ff', 12); Audio.perfect();
    }
    this.addFocus(CONFIG.focusPerWord);
    Audio.shoot(); Audio.boom(); this.shake = Math.min(9, 3 + this.combo * 0.3);

    if (e.type === 'bonus'){
      if (this.shields < this.maxShields){ this.shields++; FX.text('+ESCUDO', e.x, e.y - 72, '#39e0ff', 13); Audio.shield(); }
      else { this.addFocus(40); FX.text('+FOCUS', e.x, e.y - 72, '#c46bff', 13); }
    }
    if (e.type === 'power') this.applyPower(e);
    e.dead = true; active = null; this.wordsDone++; this.enemiesDestroyed++;

    if (this.enemiesDestroyed >= this.level * CONFIG.enemiesPerWave){
      this.level++; Audio.musicLevel(this.level); Audio.level();
      banner('OLEADA ' + this.level, '#ffd23f');
    }
  },

  tryOverdrive(){
    if (this.state !== 'playing' || this.overdrive > 0 || this.focus < CONFIG.focusMax) return;
    this.overdrive = CONFIG.overdriveDur; this.focus = 0;
    banner('OVERDRIVE', '#c46bff'); Audio.overdrive();
  },

applyPower(e){
    if (e.power === 'shield'){
      if (this.shields < this.maxShields){ this.shields++; banner('+1 ESCUDO', '#39e0ff'); Audio.shield(); }
      else { this.addFocus(40); banner('+ FOCUS', '#c46bff'); }
    } else if (e.power === 'clear'){
      for (const en of enemies){ if (!en.dead && en !== e){ FX.explosion(en.x, en.y, en.glow); en.dead = true; } }
      banner('PANTALLA LIMPIA', '#ff2d95'); Audio.boom();
    } else if (e.power === 'focus'){
     this.focus = CONFIG.focusMax; banner('ENERGIA LLENA', '#c46bff');
    } else if (e.power === 'freeze'){
      this.freeze = 3.5; banner('CONGELADO', '#39e0ff');
    } else if (e.power === 'x2'){
      this.x2 = 8; banner('x2 PUNTOS', '#ffd23f');
    }
  },

  damage(e){
    this.shields--; this.combo = 0; this.damageFlash = 0.5; this.shake = 12;
    FX.explosion(e.x, e.y, '#ff2d95'); Audio.hurt();
    if (active === e) active = null; e.dead = true;
    if (this.shields <= 0) this.gameOver();
  },

  gameOver(){
    this.state = 'over'; Audio.musicOn(false); Audio.over(); this.shake = 14;
    const acc = this.totalKeys > 0 ? Math.round((this.correctChars / this.totalKeys) * 100) : 100;
    const prevBest = Storage.get('nt_best_' + this.diff, 0), prevWpm = Storage.get('nt_bestwpm_' + this.diff, 0);
    const newBest = this.score > prevBest, newWpm = this.wpm > prevWpm;
    if (newBest) Storage.set('nt_best_' + this.diff, this.score);
    if (newWpm) Storage.set('nt_bestwpm_' + this.diff, this.wpm);
    Storage.set('nt_plays', Storage.get('nt_plays', 0) + 1);
    const html =
      (newBest ? '<div class="newbest">¡NUEVO RECORD!</div>' : '') +
      'SCORE&nbsp;&nbsp;<span' + (newBest ? ' class="newbest"' : '') + '>' + this.score + '</span><br>' +
      'OLEADA&nbsp;&nbsp;<span class="c">' + this.level + '</span>&nbsp;·&nbsp;WPM&nbsp;&nbsp;<span class="c' + (newWpm ? ' newbest' : '') + '">' + this.wpm + '</span><br>' +
      'PRECISION&nbsp;&nbsp;<span>' + acc + '%</span>&nbsp;·&nbsp;PERFECT&nbsp;&nbsp;<span>' + this.perfect + '</span><br>' +
      'MEJOR&nbsp;COMBO&nbsp;&nbsp;<span>x' + this.bestCombo + '</span>&nbsp;·&nbsp;RECORD&nbsp;&nbsp;<span class="c">' + Math.max(prevBest, this.score) + '</span>';
    showGameOver(html, { score: this.score, wave: this.level, wpm: this.wpm, accuracy: acc, diff: this.diff });
  },

  update(dt){
    // overdrive: interpolar el factor de tiempo de los enemigos
    const targetTime = this.overdrive > 0 ? CONFIG.overdriveSlow : 1;
    this.enemyTime = lerp(this.enemyTime, targetTime, 0.1);
    if (this.overdrive > 0){ this.overdrive -= dt; if (this.overdrive < 0) this.overdrive = 0; }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 1.8);

    Stars.update(dt, this.overdrive > 0);
    FX.update(dt);
    for (const l of lasers) l.t -= dt;
    for (let i = lasers.length - 1; i >= 0; i--) if (lasers[i].t <= 0) lasers.splice(i, 1);

    if (this.state !== 'playing') return;

    if (this.freeze > 0) this.freeze = Math.max(0, this.freeze - dt);
    if (this.x2 > 0) this.x2 = Math.max(0, this.x2 - dt);
    if (this.combo > 0){ this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }

    Director.update(dt, this.level, this.diff);

    const defY = view.H - CONFIG.defensePad, et = this.enemyTime;
    for (const e of enemies){
      e.y += e.speed * dt * et; e.bob += dt * 4; e.errorT = Math.max(0, e.errorT - dt);
      if (e.y >= defY){
        if (e.type === 'bonus' || e.type === 'power'){ e.dead = true; }       // bonus perdido: sin castigo
        else { this.damage(e); if (this.state !== 'playing') return; }
      }
    }
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
    if (active && active.dead) active = null;

    // la nave apunta al objetivo activo
    const px = view.W / 2, py = view.H - CONFIG.shipY;
    const tgt = active ? Math.atan2(active.y - py, active.x - px) : -Math.PI / 2;
    shipAngle = lerpAngle(shipAngle, tgt, 0.22);

    // WPM en vivo
    const min = (performance.now() - this.startTime) / 60000;
    this.wpm = min > 0.02 ? Math.round((this.correctChars / 5) / min) : 0;
  }
};
