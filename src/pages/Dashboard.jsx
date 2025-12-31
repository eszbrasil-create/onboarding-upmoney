// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Dashboard (auto)
 * - Lê respostas do Supabase (onboarding_questionnaire)
 * - Gera automaticamente gráficos de pizza (donut) para TODAS as perguntas do FLOW
 * - Cabeçalho sempre mostra a pergunta REAL (texto)
 *
 * Obs: não seleciona "updated_at" para evitar erro se a coluna não existir.
 */

/** ✅ Ordem das perguntas (igual ao seu FLOW) */
const QUESTION_ORDER = [
  "goal",
  "alreadyInvest",
  "blocker",
  "whereInvest",
  "invested",
  "ageRange",
  "income",
  "spouse",
  "children",
  "monthly",
  "time",
  "risk",
  "dividends",
  "firstDividendEmotion",
  "expenseControl",
  "coaching",
  "learning",
];

/** ✅ Texto real das perguntas (pra aparecer no título do chart) */
const QUESTION_LABELS = {
  goal: "Pra começar: qual é seu foco principal hoje?",
  alreadyInvest: "Hoje você já investe?",
  blocker: "O que mais te trava hoje?",
  whereInvest: "Onde você já investe hoje?",
  invested: "Hoje, quanto você já tem investido (aprox.)?",
  ageRange: "Qual é sua faixa etária?",
  income: "Qual é sua renda mensal aproximada?",
  spouse: "Você tem cônjuge?",
  children: "Você tem filhos?",
  monthly: "E por mês, quanto você consegue investir (aprox.)?",
  time: "Em quanto tempo você quer começar a ver resultados?",
  risk: "E qual frase combina mais com você?",
  dividends: "Dividendos são um objetivo pra você?",
  firstDividendEmotion:
    "Se você recebesse seu primeiro dividendo, qual valor já te deixaria feliz?",
  expenseControl: "Hoje você faz algum controle das suas despesas?",
  coaching: "Você se sente mais seguro(a) com acompanhamento mais próximo?",
  learning: "E você prefere aprender como?",
};

/** ❌ Chaves que não viram gráfico */
const EXCLUDE_KEYS = new Set(["email", "welcome", "done"]);

/** Paleta (bonita e consistente) */
const PALETTE = [
  "#2563eb", // azul
  "#22c55e", // verde
  "#f59e0b", // laranja
  "#ef4444", // vermelho
  "#a855f7", // roxo
  "#06b6d4", // ciano
  "#f97316", // laranja2
  "#10b981", // verde2
  "#3b82f6", // azul2
  "#e11d48", // rosa/vermelho
];

/** Helpers */
function sum(arr) {
  return arr.reduce((acc, x) => acc + (x?.value || 0), 0);
}

function safeLabel(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
}

function countBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const v = safeLabel(r?.answers?.[key]);
    if (!v) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return Array.from(m.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** UI */
function TopBar({ title }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <a
          href="/analises"
          style={{
            fontSize: 13,
            textDecoration: "none",
            color: "#0f172a",
            fontWeight: 800,
            padding: "8px 10px",
            borderRadius: 999,
            background: "rgba(15,23,42,0.06)",
            border: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          Análises
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
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 18,
        padding: 14,
        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 14, color: "#0f172a" }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 6, color: "#64748b", fontSize: 12 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

/**
 * DonutChart (SVG)
 * - legenda com % e quantidade
 * - total no centro
 */
function DonutChart({ data }) {
  const total = sum(data);
  if (!total) {
    return (
      <div
        style={{
          color: "#64748b",
          fontSize: 13,
          background: "rgba(15,23,42,0.04)",
          border: "1px dashed rgba(15,23,42,0.16)",
          borderRadius: 14,
          padding: 12,
        }}
      >
        Ainda sem respostas para essa pergunta.
      </div>
    );
  }

  // parâmetros do donut
  const size = 170;
  const cx = size / 2;
  const cy = size / 2;
  const r = 56;
  const stroke = 18;
  const C = 2 * Math.PI * r;

  // cria segmentos usando círculos com dasharray/dashoffset
  let acc = 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(180deg, rgba(37,99,235,0.06), rgba(15,23,42,0.02))",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.06)",
          padding: 10,
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* trilho */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(15,23,42,0.08)"
            strokeWidth={stroke}
          />

          {/* segmentos */}
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {data.map((d, i) => {
              const frac = d.value / total;
              const seg = frac * C;

              const dasharray = `${seg} ${C - seg}`;
              const dashoffset = -acc;

              acc += seg;

              const color = PALETTE[i % PALETTE.length];

              return (
                <circle
                  key={d.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </g>

          {/* centro */}
          <circle cx={cx} cy={cy} r={r - stroke / 2 - 6} fill="white" />
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            style={{ fontSize: 22, fontWeight: 950, fill: "#0f172a" }}
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            style={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }}
          >
            respostas
          </text>
        </svg>
      </div>

      {/* legenda */}
      <div style={{ display: "grid", gap: 8 }}>
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100);
          const color = PALETTE[i % PALETTE.length];

          return (
            <div
              key={d.label}
              style={{
                display: "grid",
                gridTemplateColumns: "12px 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "8px 10px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                background: "rgba(255,255,255,0.9)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: color,
                }}
              />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 750,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={d.label}
              >
                {d.label}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                {pct}% · {d.value}
              </div>
            </div>
          );
        })}
      </div>
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
        .select("id,email,answers,created_at")
        .order("created_at", { ascending: false })
        .limit(2000);

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

  /** ✅ monta automaticamente os gráficos na ordem do FLOW */
  const charts = useMemo(() => {
    return QUESTION_ORDER.filter((k) => !EXCLUDE_KEYS.has(k)).map((key) => {
      const data = countBy(rows, key);
      return {
        key,
        title: QUESTION_LABELS[key] || key,
        data,
      };
    });
  }, [rows]);

  /** (extra) se aparecerem chaves novas no banco, mostra também no final */
  const extraKeys = useMemo(() => {
    const s = new Set();
    for (const r of rows) {
      const a = r?.answers || {};
      Object.keys(a).forEach((k) => {
        if (EXCLUDE_KEYS.has(k)) return;
        if (QUESTION_ORDER.includes(k)) return;
        s.add(k);
      });
    }
    return Array.from(s);
  }, [rows]);

  const extraCharts = useMemo(() => {
    return extraKeys.map((key) => ({
      key,
      title: QUESTION_LABELS[key] || key,
      data: countBy(rows, key),
    }));
  }, [extraKeys, rows]);

  return (
    <div style={{ minHeight: "100dvh", background: "#f6f7fb" }}>
      <TopBar title="Admin • Dashboard" />

      <div style={{ padding: 14, maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 12 }}>
          {/* Resumo */}
          <Card
            title="Resumo"
            subtitle="Leitura direta do Supabase (onboarding_questionnaire). Ideal pra virar conteúdo do Instagram."
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div
                style={{
                  flex: "1 1 200px",
                  background: "linear-gradient(135deg, #0b1220, #111827)",
                  color: "white",
                  borderRadius: 16,
                  padding: 14,
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.85 }}>Respostas</div>
                <div style={{ fontSize: 28, fontWeight: 950 }}>{total}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  (últimos {Math.min(total, 2000)} registros)
                </div>
              </div>

              <button
                onClick={load}
                style={{
                  flex: "1 1 200px",
                  borderRadius: 16,
                  padding: 14,
                  border: "1px solid rgba(15,23,42,0.14)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Atualizar dados
              </button>

              <a
                href="/analises"
                style={{
                  flex: "1 1 200px",
                  borderRadius: 16,
                  padding: 14,
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 950,
                }}
              >
                Ver análises
              </a>
            </div>

            {loading && (
              <div style={{ marginTop: 12, color: "#64748b" }}>
                Carregando…
              </div>
            )}

            {err && (
              <div style={{ marginTop: 12, color: "#b91c1c" }}>
                {err}
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  Se der erro aqui, normalmente é RLS/Policies ou variáveis do
                  Vercel (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
                </div>
              </div>
            )}
          </Card>

          {/* Gráficos */}
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            }}
          >
            {charts.map((c) => (
              <Card
                key={c.key}
                title={c.title}
                subtitle={`Chave: ${c.key}`}
              >
                <DonutChart data={c.data} />
              </Card>
            ))}

            {extraCharts.length > 0 ? (
              <Card
                title="Perguntas extras detectadas no banco"
                subtitle="Essas chaves apareceram em answers mas não estão no seu FLOW."
              >
                <div style={{ display: "grid", gap: 12 }}>
                  {extraCharts.map((c) => (
                    <div
                      key={c.key}
                      style={{
                        border: "1px solid rgba(0,0,0,0.06)",
                        borderRadius: 16,
                        padding: 12,
                        background: "rgba(255,255,255,0.7)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 950,
                          fontSize: 13,
                          color: "#0f172a",
                        }}
                      >
                        {c.title}{" "}
                        <span style={{ color: "#64748b", fontWeight: 800 }}>
                          ({c.key})
                        </span>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <DonutChart data={c.data} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 12,
              color: "#64748b",
              paddingBottom: 22,
            }}
          >
            Dica: quando você tiver mais respostas, esses donuts ficam ainda mais
            “postáveis” pro Instagram. Se quiser, depois eu te monto um layout
            “modo post” (1080×1350) com 3–4 gráficos por slide.
          </div>
        </div>
      </div>
    </div>
  );
}
