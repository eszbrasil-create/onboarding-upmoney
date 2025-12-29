import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { supabase } from "../supabaseClient";

const PIE_COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6", "#64748b"];

function toISOStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatDateBR(iso) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso?.slice(0, 10);
  }
}

function asCountArray(mapObj) {
  return Object.entries(mapObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function countBy(records, key) {
  const counts = {};
  for (const r of records) {
    const v = r?.answers?.[key];
    if (!v) continue;
    const label = String(v);
    counts[label] = (counts[label] || 0) + 1;
  }
  return asCountArray(counts);
}

function countByDay(records) {
  const counts = {};
  for (const r of records) {
    const day = formatDateBR(r.created_at);
    counts[day] = (counts[day] || 0) + 1;
  }
  // ordena por data (dd/mm/aa) -> converte pra algo ordenável
  const arr = Object.entries(counts).map(([day, value]) => {
    const [dd, mm, yy] = day.split("/");
    const sortable = `20${yy}-${mm}-${dd}`;
    return { day, value, sortable };
  });
  arr.sort((a, b) => (a.sortable > b.sortable ? 1 : -1));
  return arr.map(({ day, value }) => ({ day, value }));
}

function safeN(n, fallback = 0) {
  return Number.isFinite(n) ? n : fallback;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const [range, setRange] = useState("30"); // "7" | "30" | "all"

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        let query = supabase
          .from("onboarding_questionnaire")
          .select("email, created_at, answers")
          .order("created_at", { ascending: false });

        if (range !== "all") {
          const days = parseInt(range, 10);
          const from = new Date();
          from.setDate(from.getDate() - days);
          query = query.gte("created_at", toISOStartOfDay(from));
        }

        const { data, error } = await query.limit(2000); // MVP: até 2000 registros
        if (error) throw error;

        if (isMounted) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (isMounted) setErr(e?.message || "Erro ao carregar dados do Supabase.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [range]);

  const total = rows.length;

  // principais agregações (ajuste as keys se mudar o FLOW)
  const goalData = useMemo(() => countBy(rows, "goal"), [rows]);
  const blockerData = useMemo(() => countBy(rows, "blocker"), [rows]);
  const alreadyInvestData = useMemo(() => countBy(rows, "alreadyInvest"), [rows]);
  const investedData = useMemo(() => countBy(rows, "invested"), [rows]);
  const monthlyData = useMemo(() => countBy(rows, "monthly"), [rows]);
  const incomeData = useMemo(() => countBy(rows, "income"), [rows]);
  const whereInvestData = useMemo(() => countBy(rows, "whereInvest"), [rows]);
  const controlData = useMemo(() => countBy(rows, "expenseControl"), [rows]);
  const coachingData = useMemo(() => countBy(rows, "coaching"), [rows]);
  const learningData = useMemo(() => countBy(rows, "learning"), [rows]);
  const perDay = useMemo(() => countByDay(rows), [rows]);

  const topGoal = goalData?.[0]?.name || "-";
  const topBlocker = blockerData?.[0]?.name || "-";

  if (loading) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Dashboard Onboarding</div>
        <div style={{ marginTop: 10 }}>Carregando dados...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", background: "#f6f7fb", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>Dashboard — Onboarding</div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setRange("7")} style={btnStyle(range === "7")}>7 dias</button>
          <button onClick={() => setRange("30")} style={btnStyle(range === "30")}>30 dias</button>
          <button onClick={() => setRange("all")} style={btnStyle(range === "all")}>Tudo</button>
        </div>
      </div>

      {err && (
        <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 700 }}>
          Erro: {err}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
        <Kpi title="Respostas" value={total} />
        <Kpi title="Objetivo #1" value={topGoal} />
        <Kpi title="Trava #1" value={topBlocker} />
        <Kpi title="Último envio" value={rows?.[0]?.created_at ? formatDateBR(rows[0].created_at) : "-"} />
      </div>

      {/* Linha por dia */}
      <Section title="Respostas por dia (Brasil)">
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={perDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Gráficos principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <Section title="Objetivo (goal)">
          <BarBox data={goalData} />
        </Section>

        <Section title="Trava (blocker)">
          <BarBox data={blockerData} />
        </Section>

        <Section title="Já investe? (alreadyInvest)">
          <PieBox data={alreadyInvestData} />
        </Section>

        <Section title="Onde investe (whereInvest)">
          <PieBox data={whereInvestData} />
        </Section>

        <Section title="Quanto já investiu (invested)">
          <BarBox data={investedData} />
        </Section>

        <Section title="Quanto consegue investir por mês (monthly)">
          <BarBox data={monthlyData} />
        </Section>

        <Section title="Renda mensal (income)">
          <BarBox data={incomeData} />
        </Section>

        <Section title="Controle de despesas (expenseControl)">
          <BarBox data={controlData} />
        </Section>

        <Section title="Acompanhamento traz segurança? (coaching)">
          <BarBox data={coachingData} />
        </Section>

        <Section title="Preferência de aprendizagem (learning)">
          <BarBox data={learningData} />
        </Section>
      </div>
    </div>
  );
}

function btnStyle(active) {
  return {
    padding: "10px 12px",
    borderRadius: 999,
    border: active ? "none" : "1px solid rgba(0,0,0,0.15)",
    background: active ? "#2563eb" : "white",
    color: active ? "white" : "#111",
    cursor: "pointer",
    fontWeight: 800,
  };
}

function Kpi({ title, value }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: 14, boxShadow: "0 8px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: "#111827" }}>{String(value)}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: 14, boxShadow: "0 8px 20px rgba(0,0,0,0.06)", marginTop: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function BarBox({ data }) {
  const chartData = (data || []).slice(0, 8).map((d) => ({ ...d, value: safeN(d.value, 0) }));
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={140} />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
      {(data || []).length > 8 && (
        <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
          Mostrando top 8 (de {(data || []).length})
        </div>
      )}
    </div>
  );
}

function PieBox({ data }) {
  const chartData = (data || []).slice(0, 6).map((d) => ({ ...d, value: safeN(d.value, 0) }));
  return (
    <div style={{ height: 280, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "center" }}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={55}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chartData.map((d, idx) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: PIE_COLORS[idx % PIE_COLORS.length], display: "inline-block" }} />
            <div style={{ fontSize: 12, color: "#111827" }}>
              <strong>{d.value}</strong> — {d.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
