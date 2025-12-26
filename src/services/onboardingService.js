// src/services/onboardingService.js
import { supabase } from "../supabaseClient";

/**
 * Salva respostas do onboarding (sem login) garantindo 1 linha por sessão.
 * Tabela: public.onboarding_questionnaire
 * Colunas: id (uuid), session_id (text UNIQUE), email (text), answers (jsonb), created_at (timestamptz)
 */
function getOrCreateSessionId() {
  const KEY = "onboarding_session_id";

  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;

    const newId =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(KEY, newId);
    return newId;
  } catch {
    // fallback (caso localStorage bloqueado)
    return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

export async function saveOnboarding(answers, email = null) {
  if (!answers || typeof answers !== "object") {
    throw new Error("answers inválido: esperado um objeto com as respostas.");
  }

  const session_id = getOrCreateSessionId();

  const payload = {
    session_id,
    email,   // pode ser null
    answers, // jsonb
  };

  const { data, error } = await supabase
    .from("onboarding_questionnaire")
    .upsert(payload, { onConflict: "session_id" })
    .select("*")
    .single();

  if (error) {
    console.error("[saveOnboarding] Supabase error:", error);
    throw error;
  }

  return data;
}
