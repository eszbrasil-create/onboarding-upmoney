// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Dashboard (mobile-first)
 * - LÊ dados do Supabase (SELECT)
 * - Donut charts (SVG) sem libs
 * - Automático: renderiza TODAS as perguntas presentes em answers
 * - Cabeçalho do chart mostra a pergunta (via QUESTION_LABELS)
 */

/** ✅ Mapeie aqui "id" -> Pergunta (título bonito do gráfico) */
const QUESTION_LABELS = {
  goal: "Qual é seu foco principal hoje?",
  alreadyInvest: "Hoje você já investe?",
  blocker: "O que mais te trava hoje?",
  whereInvest: "Onde você já investe hoje?",
  invested: "Quanto você já tem investido (aprox.)?",
  ageRange: "Qual é sua faixa etária?",
  income: "Qual é sua renda mensal aproximada?",
  spouse: "Você tem cônjuge?",
  children: "Você tem filhos?",
  monthly: "Por mês, quanto você consegue investir (aprox.)?",
  time: "Em quanto tempo você quer começar a ver resultados?",
  risk: "Qual frase combina mais com você?",
  dividends: "Dividendos são um objetivo pra você?",
  firstDividendEmotion: "Qual valor de 1º dividendo já te deixaria feliz?",
  expenseControl: "Hoje você controla suas despesas?",
  coaching: "Você se sente mais seguro(a) com acompanhamento?",
  learning: "Você prefere aprender como?",
};

/** Se existir no answers e você NÃO quiser mostrar no dash, coloque aqui */
const HIDE_KEYS = new Set([
  "email", // você já tem o email na coluna email, não precisa duplicar
  "welcome",
  "done",
]);

/** Paleta suave e bonita (sem “gritar”) */
const COLORS = [
  "#2563eb", // blue
  "#06b6d4", // cyan
  "#22c55e", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ef4444", // red
  "#14b8a6", // teal
  "#f97316", // orange
  "#3b82f6", // light blue
  "#84cc16", // lime
];

/* ---------- helpers ---------- */

function safeLabel(v) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v);
}

function countByKey(rows, key) {
  const map = new Map();
  for (const r of rows) {
    const val = safeLabel(r?.answers?.[key]);
    if (!val) continue;
    map.set(val, (map.get(val) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Gera segmentos do donut em SVG */
function buildDonutSegments(data) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  // donut settings
  const size = 140;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return {
    size,
    cx,
    cy,
    r,
    circ,
    total,
    segments: data.map((d, i) => {
      const dash = (d.value / total) * circ;
      const seg = {
        ...d,
        color: COLORS[i % COLORS.length],
        dash,
        offset,
      };
      offset += dash;
      return seg;
    }),
  };
}

/* ---------- UI components ---------- */

function TopBar({ title, onReload, loading }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(246,247,251,0.85)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: -0.2 }}>
        {title}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onReload}
          disabled={loading}
          style={{
            borderRadius: 999,
            padding: "10px 12px",
            border: "1px solid rgba(0,0,0,0.10)",
            background: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>

        <a
          href="/"
          style={{
            fontSize: 13,
            textDecoration: "none",
            color: "#2563eb",
            fontWeight: 900,
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
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 14, letterSpacing: -0.2 }}>
        {title}
      </div>
      {subtitle ? (
        <div style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>
          {subtitle}
        </div>
      ) : null}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function DonutChart({ data }) {
  const built = useMemo(() => buildDonutSegments(data), [data]);
  const { size, cx, cy, r, circ, segments, total } = built;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        {/* DONUT */}
        <svg width={size} height={size} style={{ display: "block" }}>
          {/* track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="16"
          />
          {/* segments */}
          {segments.map((s, idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${s.dash} ${circ - s.dash}`}
              strokeDashoffset={-s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}

          {/* center text */}
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 18, fontWeight: 950, fill: "#111827" }}
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 11, fontWeight: 800, fill: "#6b7280" }}
          >
            respostas
          </text>
        </svg>

        {/* LEGEND */}
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          {data.slice(0, 6).map((d, i) => (
            <div
              key={d.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: COLORS[i % COLORS.length],
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 800, color: "#111827" }}>
                  {d.label}
                </span>
              </div>
              <span style={{ color: "#6b7280", fontWeight: 900 }}>
                {pct(d.value, total)}%
              </span>
            </div>
          ))}

          {data.length > 6 ? (
            <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>
              +{data.length - 6} opções…
            </div>
          ) : null}
        </div>
      </div>

      {/* bars tiny (opcional) */}
      <div style={{ display: "grid", gap: 8 }}>
        {data.slice(0, 6).map((d, i) => {
          const p = pct(d.value, total);
          return (
            <div key={d.label} style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: 12,
                  color: "#6b7280",
                  fontWeight: 800,
                }}
              >
                <span>{d.value} respostas</span>
                <span>{p}%</span>
              </div>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${p}%`,
                    background: COLORS[i % COLORS.length],
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- main page ---------- */

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

  /** ✅ Descobre automaticamente todas as chaves presentes em answers */
  const allAnswerKeys = useMemo(() => {
    const s = new Set();
    for (const r of rows) {
      const a = r?.answers;
      if (!a || typeof a !== "object") continue;
      Object.keys(a).forEach((k) => s.add(k));
    }

    // normaliza: se algum dado antigo tiver kids, trate como children
    if (s.has("kids") && !s.has("children")) s.add("children");

    // remove chaves ocultas
    for (const k of Array.from(s)) {
      if (HIDE_KEYS.has(k)) s.delete(k);
      if (k === "kids") s.delete(k); // preferimos children
    }

    // ordena: primeiro os que estão no QUESTION_LABELS, depois o resto
    const keys = Array.from(s);
    keys.sort((a, b) => {
      const pa = QUESTION_LABELS[a] ? 0 : 1;
      const pb = QUESTION_LABELS[b] ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    });

    return keys;
  }, [rows]);

  /** ✅ Para cada pergunta, calcula contagem */
  const charts = useMemo(() => {
    return allAnswerKeys
      .map((key) => {
        const data = countByKey(rows, key === "children" ? "children" : key);

        // fallback: se não houver dados, não renderiza
        if (!data.length) return null;

        return {
          key,
          question:
            QUESTION_LABELS[key] ||
            `Pergunta (${key}) — configure em QUESTION_LABELS`,
          data,
        };
      })
      .filter(Boolean);
  }, [rows, allAnswerKeys]);

  return (
    <div style={{ minHeight: "100dvh", background: "#f6f7fb" }}>
      <TopBar title="Dashboard • Análises" onReload={load} loading={loading} />

      <div style={{ padding: 14, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <Card
            title="Resumo"
            subtitle="Gráficos de pizza (donut) prontos para virar fonte de posts"
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div
                style={{
                  flex: "1 1 180px",
                  background: "#0b1220",
                  color: "white",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>
                  Total de respostas
                </div>
                <div style={{ fontSize: 28, fontWeight: 950 }}>{total}</div>
              </div>

              <div
                style={{
                  flex: "2 1 260px",
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
                  Dica rápida
                </div>
                <div style={{ marginTop: 6, fontWeight: 900, color: "#111827" }}>
                  Você pode tirar print de cada card e já usar no Instagram.
                  (No próximo passo, se você quiser, eu adiciono um botão “Gerar Post 1080x1350”.)
                </div>
              </div>
            </div>

            {loading && (
              <div style={{ marginTop: 12, color: "#6b7280", fontWeight: 800 }}>
                Carregando…
              </div>
            )}
            {err && (
              <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 900 }}>
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
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              alignItems: "start",
            }}
          >
            {charts.length ? (
              charts.map((c) => (
                <Card key={c.key} title={c.question} subtitle={`Chave: ${c.key}`}>
                  <DonutChart data={c.data} />
                </Card>
              ))
            ) : (
              <Card title="Sem dados ainda">
                <div style={{ color: "#6b7280", fontWeight: 800 }}>
                  Quando houver respostas no Supabase, os gráficos aparecem automaticamente.
                </div>
              </Card>
            )}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#6b7280",
              paddingBottom: 20,
              fontWeight: 700,
            }}
          >
            Se alguma pergunta estiver aparecendo como “Pergunta (xxx)”, é só
            colocar o texto dela em <b>QUESTION_LABELS</b> no topo do arquivo.
          </div>
        </div>
      </div>
    </div>
  );
}
