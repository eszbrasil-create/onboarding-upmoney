// src/services/onboardingService.js
import { supabase } from "../supabaseClient";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  const e = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Salva (upsert) por e-mail.
 * Tabela: public.onboarding_questionnaire
 * Colunas: email (text not null), answers (jsonb not null)
 *
 * IMPORTANTE:
 * - Precisa ter UNIQUE no campo email para o upsert funcionar.
 */
export async function saveOnboardingByEmail(answers, email) {
  if (!answers || typeof answers !== "object") {
    throw new Error("answers inválido (precisa ser um objeto).");
  }

  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    throw new Error("E-mail inválido.");
  }

  const payload = {
    email: cleanEmail,
    answers,
  };

  const { data, error } = await supabase
    .from("onboarding_questionnaire")
    .upsert(payload, { onConflict: "email" })
    .select("*")
    .single();

  if (error) {
    console.error("[saveOnboardingByEmail] Supabase error:", error);
    throw error;
  }

  return data;
}

/** Compatibilidade se você chama saveOnboarding(...) no App */
export async function saveOnboarding(answers, email) {
  return saveOnboardingByEmail(answers, email);
}
