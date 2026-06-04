// =====================================================================
// fx.js — EFECTOS
// Particulas (chispas, anillos, explosiones) y textos flotantes.
// Usa OBJECT POOLING: reutiliza un arreglo fijo de objetos en vez de
// crear/destruir constantemente, asi el recolector de basura no causa
// tirones en el framerate.
// =====================================================================

import { ctx } from './viewport.js';
import { rand, clamp } from './utils.js';

export const FX = (() => {
  const MAX = 600;
  const pool = [];
  for (let i = 0; i < MAX; i++) pool.push({ active: false });
  const floats = [];

  function obtain(){
    for (let i = 0; i < MAX; i++) if (!pool[i].active) return pool[i];
    return pool[0];
  }
  function spark(x, y, color, n, spd){
    n = n || 6;
    for (let i = 0; i < n; i++){
      const p = obtain(), a = rand(0, 6.283), s = rand(spd * 0.4, spd);
      p.active = true; p.ring = false; p.x = x; p.y = y;
      p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = rand(.25, .6); p.max = .6; p.size = rand(1.4, 3.4);
      p.color = Math.random() < .5 ? color : '#fff';
    }
  }
  function ring(x, y, color){
    const p = obtain();
    p.active = true; p.ring = true; p.x = x; p.y = y; p.r = 6;
    p.vr = rand(200, 300); p.life = .38; p.max = .38; p.color = color;
  }
  function explosion(x, y, color){ spark(x, y, color, 22, 280); ring(x, y, color); }
  function text(txt, x, y, color, size){
    floats.push({ txt, x, y, vy: -46, life: 1, max: 1, color: color || '#fff', size: size || 16 });
  }
  function update(dt){
    for (let i = 0; i < MAX; i++){
      const p = pool[i]; if (!p.active) continue;
      p.life -= dt; if (p.life <= 0){ p.active = false; continue; }
      if (p.ring) p.r += p.vr * dt;
      else { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
    }
    for (const f of floats){ f.y += f.vy * dt; f.life -= dt * 0.9; }
    for (let i = floats.length - 1; i >= 0; i--) if (floats[i].life <= 0) floats.splice(i, 1);
  }
  function draw(){
    ctx.globalCompositeOperation = 'lighter';   // glow aditivo barato
    for (let i = 0; i < MAX; i++){
      const p = pool[i]; if (!p.active) continue;
      const a = clamp(p.life / p.max, 0, 1);
      if (p.ring){ ctx.globalAlpha = a * 0.8; ctx.strokeStyle = p.color; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.stroke(); }
      else { ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  function drawFloats(){
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const f of floats){
      ctx.globalAlpha = clamp(f.life / f.max, 0, 1);
      ctx.font = '900 ' + f.size + 'px Orbitron,sans-serif'; ctx.fillStyle = f.color;
      ctx.shadowColor = f.color; ctx.shadowBlur = 10; ctx.fillText(f.txt, f.x, f.y); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
  function clear(){ for (const p of pool) p.active = false; floats.length = 0; }

  return { spark, ring, explosion, text, update, draw, drawFloats, clear };
})();
