// =====================================================================
// ui.js — INTERFAZ (solo DOM)
// Funciones "tontas" que solo tocan el HTML: HUD, banners, countdown,
// pantallas. Reciben los datos por parametro (ej. updateHUD(Game)) y NO
// importan game.js, para mantener el flujo en una sola direccion.
// =====================================================================

import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Storage } from './storage.js';

const $ = id => document.getElementById(id);

const el = {
  score: $('score'), wave: $('wave'), wpm: $('wpm'), combo: $('combo'),
  comboM: $('comboMeter').firstElementChild,
  focusM: $('focusMeter').firstElementChild,
  focusHint: $('focusHint'), shields: $('shields'), mute: $('muteTag')
};

const screens = ['menu', 'pause', 'over'];

export function showScreen(id){
  screens.forEach(s => $(s).classList.toggle('hidden', s !== id));
}
export function showCountdown(show){
  $('countdown').style.display = show ? 'flex' : 'none';
}
export function banner(text, color){
  const b = $('banner');
  b.textContent = text; b.style.color = color || '#fff';
  b.style.textShadow = '0 0 24px ' + (color || '#fff');
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
export function setCd(t, go){
  const e = $('cdtext');
  e.textContent = t; e.className = go ? 'go' : '';
  e.style.animation = 'none'; void e.offsetWidth; e.style.animation = 'pop .5s';
}
export function refreshMenuBest(){
  const b = Storage.get('nt_best', 0), w = Storage.get('nt_bestwpm', 0);
  $('menuBest').innerHTML = 'RECORD&nbsp;&nbsp;<span>' + b + '</span>&nbsp;·&nbsp;MEJOR&nbsp;WPM&nbsp;&nbsp;<span>' + w + '</span>';
}
export function showGameOver(html){
  $('overStats').innerHTML = html;
  showScreen('over');
}
export function updateHUD(G){
  el.score.textContent = G.score;
  el.wave.textContent = G.level;
  el.wpm.textContent = G.wpm;
  el.combo.textContent = G.combo > 1 ? ('COMBO x' + G.combo) : '';
  el.comboM.style.width = (G.combo > 0 ? Math.max(0, Math.min(1, G.comboTimer / CONFIG.comboWindow)) * 100 : 0) + '%';
  el.focusM.style.width = (G.focus / CONFIG.focusMax) * 100 + '%';
  if (G.overdrive > 0){ el.focusHint.textContent = 'OVERDRIVE'; el.focusHint.className = 'ready'; }
  else if (G.focus >= CONFIG.focusMax){ el.focusHint.textContent = 'SHIFT ▶'; el.focusHint.className = 'ready'; }
  else { el.focusHint.textContent = 'FOCUS'; el.focusHint.className = ''; }
  let s = '';
  for (let i = 0; i < G.maxShields; i++) s += '<span class="' + (i < G.shields ? '' : 'off') + '">◆</span>';
  el.shields.innerHTML = s;
  el.mute.textContent = 'M · audio ' + (Audio.muted ? 'off' : 'on');
}
