// =====================================================================
// leaderboard.js - PUENTE CON SUPABASE (por dificultad)
// submitScore() envia un puntaje (con su dificultad) a la tabla `scores`.
// topScores(diff) trae los mejores de esa dificultad para mostrarlos.
// Las credenciales se leen de variables de entorno (VITE_...) por .env.
// =====================================================================
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
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
      accuracy: entry.accuracy,
      difficulty: entry.diff
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function topScores(diff, limit = 10){
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('name,score,wave,wpm,created_at')
      .eq('difficulty', diff)
      .order('score', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}