// src/services/onboardingService.js
import { supabase } from "../supabaseClient";

/**
 * Opção B (sem OTP): 1 linha por e-mail, sobrescreve sempre o último questionário.
 *
 * Tabela: public.onboarding_questionnaire
 * Colunas recomendadas:
 * - id (uuid) default gen_random_uuid()
 * - email (text NOT NULL)  <-- com UNIQUE (ideal: UNIQUE em lower(email))
 * - answers (jsonb NOT NULL)
 * - created_at (timestamptz default now())
 * - updated_at (timestamptz default now())
 *
 * IMPORTANTE:
 * - Sem OTP/login, qualquer pessoa pode digitar um e-mail e sobrescrever dados desse e-mail.
 * - Se você quer impedir isso no futuro, aí sim entra Auth (OTP) + RLS.
 */

/** (Opcional) Session id local para debug/backup */
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
    return `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  // validação simples (boa o suficiente pro MVP)
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

  const session_id = getOrCreateSessionId();

  // payload mínimo (você pode remover session_id se não tiver essa coluna)
  const payload = {
    email: cleanEmail,
    answers,
    session_id, // opcional: só se existir coluna na tabela
    updated_at: new Date().toISOString(), // se existir coluna updated_at
  };

  /**
   * onConflict:
   * - Se seu UNIQUE for em (email), use "email"
   * - Se seu UNIQUE for em lower(email), ainda dá certo na prática
   *   se você sempre salvar email em minúsculo (este código salva).
   */
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
 * (Compatibilidade) Caso você ainda chame saveOnboarding(answers, email)
 * em algum lugar do App:
 */
export async function saveOnboarding(answers, email = null) {
  if (!email) {
    throw new Error("E-mail obrigatório para salvar (opção B por e-mail).");
  }
  return saveOnboardingByEmail(answers, email);
}
