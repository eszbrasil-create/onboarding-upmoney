// src/services/onboardingService.js
import { supabase } from "../supabaseClient";

/**
 * Salva respostas do onboarding para o usuário logado.
 * Tabela esperada: public.onboarding_responses
 * Colunas: user_id (uuid), answers (jsonb)
 */
export async function saveOnboarding(answers) {
  // Pega usuário logado
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData?.user;
  if (!user?.id) {
    // Se o app não tiver login, não tem como linkar ao mesmo user_id
    throw new Error("Usuário não autenticado. Não foi possível salvar.");
  }

  const payload = {
    user_id: user.id,
    answers, // jsonb
    updated_at: new Date().toISOString(),
  };

  // ✅ Opção A: INSERT simples (1 linha por preenchimento)
  // Se quiser virar 1 por usuário, depois a gente troca para UPSERT (Opção B)
  const { data, error } = await supabase
    .from("onboarding_responses")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}
