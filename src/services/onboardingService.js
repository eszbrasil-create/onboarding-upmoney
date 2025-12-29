// src/services/onboardingService.js
import { supabase } from "../supabaseClient";

/**
 * Opção B (sem Auth/OTP):
 * - 1 linha por e-mail
 * - sempre sobrescreve o último questionário desse e-mail
 *
 * Tabela (projeto novo): public.onboarding_questionnaire
 * Colunas:
 * - id (uuid)
 * - email (text)  [UNIQUE]
 * - answers (jsonb)
 * - created_at (timestamptz)
 */

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return typeof email === "string" && email.includes("@") && email.includes(".");
}

/**
 * Salva (upsert) as respostas pelo e-mail.
 * - Se o e-mail já existe => atualiza answers (sobrescreve)
 * - Se não existe => cria a linha
 */
export async function saveOnboardingByEmail(answers, email) {
  if (!answers || typeof answers !== "object") {
    throw new Error("answers inválido: esperado um objeto com as respostas.");
  }

  const cleanEmail = normalizeEmail(email);
  if (!isValidEmail(cleanEmail)) {
    throw new Error("E-mail inválido.");
  }

  // ⚠️ IMPORTANTE: só mandar campos que EXISTEM na tabela
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

/**
 * Compatibilidade:
 * Caso você ainda chame saveOnboarding(answers, email) no App.jsx
 */
export async function saveOnboarding(answers, email) {
  if (!email) {
    throw new Error("E-mail obrigatório para salvar (opção B por e-mail).");
  }
  return saveOnboardingByEmail(answers, email);
}
