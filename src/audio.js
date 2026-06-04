// =====================================================================
// audio.js — SONIDO
// Todo es generado por codigo con la Web Audio API (cero archivos .mp3):
// efectos (tecleo, disparo, explosion...) y una musica generativa que
// sube de intensidad por nivel. Mute persistente.
// =====================================================================

import { Storage } from './storage.js';

export const Audio = (() => {
  let ac = null, master = null, muted = Storage.get('nt_muted', false);

  // --- musica generativa (arpegio + bajo) ---
  const Music = {
    bus: null, filter: null, next: 0, i: 0, tempo: 2.2, root: 55,
    steps: [0, 3, 5, 7, 10, 12, 10, 7, 5, 3],
    ensure(){
      if (!ac || this.bus) return;
      this.bus = ac.createGain(); this.bus.gain.value = 0;
      this.filter = ac.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 1100;
      this.bus.connect(this.filter); this.filter.connect(master);
      this.next = ac.currentTime + 0.1;
    },
    setLevel(l){ this.tempo = 2.0 + l * 0.14;
      if (this.filter) this.filter.frequency.setTargetAtTime(900 + l * 90, ac.currentTime, 1); },
    on(playing){ if (this.bus) this.bus.gain.setTargetAtTime(playing ? 0.16 : 0, ac.currentTime, 0.6); },
    tick(){
      if (!ac || !this.bus) return;
      const spb = 1 / this.tempo;
      while (this.next < ac.currentTime + 0.12){
        const t = this.next, off = this.steps[this.i % this.steps.length];
        this.voice(this.root * 4 * Math.pow(2, off / 12), t, spb * 0.9, 'triangle', 0.09, this.bus);
        if (this.i % 4 === 0)
          this.voice(this.root * Math.pow(2, (this.i % 8 < 4 ? 0 : 5) / 12), t, spb * 3.6, 'sawtooth', 0.07, this.filter);
        this.i++; this.next += spb;
      }
    },
    voice(f, t, dur, type, vol, dest){
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.04);
    }
  };

  function init(){
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    Music.ensure();
  }
  function resume(){ if (ac && ac.state === 'suspended') ac.resume(); }

  function blip(freq, dur, type, vol){
    if (!ac) return; const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.12, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function sweep(f1, f2, dur, type, vol){
    if (!ac) return; const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sawtooth';
    o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol || 0.14, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol){
    if (!ac) return; const t = ac.currentTime;
    const len = ac.sampleRate * dur, b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ac.createBufferSource(); s.buffer = b;
    const f = ac.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(180, t + dur);
    const g = ac.createGain(); g.gain.value = vol || 0.3;
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
  }

  return {
    init, resume,
    get muted(){ return muted; },
    isReady(){ return !!ac; },
    setMuted(m){ muted = m; Storage.set('nt_muted', m);
      if (master && ac) master.gain.setTargetAtTime(m ? 0 : 0.5, ac.currentTime, 0.1); },
    tickMusic(){ Music.tick(); },
    musicLevel(l){ Music.setLevel(l); },
    musicOn(p){ Music.on(p); },
    type(prog){ blip(520 + prog * 440, 0.05, 'square', 0.05); },
    shoot(){ sweep(900, 180, 0.16, 'sawtooth', 0.1); },
    boom(){ noise(0.32, 0.3); blip(80, 0.2, 'square', 0.16); },
    error(){ blip(120, 0.12, 'sawtooth', 0.1); },
    perfect(){ blip(1320, 0.12, 'square', 0.12); blip(1760, 0.12, 'square', 0.1); },
    shield(){ blip(660, 0.1, 'sine', 0.16); blip(990, 0.12, 'sine', 0.14); },
    hurt(){ noise(0.25, 0.35); blip(160, 0.25, 'sawtooth', 0.18); },
    level(){ [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'square', 0.12), i * 70)); },
    overdrive(){ sweep(300, 1400, 0.5, 'sawtooth', 0.18); },
    over(){ [440, 392, 330, 262].forEach((f, i) => setTimeout(() => blip(f, 0.28, 'square', 0.14), i * 150)); }
  };
})();
