// src/services/onboardingService.js
import { supabase } from "../supabaseClient";

/**
 * Salva respostas do onboarding (sem login).
 * Tabela esperada: public.onboarding_questionnaire
 * Colunas: id (uuid), email (text), answers (jsonb), created_at (timestamptz)
 *
 * - email é opcional (pode ser null)
 * - answers é o objeto inteiro do fluxo
 */
export async function saveOnboarding(answers, email = null) {
  if (!answers || typeof answers !== "object") {
    throw new Error("answers inválido: esperado um objeto com as respostas.");
  }

  const payload = {
    email,   // pode ser null
    answers, // jsonb
  };

  const { data, error } = await supabase
    .from("onboarding_questionnaire")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    // Ajuda a debugar no console
    console.error("[saveOnboarding] Supabase error:", error);
    throw error;
  }

  return data;
}
