// =====================================================================
// render.js — DIBUJADO
// Pinta la escena leyendo el estado, pero NO lo modifica. Render no
// conoce las reglas; solo traduce estado -> pixeles. Esa separacion es
// lo que mas adelante hace testeable la logica del juego.
// =====================================================================

import { ctx, view } from './viewport.js';
import { CONFIG } from './config.js';
import { rand, roundRect } from './utils.js';
import { FX } from './fx.js';
import { Stars } from './stars.js';
import { enemies } from './enemies.js';
import { Game, active, shipAngle, lasers } from './game.js';

// --- PLANETA (representa tus vidas) ---------------------------------
// Posiciones FIJAS para que el dano no parpadee entre frames.
// Cada numero es un angulo (radianes) sobre la curva visible del planeta.
const PLANET_LAND   = [[-0.5, 0.17, 0.3], [0.42, 0.13, -0.4], [0.02, 0.11, 0.1], [-0.92, 0.10, 0.6]];
const PLANET_SCORCH = [-0.7, 0.55, -0.15, 0.95, -1.0, 0.25, 0.82, -0.42];
const PLANET_CRACK  = [-0.55, 0.66, -0.05, 1.0, -0.9, 0.34];

function drawPlanet(){
  if (!Game.maxShields) return;
  const r = Math.max(0, Math.min(1, Game.shields / Game.maxShields)); // 1 = sano, 0 = destruido
  const dmg = 1 - r;
  const R = view.W * 0.95;
  const cx = view.W / 2;
  const cy = view.H + R - Math.max(80, view.H * 0.14);  // solo asoma la parte de arriba (el "horizonte")
  const lerp = (a, b) => Math.round(a + (b - a) * dmg);

  ctx.save();

  // cuerpo + atmosfera (el halo se apaga conforme muere)
  ctx.shadowColor = 'rgba(' + lerp(90,170) + ',' + lerp(200,80) + ',' + lerp(255,60) + ',1)';
  ctx.shadowBlur = 8 + 34 * r;
  const g = ctx.createRadialGradient(cx, cy - R + R * 0.18, R * 0.08, cx, cy, R);
  g.addColorStop(0,   'rgb(' + lerp(80,95)  + ',' + lerp(195,58) + ',' + lerp(225,52) + ')');
  g.addColorStop(0.6, 'rgb(' + lerp(30,45)  + ',' + lerp(95,26)  + ',' + lerp(150,28) + ')');
  g.addColorStop(1,   'rgb(' + lerp(10,20)  + ',' + lerp(40,10)  + ',' + lerp(80,14)  + ')');
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;

  // recortar al disco para que continentes/grietas no se salgan
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

  // continentes (se apagan con el dano)
  ctx.globalAlpha = 0.5 - 0.35 * dmg;
  ctx.fillStyle = 'rgb(' + lerp(40,42) + ',' + lerp(120,42) + ',' + lerp(80,38) + ')';
  for (const c of PLANET_LAND){
    const lx = cx + R * Math.sin(c[0]), ly = cy - R * Math.cos(c[0]);
    ctx.beginPath(); ctx.ellipse(lx, ly, R * c[1], R * c[1] * 0.6, c[2], 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // manchas quemadas (aparecen segun el dano)
  const nS = Math.round(dmg * PLANET_SCORCH.length);
  for (let i = 0; i < nS; i++){
    const th = PLANET_SCORCH[i];
    const sx = cx + R * Math.sin(th), sy = cy - R * Math.cos(th), rad = R * 0.11;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
    sg.addColorStop(0, 'rgba(16,6,4,.96)'); sg.addColorStop(1, 'rgba(16,6,4,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();
  }

  // grietas encendidas (aparecen segun el dano; laten y brillan al recibir golpe)
  const nC = Math.round(dmg * PLANET_CRACK.length);
  const pulse = Math.min(1, 0.55 + 0.35 * Math.sin(performance.now() / 220) + Game.damageFlash);
  for (let i = 0; i < nC; i++){
    const th = PLANET_CRACK[i];
    let zx = cx + R * Math.sin(th), zy = cy - R * Math.cos(th);
    ctx.save(); ctx.shadowColor = '#ff7b2d'; ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(255,140,40,' + pulse + ')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(zx, zy);
    for (let k = 1; k <= 6; k++){ zx += (k % 2 ? 9 : -9); zy += 15; ctx.lineTo(zx, zy); }
    ctx.stroke(); ctx.restore();
  }

  ctx.restore();
}

function drawEnemies(){
  ctx.textBaseline = 'middle';
  for (const e of enemies){
    const isA = (e === active), bob = Math.sin(e.bob) * 2;

    // emoji: el jefe se dibuja MUCHO mas grande (80px) y centrado
    ctx.save(); ctx.shadowColor = e.glow; ctx.shadowBlur = isA ? 22 : 12;
    if (e.type === 'boss'){ ctx.textAlign = 'center'; ctx.font = '80px serif'; }
    ctx.fillText(e.emoji, e.x, e.y - view.wordPx - 6 + bob); ctx.restore();

    // barra de vida del jefe (un segmento por palabra restante)
    if (e.type === 'boss'){
      const gap = 4, sw = 26, sh = 6, totalW = e.maxhp * sw + (e.maxhp - 1) * gap;
      let hx = e.x - totalW / 2; const hy = e.y - view.wordPx - 92;
      for (let s = 0; s < e.maxhp; s++){
        ctx.fillStyle = (s < e.hp) ? '#ff5d2d' : 'rgba(255,93,45,.22)';
        ctx.fillRect(hx, hy, sw, sh); hx += sw + gap;
      }
    }

    ctx.font = '700 ' + view.wordPx + 'px "Share Tech Mono",monospace'; ctx.textAlign = 'left';
    const w = ctx.measureText(e.word).width, padX = 10, h = view.wordPx + 10, bx = e.x - w / 2 - padX, by = e.y - h / 2;
    if (e.type === 'power'){
      const pt = performance.now() / 1000, pulse = 0.5 + 0.5 * Math.sin(pt * 6 + e.bob), m = 6 + 4 * pulse;
      ctx.save();
      ctx.shadowColor = e.glow; ctx.shadowBlur = 16 + 16 * pulse;
      ctx.strokeStyle = e.glow; ctx.lineWidth = 2 + 1.5 * pulse; ctx.globalAlpha = 0.55 + 0.4 * pulse;
      roundRect(bx - m, by - m, w + padX * 2 + m * 2, h + m * 2, 11);
      ctx.stroke();
      ctx.restore();
    }
    roundRect(bx, by, w + padX * 2, h, 7);
    ctx.fillStyle = e.errorT > 0 ? 'rgba(60,10,30,.95)' : (isA ? 'rgba(6,26,36,.94)' : 'rgba(8,12,28,.8)'); ctx.fill();
    ctx.lineWidth = 2;
    if (isA){ ctx.shadowColor = '#39e0ff'; ctx.shadowBlur = 14; ctx.strokeStyle = '#39e0ff'; }
    else { ctx.shadowBlur = 0; ctx.strokeStyle = e.errorT > 0 ? '#ff2d95' : e.glow; ctx.globalAlpha = e.type === 'normal' ? 0.45 : 0.75; }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;

    let cx = e.x - w / 2;
    for (let i = 0; i < e.word.length; i++){
      const ch = e.word[i], cw = ctx.measureText(ch).width;
      if (isA && i < e.typed) ctx.fillStyle = '#7CFF4F';
      else if (isA && i === e.typed) ctx.fillStyle = '#ffd23f';
      else ctx.fillStyle = e.errorT > 0 ? '#ff9bbf' : '#dfe7ff';
      ctx.fillText(ch, cx, e.y); cx += cw;
    }
  }
}

function drawShip(){
  const px = view.W / 2, py = view.H - CONFIG.shipY, od = Game.overdrive > 0;
  if (active){
    ctx.save(); ctx.setLineDash([4, 8]); ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(57,224,255,.3)';
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(active.x, active.y); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.translate(px, py); ctx.rotate(shipAngle);
  const fl = 0.6 + Math.random() * 0.4;
  ctx.fillStyle = '#ffb13f'; ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(-12 - 14 * fl, 0); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff7d0'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-12 - 8 * fl, 0); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1b6fa0';
  ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-14, -16); ctx.lineTo(-8, -4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(-14, 16); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill();
  ctx.shadowColor = od ? '#c46bff' : '#39e0ff'; ctx.shadowBlur = 16; ctx.fillStyle = od ? '#c46bff' : '#39e0ff';
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -11); ctx.lineTo(-7, 0); ctx.lineTo(-12, 11); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#eafcff'; ctx.beginPath(); ctx.arc(2, 0, 3.2, 0, 6.3); ctx.fill();
  ctx.restore();
}

function drawLasers(){
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const l of lasers){
    const a = l.t / 0.16; ctx.globalAlpha = a;
    ctx.strokeStyle = '#39e0ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

function drawDefenseLine(){
  if (Game.state !== 'playing' && Game.state !== 'paused') return;
  const y = view.H - CONFIG.defensePad;
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(performance.now() / 300);
  ctx.strokeStyle = '#ff2d95'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(view.W, y); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}

export function render(){
  const W = view.W, H = view.H;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (Game.shake > 0) ctx.translate(rand(-Game.shake, Game.shake), rand(-Game.shake, Game.shake));

  const g = ctx.createRadialGradient(W * 0.72, H * 0.18, 0, W * 0.72, H * 0.18, W * 0.6);
  g.addColorStop(0, 'rgba(140,50,180,.18)'); g.addColorStop(1, 'rgba(140,50,180,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  Stars.draw(Game.overdrive > 0);
  drawPlanet();
  drawDefenseLine();
  drawLasers();
  drawEnemies();
  FX.draw();
  drawShip();
  FX.drawFloats();
  ctx.restore();

  if (Game.overdrive > 0){
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(120,60,200,0.06)';
    ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  }
  if (Game.damageFlash > 0){
    ctx.globalAlpha = Game.damageFlash * 0.5; ctx.fillStyle = '#ff2d95'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }
  const v = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.3, W / 2, H * 0.5, H * 0.8);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}