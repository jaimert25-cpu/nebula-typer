// =====================================================================
// stars.js — FONDO PARALLAX
// Tres capas de estrellas a distinta velocidad para dar sensacion de
// profundidad. En overdrive se estiran como rayas de hiperespacio.
// =====================================================================

import { ctx, view } from './viewport.js';
import { rand } from './utils.js';

export const Stars = (() => {
  let arr = [];

  function init(){
    arr = [];
    const layers = [
      { n: 60, sp: 18, sz: 1,   a: .4 },
      { n: 42, sp: 42, sz: 1.6, a: .7 },
      { n: 22, sp: 82, sz: 2.4, a: 1 }
    ];
    for (const L of layers)
      for (let i = 0; i < L.n; i++)
        arr.push({ x: rand(0, view.W), y: rand(0, view.H), sp: L.sp, sz: L.sz, a: L.a });
  }
  function update(dt, boost){
    const m = boost ? 2.4 : 1;
    for (const s of arr){
      s.y += s.sp * view.scale * dt * m;
      if (s.y > view.H){ s.y = -2; s.x = rand(0, view.W); }
    }
  }
  function draw(boost){
    for (const s of arr){
      ctx.globalAlpha = s.a; ctx.fillStyle = '#dfe9ff';
      ctx.fillRect(s.x, s.y, s.sz, boost ? s.sz + 5 : s.sz);
    }
    ctx.globalAlpha = 1;
  }
  return { init, update, draw };
})();
