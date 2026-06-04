// =====================================================================
// main.js — PUNTO DE ENTRADA
// Importa el CSS, conecta la entrada (teclado/botones), arranca el loop
// con requestAnimationFrame y arma todo. Es el unico modulo que "cablea"
// las piezas entre si; nadie lo importa a el.
// =====================================================================

import './style.css';
import { resize } from './viewport.js';
import { Stars } from './stars.js';
import { Game } from './game.js';
import { render } from './render.js';
import { updateHUD, setCd, refreshMenuBest } from './ui.js';
import { Audio } from './audio.js';
import { Storage } from './storage.js';

const $ = id => document.getElementById(id);
const ksink = $('ksink');
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function focusSink(){ if (isTouch){ try { ksink.focus({ preventScroll: true }); } catch (e) {} } }

// ----------------------------------------------------- TECLADO
window.addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'Escape' || k === 'p' || k === 'P'){
    if (Game.state === 'playing') Game.pause();
    else if (Game.state === 'paused') Game.resume();
    return;
  }
  if (k === 'm' || k === 'M'){ Audio.init(); Audio.setMuted(!Audio.muted); return; }
  if (k === 'Enter'){
    if (Game.state === 'menu' || Game.state === 'over'){ Game.beginCountdown(); focusSink(); }
    else if (Game.state === 'paused') Game.resume();
    return;
  }
  if (k === ' '){ if (Game.state === 'playing'){ e.preventDefault(); Game.tryOverdrive(); } return; }
  // letras: en desktop aqui; en movil las captura el sink
  if (!isTouch && k.length === 1 && /[a-zA-Z]/.test(k)){ Game.onLetter(k.toLowerCase()); e.preventDefault(); }
}, { passive: false });

// ----------------------------------------------------- MOVIL (sink)
ksink.addEventListener('input', () => {
  if (!isTouch){ ksink.value = ''; return; }
  const v = ksink.value;
  for (const ch of v) if (/[a-zA-Z]/.test(ch)) Game.onLetter(ch.toLowerCase());
  ksink.value = '';
});
$('stage').addEventListener('pointerdown', () => {
  Audio.init(); Audio.resume();
  if (Game.state === 'playing') focusSink();
});

// ----------------------------------------------------- BOTONES
$('startBtn').onclick   = () => { Game.beginCountdown(); focusSink(); };
$('restartBtn').onclick = () => { Game.beginCountdown(); focusSink(); };
$('resumeBtn').onclick  = () => Game.resume();
$('quitBtn').onclick    = () => Game.toMenu();
$('menuBtn').onclick     = () => Game.toMenu();
$('muteBtn').onclick     = () => { Audio.init(); Audio.setMuted(!Audio.muted); $('muteBtn').textContent = Audio.muted ? 'UNMUTE' : 'MUTE'; };

document.querySelectorAll('.diff').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.diff').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); Game.diff = b.dataset.diff; Storage.set('nt_diff', Game.diff);
  };
  b.classList.toggle('active', b.dataset.diff === Game.diff);
});

// primer gesto -> arrancar audio ambiental
function firstGesture(){
  Audio.init(); Audio.resume(); Audio.musicOn(true);
  window.removeEventListener('pointerdown', firstGesture);
  window.removeEventListener('keydown', firstGesture);
}
window.addEventListener('pointerdown', firstGesture);
window.addEventListener('keydown', firstGesture);

// ----------------------------------------------------- LOOP (60fps, dt fijo)
let last = performance.now();
function frame(now){
  let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;

  if (Game.state === 'countdown'){
    Game.cd.t += dt;
    if (Game.cd.t >= 0.7){
      Game.cd.t = 0; Game.cd.i++;
      if (Game.cd.i < Game.steps.length){
        const go = Game.cd.i === Game.steps.length - 1;
        setCd(Game.steps[Game.cd.i], go); Audio.type(go ? 1 : 0);
      } else Game.start();
    }
  }

  Game.update(dt);
  if (Audio.isReady()) Audio.tickMusic();
  render();
  updateHUD(Game);
  requestAnimationFrame(frame);
}

// ----------------------------------------------------- ARRANQUE
resize();
Stars.init();
refreshMenuBest();
requestAnimationFrame(frame);
