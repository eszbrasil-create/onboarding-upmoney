// src/pages/Analises.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Analises
 * - Só LÊ dados
 * - Gera insights + “personas” (heurísticas simples)
 * Depois a gente melhora com IA, se quiser.
 */

function pick(val, fallback = "") {
  return val ? String(val) : fallback;
}

function personaFrom(a = {}) {
  const goal = pick(a.goal);
  const blocker = pick(a.blocker);
  const risk = pick(a.risk);
  const expense = pick(a.expenseControl);
  const coaching = pick(a.coaching);
  const income = pick(a.income);

  // Heurísticas simples (MVP)
  if (goal.includes("Organizar") && (expense.includes("Não") || expense.includes("papel"))) {
    return {
      name: "Organizador(a) Iniciante",
      angle: "Organização + hábito",
      hook: "Você não precisa investir melhor — precisa organizar melhor.",
    };
  }

  if (blocker.includes("Medo") || risk.includes("segurança")) {
    return {
      name: "Cauteloso(a) por Medo",
      angle: "Segurança + clareza",
      hook: "Medo some quando o plano é simples e repetível.",
    };
  }

  if (goal.includes("dividendo") || goal.includes("Dividendo")) {
    return {
      name: "Caçador(a) do Primeiro Dividendo",
      angle: "Plano de 30 dias + consistência",
      hook: "Seu primeiro dividendo não é sobre valor — é sobre começar.",
    };
  }

  if (coaching.includes("passo a passo")) {
    return {
      name: "Aluno(a) que Quer Mão na Massa",
      angle: "Acompanhamento + execução",
      hook: "Com direção certa, você evolui 10x mais rápido.",
    };
  }

  if (income.includes("Acima") && !blocker.includes("Falta")) {
    return {
      name: "Otimização e Performance",
      angle: "Alocação + disciplina",
      hook: "Você já tem renda — agora é fazer o dinheiro trabalhar.",
    };
  }

  return {
    name: "Perfil Misto",
    angle: "Diagnóstico rápido",
    hook: "Seu plano começa entendendo seu momento real.",
  };
}

export default function Analises() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data, error } = await supabase
        .from("onboarding_questionnaire")
        .select("id,answers,created_at")
        .order("created_at", { ascending: false })
        .limit(1500);

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const personas = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      const p = personaFrom(r.answers || {});
      m.set(p.name, (m.get(p.name) || 0) + 1);
    }
    return Array.from(m.entries())
      .map(([name, n]) => ({ name, n }))
      .sort((a, b) => b.n - a.n);
  }, [rows]);

  const topHooks = useMemo(() => {
    // pega hooks das personas mais comuns
    const seen = new Set();
    const hooks = [];
    for (const r of rows) {
      const p = personaFrom(r.answers || {});
      if (!seen.has(p.hook)) {
        seen.add(p.hook);
        hooks.push(p.hook);
      }
      if (hooks.length >= 6) break;
    }
    return hooks;
  }, [rows]);

  return (
    <div style={{ minHeight: "100dvh", background: "#f6f7fb" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "14px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 16 }}>Admin • Análises</div>
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/admin"
            style={{
              fontSize: 13,
              textDecoration: "none",
              color: "#2563eb",
              fontWeight: 800,
            }}
          >
            Dashboard
          </a>
          <a
            href="/"
            style={{
              fontSize: 13,
              textDecoration: "none",
              color: "#2563eb",
              fontWeight: 800,
            }}
          >
            Voltar
          </a>
        </div>
      </div>

      <div style={{ padding: 14, maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontWeight: 900 }}>Resumo inteligente</div>
          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
            (MVP) Personas e ganchos prontos para conteúdo — baseado nas respostas reais.
          </div>

          {loading && <div style={{ marginTop: 12, color: "#6b7280" }}>Carregando…</div>}
          {err && (
            <div style={{ marginTop: 12, color: "#b91c1c" }}>
              {err}
              <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                Se der erro aqui: normalmente é RLS/Policies ou variáveis do Vercel.
              </div>
            </div>
          )}

          {!loading && !err && (
            <>
              <div style={{ marginTop: 14, fontWeight: 900 }}>Personas mais frequentes</div>
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {personas.slice(0, 6).map((p) => (
                  <div
                    key={p.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(37,99,235,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontWeight: 900, color: "#2563eb" }}>{p.n}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, fontWeight: 900 }}>
                Ganchos prontos para Instagram
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {topHooks.map((h) => (
                  <div
                    key={h}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "white",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>🧠 Ideia:</div>
                    <div style={{ marginTop: 6, color: "#111827" }}>{h}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={load}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Atualizar análises
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
