// src/pages/SaveOnboarding.jsx
import { useMemo, useState } from "react";
import supabase from "../supabaseClient";

/**
 * SaveOnboarding
 * - Salva o JSON das respostas no Supabase (tabela: onboarding_questionnaire)
 *
 * Props:
 * - answers: objeto com as respostas (ex: { goal: "...", alreadyInvest: "...", ... })
 * - onRestart: (opcional) callback para recomeçar
 */
export default function SaveOnboarding({ answers, onRestart }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const canSave = useMemo(() => {
    return answers && typeof answers === "object" && Object.keys(answers).length > 0;
  }, [answers]);

  async function handleSave({ requireEmail }) {
    setErr("");

    if (!canSave) {
      setErr("Não encontrei respostas para salvar. Volte e preencha o questionário.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (requireEmail && !cleanEmail) {
      setErr("Digite seu e-mail para continuar.");
      return;
    }

    // validação simples (opcional)
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErr("E-mail inválido. Confira e tente novamente.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        email: cleanEmail || null,
        answers, // jsonb
      };

      const { error } = await supabase.from("onboarding_questionnaire").insert([payload]);

      if (error) throw error;

      setDone(true);
    } catch (e) {
      setErr(e?.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
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
          Finalizar onboarding
        </div>

        {!canSave && (
          <div style={{ color: "#b91c1c", marginTop: 10 }}>
            Não encontrei respostas para salvar.
          </div>
        )}

        {done ? (
          <>
            <div style={{ marginTop: 12, fontSize: 16 }}>
              ✅ Respostas salvas com sucesso!
            </div>

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
              Se quiser, informe seu e-mail (opcional). Assim, se você quiser depois,
              dá pra devolver um perfil individual.
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: "#6b7280" }}>E-mail (opcional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: seuemail@dominio.com"
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

            {err && (
              <div style={{ marginTop: 10, color: "#b91c1c", fontSize: 14 }}>
                {err}
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                disabled={saving || !canSave}
                onClick={() => handleSave({ requireEmail: false })}
                style={{
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Salvando..." : "Salvar (sem exigir e-mail)"}
              </button>

              <button
                disabled={saving || !canSave}
                onClick={() => handleSave({ requireEmail: true })}
                style={{
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Salvando..." : "Salvar (exigir e-mail)"}
              </button>
            </div>

            {/* Debug opcional: ver o JSON */}
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
