// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/**
 * Dashboard (mobile-first)
 * - Só LÊ dados do Supabase (SELECT)
 * - Mostra contagens e gráficos (Recharts)
 */

const CHART_COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#111827",
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

// Recharts precisa de { name, value }
function toChartData(list) {
  return (list || []).map((d) => ({ name: d.label, value: d.value }));
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

function PieBlock({ data }) {
  if (!data?.length) return <div style={{ color: "#6b7280" }}>Sem dados</div>;

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={92}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarBlock({ data }) {
  if (!data?.length) return <div style={{ color: "#6b7280" }}>Sem dados</div>;

  // limita a 8 itens para ficar bonito no mobile
  const sliced = data.slice(0, 8);

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <RBarChart data={sliced}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            interval={0}
            tick={{ fontSize: 11 }}
            height={60}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value">
            {sliced.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </RBarChart>
      </ResponsiveContainer>
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
      // ✅ removi updated_at porque sua tabela não tem essa coluna
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

  const goal = useMemo(() => countBy(rows, "goal"), [rows]);
  const blocker = useMemo(() => countBy(rows, "blocker"), [rows]);
  const income = useMemo(() => countBy(rows, "income"), [rows]);
  const invested = useMemo(() => countBy(rows, "invested"), [rows]);
  const expenseControl = useMemo(() => countBy(rows, "expenseControl"), [rows]);
  const coaching = useMemo(() => countBy(rows, "coaching"), [rows]);
  const ageRange = useMemo(() => countBy(rows, "ageRange"), [rows]);
  const spouse = useMemo(() => countBy(rows, "spouse"), [rows]);

  // ✅ seu FLOW usa "children", não "kids"
  const children = useMemo(() => countBy(rows, "children"), [rows]);

  // dados no formato do Recharts
  const goalChart = useMemo(() => toChartData(goal), [goal]);
  const blockerChart = useMemo(() => toChartData(blocker), [blocker]);
  const incomeChart = useMemo(() => toChartData(income), [income]);
  const investedChart = useMemo(() => toChartData(invested), [invested]);
  const expenseChart = useMemo(() => toChartData(expenseControl), [expenseControl]);
  const coachingChart = useMemo(() => toChartData(coaching), [coaching]);
  const ageChart = useMemo(() => toChartData(ageRange), [ageRange]);
  const spouseChart = useMemo(() => toChartData(spouse), [spouse]);
  const childrenChart = useMemo(() => toChartData(children), [children]);

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
            {/* Pizza (ótimo quando tem poucas opções) */}
            <Card title="Objetivo principal (goal) — Pizza">
              <PieBlock data={goalChart} />
            </Card>

            <Card title="Faixa etária (ageRange) — Pizza">
              <PieBlock data={ageChart} />
            </Card>

            <Card title="Tem cônjuge? (spouse) — Pizza">
              <PieBlock data={spouseChart} />
            </Card>

            <Card title="Tem filhos? (children) — Pizza">
              <PieBlock data={childrenChart} />
            </Card>

            {/* Barras (melhor quando tem várias opções) */}
            <Card title="Maior trava (blocker) — Barras">
              <BarBlock data={blockerChart} />
            </Card>

            <Card title="Renda (income) — Barras">
              <BarBlock data={incomeChart} />
            </Card>

            <Card title="Quanto já investe (invested) — Barras">
              <BarBlock data={investedChart} />
            </Card>

            <Card title="Controle de despesas (expenseControl) — Barras">
              <BarBlock data={expenseChart} />
            </Card>

            <Card title="Acompanhamento ajuda? (coaching) — Barras">
              <BarBlock data={coachingChart} />
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
          Obs.: se um gráfico ficar “Sem dados”, é porque ainda não tem respostas
          suficientes naquela chave dentro do answers.
        </div>
      </div>
    </div>
  );
}
