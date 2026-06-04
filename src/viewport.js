// =====================================================================
// viewport.js — EL LIENZO
// Posee el canvas, el contexto 2D y las dimensiones (view). El juego se
// ajusta a la ZONA VISIBLE real usando la VisualViewport API: en celular,
// cuando el teclado se abre, esa zona se encoge y el juego se acomoda
// arriba del teclado en vez de quedar tapado.
// =====================================================================

export const canvas = document.getElementById('scene');
export const ctx = canvas.getContext('2d');

export const view = { W: 0, H: 0, dpr: 1, scale: 1, wordPx: 22 };

export function resize(){
  const stage = document.getElementById('stage');
  const vv = window.visualViewport;            // zona visible (sin teclado)
  const w = vv ? vv.width  : window.innerWidth;
  const h = vv ? vv.height : window.innerHeight;

  view.dpr = Math.min(2, window.devicePixelRatio || 1);
  view.W = Math.max(280, w);
  view.H = Math.max(240, h);

  // Acomodar el contenedor a la zona visible (clave en movil)
  stage.style.left   = (vv ? vv.offsetLeft : 0) + 'px';
  stage.style.top    = (vv ? vv.offsetTop  : 0) + 'px';
  stage.style.right  = 'auto';
  stage.style.bottom = 'auto';
  stage.style.width  = view.W + 'px';
  stage.style.height = view.H + 'px';

  canvas.width  = view.W * view.dpr;
  canvas.height = view.H * view.dpr;
  canvas.style.width  = view.W + 'px';
  canvas.style.height = view.H + 'px';
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

  view.scale = view.H / 720;
  view.wordPx = Math.round(Math.min(26, Math.max(16, view.H * 0.030)));
}

window.addEventListener('resize', resize);
// La VisualViewport avisa cuando el teclado abre/cierra o la pagina se desplaza
if (window.visualViewport){
  window.visualViewport.addEventListener('resize', resize);
  window.visualViewport.addEventListener('scroll', resize);
}
