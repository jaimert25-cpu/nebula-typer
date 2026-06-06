// =====================================================================
// keyboard.js - TECLADO GUIA (mecanografia)
// Modulo autocontenido: inyecta su propio CSS, dibuja un teclado abajo
// del juego, pinta las teclas por dedo e ilumina la tecla SIGUIENTE que
// hay que presionar. Lo deduce del arreglo `enemies` (que letra toca),
// sin tocar la logica del juego. Se oculta en moviles.
// =====================================================================
import { enemies } from './enemies.js';

const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// Colores por dedo (mismos del mapa de mecanografia)
const FC = { pinky:'#b69cff', ring:'#ff9ccf', middle:'#4fe0c2', index:'#ffbf57' };

// Cada tecla: [etiqueta, colorDeDedo]. La letra a-z se deduce de la etiqueta.
function layoutRows(layout){
  const homeLast = layout === 'us' ? [';', FC.pinky] : ['Ñ', FC.pinky];
  return [
    [['Q',FC.pinky],['W',FC.ring],['E',FC.middle],['R',FC.index],['T',FC.index],['Y',FC.index],['U',FC.index],['I',FC.middle],['O',FC.ring],['P',FC.pinky]],
    [['A',FC.pinky],['S',FC.ring],['D',FC.middle],['F',FC.index],['G',FC.index],['H',FC.index],['J',FC.index],['K',FC.middle],['L',FC.ring], homeLast],
    [['Z',FC.pinky],['X',FC.ring],['C',FC.middle],['V',FC.index],['B',FC.index],['N',FC.index],['M',FC.index]]
  ];
}

let root = null, keyMap = {}, enabled = true, hl = [], lastKeys = '';

function injectCSS(){
  if (document.getElementById('kbGuideCSS')) return;
  const s = document.createElement('style');
  s.id = 'kbGuideCSS';
  s.textContent = `
.kbRow{display:flex;gap:10px;justify-content:center;margin:2px 0 8px;flex-wrap:wrap}
.kbLayout,.guideBtn{padding:6px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#bfe9ff;font:600 12px/1 inherit;letter-spacing:1px;cursor:pointer}
.kbLayout.active,.guideBtn.active{border-color:#39e0ff;color:#39e0ff;box-shadow:0 0 12px rgba(57,224,255,.45)}
.guideBtn{display:block;margin:0 auto 14px}
#kbGuide{position:absolute;left:0;right:0;bottom:6px;display:flex;flex-direction:column;align-items:center;gap:5px;pointer-events:none;z-index:6;opacity:.85}
#kbGuide.kb-hidden{display:none}
.kb-row{display:flex;gap:5px;justify-content:center}
.kb-key{width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:6px;font:600 12px/1 "Share Tech Mono",monospace;background:rgba(5,12,20,.12);border:1px solid var(--fc,#789);color:var(--fc,#9ab)}
.kb-space{width:150px;font-size:10px;letter-spacing:1px}
.kb-key.kb-next{background:#39e0ff;color:#00141c;border-color:#39e0ff;box-shadow:0 0 12px rgba(57,224,255,.75)}
`;
  document.head.appendChild(s);
}

function clearHL(){ for (const k of hl) k.classList.remove('kb-next'); hl = []; }

function build(layout){
  injectCSS();
  if (!root){
    root = document.createElement('div');
    root.id = 'kbGuide';
    root.className = 'kb-hidden';
    document.getElementById('stage').appendChild(root);
  }
  root.innerHTML = ''; keyMap = {}; hl = []; lastKeys = '';
  for (const row of layoutRows(layout)){
    const r = document.createElement('div'); r.className = 'kb-row';
    for (const [label, fc] of row){
      const k = document.createElement('div');
      k.className = 'kb-key'; k.textContent = label;
      k.style.setProperty('--fc', fc);
      if (/^[A-Z]$/.test(label)) keyMap[label.toLowerCase()] = k;
      r.appendChild(k);
    }
    root.appendChild(r);
  }
  const sr = document.createElement('div'); sr.className = 'kb-row';
  const sp = document.createElement('div'); sp.className = 'kb-key kb-space'; sp.textContent = 'espacio';
  sr.appendChild(sp); root.appendChild(sr);
}

export const Keyboard = {
  build,
  setLayout(layout){ build(layout); },
  setEnabled(on){ enabled = !!on; },
  update(state){
    if (!root) return;
    const visible = enabled && !isTouch && state === 'playing';
    root.classList.toggle('kb-hidden', !visible);
    if (!visible){ if (lastKeys){ clearHL(); lastKeys = ''; } return; }
    let keys = [];
    const target = enemies.find(e => !e.dead && e.typed > 0);
    if (target){ const c = target.word[target.typed]; if (c) keys = [c]; }
    else { const s = new Set(); for (const e of enemies){ if (!e.dead && e.word) s.add(e.word[0]); } keys = [...s]; }
    const sig = keys.join('');
    if (sig === lastKeys) return;
    clearHL();
    for (const c of keys){ const k = keyMap[c]; if (k){ k.classList.add('kb-next'); hl.push(k); } }
    lastKeys = sig;
  }
};
// ---- Recordatorio de posicion de dedos (menu + pausa) ----
(function mountFingerGuide(){
  if (!document.getElementById('fgGuideCSS')){
    const s = document.createElement('style');
    s.id = 'fgGuideCSS';
    s.textContent = `
.fgGuide{margin:8px auto 4px;max-width:360px;text-align:center}
.fgTitle{font:600 12px/1 inherit;letter-spacing:2px;color:#39e0ff;margin-bottom:7px}
.fgKb{display:flex;flex-direction:column;align-items:center;gap:3px;margin:0 0 8px}
.fgKbRow{display:flex;gap:3px;justify-content:center}
.fgKbKey{width:19px;height:19px;display:flex;align-items:center;justify-content:center;border-radius:4px;border:1px solid #789;font:600 9px/1 "Share Tech Mono",monospace;color:#9ab;background:rgba(5,12,20,.45)}
.fgKbSpace{width:95px}
.fgLegend{display:flex;flex-wrap:wrap;gap:5px 12px;justify-content:center;font-size:10px;color:#9ab;letter-spacing:.5px;margin-bottom:7px}
.fgItem{display:inline-flex;align-items:center;gap:4px}
.fgItem i{width:11px;height:11px;border-radius:3px;display:inline-block}
.fgTip{font-size:11px;line-height:1.5;color:#bcd}
.fgTip b{color:#fff}
`;
    document.head.appendChild(s);
  }
  let kb = '<div class="fgKb">';
  for (const row of layoutRows('latam')){
    kb += '<div class="fgKbRow">';
    for (const [label, fc] of row) kb += `<span class="fgKbKey" style="border-color:${fc};color:${fc}">${label}</span>`;
    kb += '</div>';
  }
  kb += '<div class="fgKbRow"><span class="fgKbKey fgKbSpace">espacio</span></div></div>';

  const items = [['#b69cff','meñique'],['#ff9ccf','anular'],['#4fe0c2','medio'],['#ffbf57','indice'],['#7f93a8','pulgar']];
  const legend = items.map(([c,n]) => `<span class="fgItem"><i style="background:${c}"></i>${n}</span>`).join('');

  const html = `<div class="fgGuide">
    <div class="fgTitle">POSICION DE DEDOS</div>
    ${kb}
    <div class="fgLegend">${legend}</div>
    <div class="fgTip">Indices en <b>F</b> y <b>J</b> (tienen relieve), manos en la fila base, y <b>no mires las manos</b>.</div>
  </div>`;

  for (const id of ['menu','pause']){
    const screen = document.getElementById(id);
    if (screen && !screen.querySelector('.fgGuide')){
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      screen.appendChild(wrap.firstElementChild);
    }
  }
})();