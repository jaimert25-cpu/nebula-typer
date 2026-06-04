// =====================================================================
// storage.js — PERSISTENCIA
// Guarda records/preferencias en localStorage. Si el navegador lo bloquea
// (modo privado, sandbox), cae a memoria para no romper nunca el juego.
// =====================================================================

export const Storage = (() => {
  let mem = {}, ok = true;
  try {
    const k = '__nt_test';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
  } catch (e) { ok = false; }

  return {
    get(k, def){
      try { if (ok){ const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } }
      catch (e) {}
      return (k in mem) ? mem[k] : def;
    },
    set(k, v){
      try { if (ok){ localStorage.setItem(k, JSON.stringify(v)); return; } } catch (e) {}
      mem[k] = v;
    }
  };
})();
