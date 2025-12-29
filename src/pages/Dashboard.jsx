// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

/**
 * Dashboard (mobile-first + instagram-friendly)
 * - Só LÊ dados do Supabase (SELECT)
 * - Tudo em gráfico de Pizza (donut)
 */

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#111827",
  "#f97316",
];

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

function toPieData(list) {
  return (list || []).map((d) => ({ name: d.label, value: d.value }));
}

function pct(n, total) {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

function TopBar({ title, postMode, onTogglePostMode }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: postMode ? "16px 16px" : "14px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: postMode ? 18 : 16 }}>
        {title}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onTogglePostMode}
          style={{
            borderRadius: 999,
            padding: postMode ? "10px 14px" : "8px 12px",
            border: "1px solid rgba(0,0,0,0.12)",
            background: "white",
            cursor: "pointer",
            fontWeight: 900,
            fontSize: postMode ? 13 : 12,
            color: "#111827",
          }}
        >
          {postMode ? "Modo normal" : "Modo post"}
        </button>

        <a
          href="/"
          style={{
            fontSize: postMode ? 13 : 12,
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

function Card({ title, subtitle, postMode, children }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 18,
        padding: postMode ? 18 : 14,
        boxShadow: "0 14px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          fontWeight: 1000,
          fontSize: postMode ? 16 : 14,
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </div>

      {subtitle ? (
        <div
          style={{
            marginTop: 6,
            color: "#6b7280",
            fontSize: postMode ? 13 : 12,
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function DonutChart({ data, postMode }) {
  if (!data?.length) {
    return <div style={{ color: "#6b7280" }}>Sem dados</div>;
  }

  const total = data.reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: postMode ? "1fr" : "1fr 1fr",
        gap: postMode ? 14 : 12,
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", height: postMode ? 320 : 240 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={postMode ? 78 : 60}
              outerRadius={postMode ? 120 : 92}
              paddingAngle={2}
              stroke="white"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => {
                const v = Number(value) || 0;
                return [`${v} (${pct(v, total)})`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro (TOTAL) */}
        <div
          style={{
            position: "relative",
            marginTop: postMode ? -210 : -165,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: postMode ? 12 : 11, color: "#6b7280" }}>
            Total
          </div>
          <div style={{ fontSize: postMode ? 28 : 22, fontWeight: 1000 }}>
            {total}
          </div>
        </div>
      </div>

      {/* Legenda bonita (ótima pra print) */}
      <div style={{ display: "grid", gap: postMode ? 10 : 8 }}>
        {data.map((d, i) => (
          <div
            key={d.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: postMode ? "10px 12px" : "8px 10px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.06)",
              background: "rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: COLORS[i % COLORS.length],
                }}
              />
              <div
                style={{
                  fontWeight: 900,
                  fontSize: postMode ? 13 : 12,
                  color: "#111827",
                  lineHeight: 1.2,
                }}
              >
                {d.name}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                fontWeight: 900,
              }}
            >
              <div style={{ color: "#111827", fontSize: postMode ? 14 : 12 }}>
                {d.value}
              </div>
              <div style={{ color: "#6b7280", fontSize: postMode ? 12 : 11 }}>
                {pct(d.value, total)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [postMode, setPostMode] = useState(false);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      // ✅ sem updated_at (sua tabela não tem)
      const { data, error } = await supabase
        .from("onboarding_questionnaire")
        .select("id,email,answers,created_at")
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

  const goal = useMemo(() => toPieData(countBy(rows, "goal")), [rows]);
  const blocker = useMemo(() => toPieData(countBy(rows, "blocker")), [rows]);
  const income = useMemo(() => toPieData(countBy(rows, "income")), [rows]);
  const invested = useMemo(() => toPieData(countBy(rows, "invested")), [rows]);
  const expenseControl = useMemo(
    () => toPieData(countBy(rows, "expenseControl")),
    [rows]
  );
  const coaching = useMemo(() => toPieData(countBy(rows, "coaching")), [rows]);
  const ageRange = useMemo(() => toPieData(countBy(rows, "ageRange")), [rows]);
  const spouse = useMemo(() => toPieData(countBy(rows, "spouse")), [rows]);

  // ✅ sua pergunta no App é "children"
  const children = useMemo(() => toPieData(countBy(rows, "children")), [rows]);

  const wrapBg = postMode
    ? "linear-gradient(180deg,#f8fafc 0%, #eef2ff 100%)"
    : "#f6f7fb";

  return (
    <div style={{ minHeight: "100dvh", background: wrapBg }}>
      <TopBar
        title="Admin • Dashboard"
        postMode={postMode}
        onTogglePostMode={() => setPostMode((v) => !v)}
      />

      <div
        style={{
          padding: postMode ? 18 : 14,
          maxWidth: postMode ? 1080 : 980,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "grid", gap: postMode ? 14 : 12 }}>
          <Card
            title="Resumo"
            subtitle="Dados lidos do Supabase (tabela onboarding_questionnaire)"
            postMode={postMode}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div
                style={{
                  flex: "1 1 160px",
                  background: "#0b1220",
                  color: "white",
                  borderRadius: 16,
                  padding: postMode ? 16 : 14,
                }}
              >
                <div style={{ fontSize: postMode ? 13 : 12, opacity: 0.85 }}>
                  Respostas
                </div>
                <div style={{ fontSize: postMode ? 30 : 26, fontWeight: 1000 }}>
                  {total}
                </div>
              </div>

              <button
                onClick={load}
                style={{
                  flex: "1 1 160px",
                  borderRadius: 16,
                  padding: postMode ? 16 : 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 1000,
                  fontSize: postMode ? 14 : 13,
                }}
              >
                Atualizar dados
              </button>

              <a
                href="/analises"
                style={{
                  flex: "1 1 160px",
                  borderRadius: 16,
                  padding: postMode ? 16 : 14,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 1000,
                  fontSize: postMode ? 14 : 13,
                }}
              >
                Ver análises
              </a>
            </div>

            {loading && (
              <div style={{ marginTop: 12, color: "#6b7280" }}>
                Carregando…
              </div>
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
              gap: postMode ? 14 : 12,
              gridTemplateColumns: postMode
                ? "1fr"
                : "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            <Card title="Objetivo principal (goal)" postMode={postMode}>
              <DonutChart data={goal} postMode={postMode} />
            </Card>

            <Card title="Maior trava (blocker)" postMode={postMode}>
              <DonutChart data={blocker} postMode={postMode} />
            </Card>

            <Card title="Renda (income)" postMode={postMode}>
              <DonutChart data={income} postMode={postMode} />
            </Card>

            <Card title="Quanto já investe (invested)" postMode={postMode}>
              <DonutChart data={invested} postMode={postMode} />
            </Card>

            <Card title="Controle de despesas (expenseControl)" postMode={postMode}>
              <DonutChart data={expenseControl} postMode={postMode} />
            </Card>

            <Card title="Acompanhamento ajuda? (coaching)" postMode={postMode}>
              <DonutChart data={coaching} postMode={postMode} />
            </Card>

            <Card title="Faixa etária (ageRange)" postMode={postMode}>
              <DonutChart data={ageRange} postMode={postMode} />
            </Card>

            <Card title="Tem cônjuge? (spouse)" postMode={postMode}>
              <DonutChart data={spouse} postMode={postMode} />
            </Card>

            <Card title="Tem filhos? (children)" postMode={postMode}>
              <DonutChart data={children} postMode={postMode} />
            </Card>
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: postMode ? 12 : 11,
              color: "#6b7280",
              paddingBottom: 18,
            }}
          >
            Dica: ative <b>Modo post</b> e faça um print. Se quiser, depois eu
            deixo uma versão “1 post = 1 gráfico” com capa e título (bem cara de
            Instagram).
          </div>
        </div>
      </div>
    </div>
  );
}
