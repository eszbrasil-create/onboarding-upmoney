// src/pages/SaveOnboarding.jsx
import { useMemo, useState } from "react";
import { saveOnboardingByEmail } from "../services/onboardingService";

/**
 * SaveOnboarding
 * - Salva o JSON das respostas no Supabase (tabela: onboarding_questionnaire)
 *
 * Props:
 * - answers: objeto com as respostas
 * - onRestart: callback opcional para recomeçar
 */
export default function SaveOnboarding({ answers, onRestart }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const canSave = useMemo(() => {
    return answers && typeof answers === "object" && Object.keys(answers).length > 0;
  }, [answers]);

  async function handleSave() {
    setErrorMsg("");

    if (!canSave) {
      setStatus("error");
      setErrorMsg("Não encontrei respostas para salvar. Volte e preencha o questionário.");
      return;
    }

    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setStatus("error");
      setErrorMsg("Digite seu e-mail para salvar.");
      return;
    }

    setStatus("saving");

    try {
      await saveOnboardingByEmail(answers, cleanEmail);
      setStatus("success");
    } catch (e) {
      // e pode vir como objeto do Supabase: { message, details, hint, code }
      const msg =
        e?.message ||
        e?.details ||
        "Erro ao salvar no Supabase. Verifique RLS/UNIQUE/variáveis do Vercel.";
      setStatus("error");
      setErrorMsg(msg);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f6f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: 18,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Salvar questionário
        </div>

        {!canSave && (
          <div style={{ color: "#b91c1c", marginTop: 10 }}>
            Não encontrei respostas para salvar.
          </div>
        )}

        {status === "success" ? (
          <>
            <div style={{ marginTop: 12, fontSize: 16 }}>✅ Salvo com sucesso!</div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => (onRestart ? onRestart() : window.location.reload())}
                style={{
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                Recomeçar
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 10, color: "#374151", lineHeight: 1.35 }}>
              Informe seu e-mail para salvar e permitir que você atualize o questionário
              depois.
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: "#6b7280" }}>E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@dominio.com"
                inputMode="email"
                autoComplete="email"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>

            {status === "error" && (
              <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 14 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                disabled={status === "saving" || !canSave}
                onClick={handleSave}
                style={{
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  cursor: status === "saving" ? "not-allowed" : "pointer",
                  opacity: status === "saving" ? 0.7 : 1,
                }}
              >
                {status === "saving" ? "Salvando..." : "Salvar agora"}
              </button>
            </div>

            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", color: "#6b7280" }}>
                Ver respostas (debug)
              </summary>
              <pre
                style={{
                  marginTop: 10,
                  background: "#f9fafb",
                  padding: 12,
                  borderRadius: 12,
                  overflow: "auto",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(answers, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
