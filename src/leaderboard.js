// =====================================================================
// leaderboard.js — PUENTE CON SUPABASE
// El "traductor" entre el juego y la base de datos en la nube.
// - submitScore(): envia un puntaje a la tabla `scores`
// - topScores():   trae los mejores puntajes para mostrarlos
// Las credenciales NO van aqui escritas: se leen de variables de entorno
// (.env) que Vite expone solo si empiezan con VITE_. Asi las llaves no
// terminan publicadas en GitHub.
// =====================================================================

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las credenciales, el juego sigue funcionando sin leaderboard.
export const supabaseReady = !!(url && key);
const supabase = supabaseReady ? createClient(url, key) : null;

export async function submitScore(entry){
  if (!supabase) return { ok: false, error: 'Supabase no configurado' };
  try {
    const { error } = await supabase.from('scores').insert({
      name: entry.name,
      score: entry.score,
      wave: entry.wave,
      wpm: entry.wpm,
      accuracy: entry.accuracy
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function topScores(limit = 10){
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('name,score,wave,wpm,created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}
