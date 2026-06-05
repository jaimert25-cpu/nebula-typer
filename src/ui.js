// =====================================================================
// ui.js — INTERFAZ (solo DOM)
// Funciones "tontas" que solo tocan el HTML: HUD, banners, countdown,
// pantallas. Reciben los datos por parametro (ej. updateHUD(Game)) y NO
// importan game.js, para mantener el flujo en una sola direccion.
// =====================================================================

import { CONFIG } from './config.js';
import { Audio } from './audio.js';
import { Storage } from './storage.js';
import { supabaseReady, submitScore, topScores } from './leaderboard.js';

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
function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}
function renderLBMsg(msg){ document.getElementById('lbList').innerHTML = '<div class="lbMsg">' + msg + '</div>'; }
async function renderLB(highlight){
  const rows = await topScores(10);
  if (!rows.length){ renderLBMsg('Aun no hay puntajes. ¡Se el primero! 🚀'); return; }
  let html = '<div class="lbHead"><span>#</span><span>NOMBRE</span><span>SCORE</span><span>OLA</span></div>';
  rows.forEach((r, i) => {
    const me = (highlight && r.name === highlight) ? ' me' : '';
    html += '<div class="lbRow' + me + '"><span>' + (i + 1) + '</span><span>' +
            escapeHtml(r.name) + '</span><span>' + r.score + '</span><span>' + r.wave + '</span></div>';
  });
  document.getElementById('lbList').innerHTML = html;
}

export function showGameOver(html, run){
  $('overStats').innerHTML = html;
  showScreen('over');

  const section = $('lbSection');
  // Sin Supabase configurado: ocultamos el leaderboard, el juego sigue normal
  if (!supabaseReady){ section.style.display = 'none'; return; }
  section.style.display = '';

  const input = $('nameInput'), submitBtn = $('submitBtn');
  input.value = Storage.get('nt_name', '');
  submitBtn.disabled = false; submitBtn.textContent = 'ENVIAR';
  renderLBMsg('Cargando…');
  renderLB();                       // muestra el top actual mientras tanto
  try { input.focus(); } catch (e) {}
  input.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); submitBtn.click(); } };

  let done = false;
  submitBtn.onclick = async () => {
    if (done) return;
    const name = ((input.value || 'ANON').trim().toUpperCase().slice(0, 12)) || 'ANON';
    Storage.set('nt_name', name);
    submitBtn.disabled = true; submitBtn.textContent = 'ENVIANDO…';
    const res = await submitScore({ name, score: run.score, wave: run.wave, wpm: run.wpm, accuracy: run.accuracy });
    if (res.ok){ done = true; submitBtn.textContent = '¡ENVIADO!'; await renderLB(name); }
    else { submitBtn.disabled = false; submitBtn.textContent = 'REINTENTAR'; renderLBMsg('Error al enviar: ' + res.error); }
  };
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
