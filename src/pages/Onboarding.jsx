import { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * SaveOnboarding
 * - Recebe "answers" do Onboarding.jsx
 * - Pede email (opcional mas recomendado)
 * - Salva em public.onboarding_questionnaire
 *
 * Tabela esperada:
 * public.onboarding_questionnaire (
 *   id uuid default gen_random_uuid() primary key,
 *   email text not null,
 *   answers jsonb not null,
 *   created_at timestamptz default now(),
 *   updated_at timestamptz default now()
 * )
 */
export default function SaveOnboarding({ answers, onBackToStart }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const answersCount = useMemo(() => Object.keys(answers || {}).length, [answers]);

  function isValidEmail(v) {
    // validação simples (boa o suficiente pro onboarding)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).toLowerCase());
  }

  async function handleSave() {
    setErrorMsg("");

    if (!answers || answersCount === 0) {
      setStatus("error");
      setErrorMsg("Não encontrei respostas para salvar. Volte e responda o questionário.");
      return;
    }

    if (!email.trim()) {
      setStatus("error");
      setErrorMsg("Digite seu e-mail para salvar seu questionário.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setStatus("error");
      setErrorMsg("E-mail inválido. Verifique e tente novamente.");
      return;
    }

    try {
      setStatus("saving");

      const payload = {
        email: email.trim().toLowerCase(),
        answers: answers,
      };

      const { error } = await supabase
        .from("onboarding_questionnaire")
        .insert([payload]);

      if (error) throw error;

      setStatus("success");
    } catch (err) {
      console.error("Save onboarding error:", err);
      setStatus("error");
      setErrorMsg(err?.message || "Erro ao salvar. Verifique as permissões da tabela (RLS) e tente novamente.");
    }
  }

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#f6f7fb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 520, background: "white", borderRadius: 16, padding: 16, border: "1px solid #eee" }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Salvar seu questionário</h2>
        <p style={{ marginTop: 0, color: "#444", lineHeight: 1.4 }}>
          Encontramos <b>{answersCount}</b> respostas. Digite seu e-mail para registrar.
        </p>

        {status === "success" ? (
          <div style={{ padding: 12, borderRadius: 12, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46" }}>
            ✅ Respostas salvas com sucesso!
            <div style={{ marginTop: 10 }}>
              <button
                onClick={onBackToStart}
                style={{ padding: "12px 14px", borderRadius: 999, border: "1px solid #ddd", cursor: "pointer" }}
              >
                Voltar ao início
              </button>
            </div>
          </div>
        ) : (
          <>
            <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>Seu e-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: seuemail@dominio.com"
              autoComplete="email"
              inputMode="email"
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #ddd",
                outline: "none",
                marginBottom: 10,
              }}
            />

            {status === "error" && (
              <div style={{ marginBottom: 10, padding: 10, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}>
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={status === "saving"}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 999,
                border: "none",
                background: status === "saving" ? "#9ca3af" : "#111827",
                color: "white",
                cursor: status === "saving" ? "not-allowed" : "pointer",
              }}
            >
              {status === "saving" ? "Salvando..." : "Salvar no Supabase"}
            </button>

            <div style={{ marginTop: 10, display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={onBackToStart}
                style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid #ddd", background: "transparent", cursor: "pointer" }}
              >
                Recomeçar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
