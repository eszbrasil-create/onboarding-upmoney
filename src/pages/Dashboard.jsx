// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Dashboard (mobile-first)
 * - Só LÊ dados do Supabase (SELECT)
 * - Mostra contagens e “gráficos” simples (barras em CSS)
 */

function countBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const v = r?.answers?.[key];
    if (!v) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return Array.from(m.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function TopBar({ title }) {
  return (
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
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <a
        href="/"
        style={{
          fontSize: 13,
          textDecoration: "none",
          color: "#2563eb",
          fontWeight: 700,
        }}
      >
        Voltar
      </a>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 14 }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              fontSize: 13,
            }}
          >
            <div style={{ color: "#111827", fontWeight: 600 }}>{d.label}</div>
            <div style={{ color: "#6b7280" }}>{d.value}</div>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: "rgba(37,99,235,0.10)",
              overflow: "hidden",
              border: "1px solid rgba(37,99,235,0.12)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((d.value / max) * 100)}%`,
                background: "#2563eb",
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const { data, error } = await supabase
        .from("onboarding_questionnaire")
        .select("id,email,answers,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setErr(e?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = rows.length;

  const goal = useMemo(() => countBy(rows, "goal"), [rows]);
  const blocker = useMemo(() => countBy(rows, "blocker"), [rows]);
  const income = useMemo(() => countBy(rows, "income"), [rows]);
  const invested = useMemo(() => countBy(rows, "invested"), [rows]);
  const expenseControl = useMemo(() => countBy(rows, "expenseControl"), [rows]);
  const coaching = useMemo(() => countBy(rows, "coaching"), [rows]);
  const ageRange = useMemo(() => countBy(rows, "ageRange"), [rows]); // se existir
  const spouse = useMemo(() => countBy(rows, "spouse"), [rows]); // se existir
  const kids = useMemo(() => countBy(rows, "kids"), [rows]); // se existir

  return (
    <div style={{ minHeight: "100dvh", background: "#f6f7fb" }}>
      <TopBar title="Admin • Dashboard" />

      <div style={{ padding: 14, maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <Card
            title="Resumo"
            subtitle="Dados lidos do Supabase (tabela onboarding_questionnaire)"
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div
                style={{
                  flex: "1 1 160px",
                  background: "#0b1220",
                  color: "white",
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>Respostas</div>
                <div style={{ fontSize: 26, fontWeight: 900 }}>{total}</div>
              </div>

              <button
                onClick={load}
                style={{
                  flex: "1 1 160px",
                  borderRadius: 14,
                  padding: 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                Atualizar dados
              </button>

              <a
                href="/analises"
                style={{
                  flex: "1 1 160px",
                  borderRadius: 14,
                  padding: 14,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                }}
              >
                Ver análises
              </a>
            </div>

            {loading && (
              <div style={{ marginTop: 12, color: "#6b7280" }}>Carregando…</div>
            )}
            {err && (
              <div style={{ marginTop: 12, color: "#b91c1c" }}>
                {err}
                <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                  Se der erro aqui, normalmente é RLS/Policies ou variáveis do
                  Vercel.
                </div>
              </div>
            )}
          </Card>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <Card title="Objetivo principal (goal)">
              {goal.length ? <BarChart data={goal} /> : <div>Sem dados</div>}
            </Card>

            <Card title="Maior trava (blocker)">
              {blocker.length ? (
                <BarChart data={blocker} />
              ) : (
                <div>Sem dados</div>
              )}
            </Card>

            <Card title="Renda (income)">
              {income.length ? <BarChart data={income} /> : <div>Sem dados</div>}
            </Card>

            <Card title="Quanto já investe (invested)">
              {invested.length ? (
                <BarChart data={invested} />
              ) : (
                <div>Sem dados</div>
              )}
            </Card>

            <Card title="Controle de despesas (expenseControl)">
              {expenseControl.length ? (
                <BarChart data={expenseControl} />
              ) : (
                <div>Sem dados</div>
              )}
            </Card>

            <Card title="Acompanhamento ajuda? (coaching)">
              {coaching.length ? (
                <BarChart data={coaching} />
              ) : (
                <div>Sem dados</div>
              )}
            </Card>

            {/* Se você adicionou essas perguntas, elas vão aparecer automaticamente quando tiver dados */}
            <Card title="Faixa etária (ageRange)">
              {ageRange.length ? (
                <BarChart data={ageRange} />
              ) : (
                <div style={{ color: "#6b7280" }}>
                  Ainda sem dados (ou a pergunta ainda não existe no answers).
                </div>
              )}
            </Card>

            <Card title="Tem cônjuge? (spouse)">
              {spouse.length ? (
                <BarChart data={spouse} />
              ) : (
                <div style={{ color: "#6b7280" }}>
                  Ainda sem dados (ou a pergunta ainda não existe no answers).
                </div>
              )}
            </Card>

            <Card title="Tem filhos? (kids)">
              {kids.length ? (
                <BarChart data={kids} />
              ) : (
                <div style={{ color: "#6b7280" }}>
                  Ainda sem dados (ou a pergunta ainda não existe no answers).
                </div>
              )}
            </Card>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: "#6b7280",
            paddingBottom: 20,
          }}
        >
          Dica: se quiser, depois a gente transforma essas barras em gráficos
          “pizza”/linha usando uma lib. Por enquanto, isso já funciona 100% em
          mobile e sem dependências extras.
        </div>
      </div>
    </div>
  );
}
