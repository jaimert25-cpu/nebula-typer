// =====================================================================
// viewport.js — EL LIENZO
// Posee el canvas, el contexto 2D y las dimensiones (view). Como cambian
// al redimensionar la ventana, los guardamos en un objeto `view` que todos
// los modulos importan y leen en vivo (view.W, view.H, ...). Un objeto
// compartido evita pasar W/H por todos lados.
// =====================================================================

export const canvas = document.getElementById('scene');
export const ctx = canvas.getContext('2d');

export const view = { W: 0, H: 0, dpr: 1, scale: 1, wordPx: 22 };

export function resize(){
  const stage = document.getElementById('stage');
  const r = stage.getBoundingClientRect();
  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  view.W = Math.max(320, r.width);
  view.H = Math.max(400, r.height);
  canvas.width = view.W * view.dpr;
  canvas.height = view.H * view.dpr;
  canvas.style.width = view.W + 'px';
  canvas.style.height = view.H + 'px';
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  view.scale = view.H / 720;
  view.wordPx = Math.round(Math.min(26, Math.max(16, view.H * 0.030)));
}

window.addEventListener('resize', resize);
