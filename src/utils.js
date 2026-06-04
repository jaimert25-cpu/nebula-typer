// =====================================================================
// utils.js — HELPERS PUROS
// Funciones pequenas y reutilizables (matematicas y de dibujo).
// No guardan estado: misma entrada -> misma salida.
// =====================================================================

import { ctx } from './viewport.js';
import { WORDS } from './config.js';

export const rand  = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp  = (a, b, t) => a + (b - a) * t;
export const easeOut = t => 1 - Math.pow(1 - t, 3);

export function lerpAngle(a, b, t){
  let d = b - a;
  while (d > Math.PI) d -= 6.283;
  while (d < -Math.PI) d += 6.283;
  return a + d * t;
}

export function roundRect(x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function pickWordByLen(min, max){
  let pool = WORDS.filter(w => w.length >= min && w.length <= max);
  if (pool.length < 5) pool = WORDS.filter(w => w.length <= max);
  if (pool.length === 0) pool = WORDS;
  return pool[(Math.random() * pool.length) | 0];
}
