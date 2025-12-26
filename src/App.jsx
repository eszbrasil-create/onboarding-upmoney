import { useEffect, useRef, useState } from "react";
import "./App.css";
import { saveOnboardingByEmail } from "./services/onboardingService";

/* ====== FLOW ====== */
const FLOW = [
  {
    id: "welcome",
    bot: "Oi! 👋 Eu sou o upmoney, seu assistente de educação financeira. Vou te fazer algumas perguntas rápidas (leva menos de 1 minuto) pra entender seu momento.",
    options: ["Começar"],
  },
  {
    id: "goal",
    bot: "Pra começar: qual é seu foco principal hoje?",
    options: [
      "Organizar minhas finanças",
      "Começar a investir do zero",
      "Receber meu primeiro dividendo",
      "Fazer meu dinheiro render mais",
    ],
  },
  {
    id: "alreadyInvest",
    bot: "Hoje você já investe?",
    options: [
      "Não, ainda não",
      "Sim, comecei recentemente",
      "Sim, já invisto há um tempo",
    ],
  },
  {
    id: "blocker",
    bot: "O que mais te trava hoje?",
    options: [
      "Falta de dinheiro sobrando",
      "Medo de perder dinheiro",
      "Não sei por onde começar",
      "Tenho dívidas / contas apertadas",
    ],
  },
  {
    id: "whereInvest",
    bot: "Onde você já investe hoje?",
    options: [
      "Poupança / Conta remunerada",
      "Tesouro / Renda fixa",
      "Ações / FIIs",
      "Cripto",
      "Um pouco de tudo",
    ],
  },
  {
    id: "invested",
    bot: "Hoje, quanto você já tem investido (aprox.)?",
    options: [
      "Nada ainda",
      "Até R$ 1.000",
      "R$ 1.000 – R$ 5.000",
      "R$ 5.000 – R$ 20.000",
      "R$ 20.000 – R$ 50.000",
      "Acima de R$ 50.000",
    ],
  },
  {
    id: "income",
    bot: "Qual é sua renda mensal aproximada?",
    options: [
      "Até R$ 1.500",
      "R$ 1.500 – R$ 3.000",
      "R$ 3.000 – R$ 6.000",
      "R$ 6.000 – R$ 10.000",
      "Acima de R$ 10.000",
      "Prefiro não informar",
    ],
  },
  {
    id: "monthly",
    bot: "E por mês, quanto você consegue investir (aprox.)?",
    options: [
      "R$ 0 por enquanto",
      "Até R$ 100",
      "R$ 100 – R$ 300",
      "R$ 300 – R$ 800",
      "Acima de R$ 800",
    ],
  },
  {
    id: "time",
    bot: "Em quanto tempo você quer começar a ver resultados?",
    options: [
      "1–3 meses",
      "3–12 meses",
      "1–3 anos",
      "Sem pressa, quero consistência",
    ],
  },
  {
    id: "risk",
    bot: "E qual frase combina mais com você?",
    options: [
      "Prefiro segurança total",
      "Aceito um pouco de risco pra crescer mais",
      "Topo mais risco por ganhos maiores",
      "Ainda não sei",
    ],
  },
  {
    id: "dividends",
    bot: "Dividendos são um objetivo pra você?",
    options: [
      "Sim, é meu foco principal",
      "Quero, mas primeiro preciso organizar tudo",
      "Prefiro crescimento do patrimônio",
      "Ainda não sei",
    ],
  },
  {
    id: "firstDividendEmotion",
    bot: "Se você recebesse seu primeiro dividendo, qual valor já te deixaria feliz?",
    options: [
      "Qualquer valor, só pra começar",
      "R$ 10 – R$ 50",
      "R$ 50 – R$ 200",
      "R$ 200+",
    ],
  },
  {
    id: "expenseControl",
    bot: "Hoje você faz algum controle das suas despesas?",
    options: [
      "Não controlo",
      "Anoto em papel",
      "Uso planilha",
      "Uso algum app",
      "Já controlo bem",
    ],
  },
  {
    id: "coaching",
    bot: "Você se sente mais seguro(a) com acompanhamento mais próximo?",
    options: [
      "Sim, gosto de acompanhamento passo a passo",
      "Prefiro aprender sozinho(a)",
      "Depende do momento",
      "Nunca tive, mas teria interesse",
    ],
  },
  {
    id: "learning",
    bot: "E você prefere aprender como?",
    options: [
      "Passo a passo bem simples",
      "Resumo rápido + ação prática",
      "Explicação completa",
      "Um pouco de tudo",
    ],
  },
  {
    id: "done",
    bot: "Perfeito ✅ Já entendi seu perfil. Agora você pode clicar no link abaixo e agendar seu primeiro acompanhamento.",
    options: ["https://calendly.com/upmoney/meu-primeiro-dividendo", "Recomeçar"],
  },
];

export default function App() {
  // EMAIL FIRST
  const [email, setEmail] = useState("");
  const [emailOk, setEmailOk] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  // CHAT
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [answers, setAnswers] = useState({});
  const [optionsHeight, setOptionsHeight] = useState(120);

  const chatRef = useRef(null);
  const optionsRef = useRef(null);
  const didInit = useRef(false);

  // init flow after email
  useEffect(() => {
    if (!emailOk) return;
    if (didInit.current) return;
    didInit.current = true;
    pushBot(FLOW[0].bot);
  }, [emailOk]);

  // options height
  useEffect(() => {
    if (!optionsRef.current) return;
    const el = optionsRef.current;

    const update = () => {
      const h = el.getBoundingClientRect().height;
      if (h && Math.abs(h - optionsHeight) > 4) setOptionsHeight(h);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, typing, messages.length]);

  // scroll
  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing, optionsHeight]);

  function pushBot(text) {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text }]);
      setTyping(false);
    }, 450);
  }

  function pushUser(text) {
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  async function handleFinishSave(finalAnswers) {
    try {
      await saveOnboardingByEmail({ email, answers: finalAnswers });
    } catch (e) {
      console.warn("[Onboarding] Não salvou no Supabase:", e?.message || e);
      try {
        localStorage.setItem(
          "onboarding_backup_answers",
          JSON.stringify({ savedAt: new Date().toISOString(), email, answers: finalAnswers })
        );
      } catch {}
    }
  }

  function startWithEmail() {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setEmailMsg("Digite um e-mail válido.");
      return;
    }
    setEmail(clean);
    setEmailMsg("");
    setEmailOk(true);
  }

  function handleOptionClick(opt) {
    if (opt === "Recomeçar") {
      setMessages([]);
      setStep(0);
      setAnswers({});
      setTyping(false);
      setTimeout(() => pushBot(FLOW[0].bot), 200);
      return;
    }

    const currentId = FLOW[step]?.id;
    const nextStep = step + 1;

    const nextAnswers = currentId ? { ...answers, [currentId]: opt } : answers;

    // Se clicou no link: salva e abre
    if (/^https?:\/\//i.test(opt)) {
      handleFinishSave(nextAnswers);
      window.open(opt, "_blank", "noopener,noreferrer");
      return;
    }

    pushUser(opt);

    if (currentId) setAnswers(nextAnswers);

    if (FLOW[nextStep]?.id === "done") {
      handleFinishSave(nextAnswers);
    }

    setStep(nextStep);
    if (FLOW[nextStep]) setTimeout(() => pushBot(FLOW[nextStep].bot), 180);
  }

  // tela do email
  if (!emailOk) {
    return (
      <div className="page">
        <div className="cardAuth">
          <div className="title">upmoney</div>
          <div className="subtitle">Para começar, digite seu e-mail</div>

          <input
            className="input"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button className="btn" onClick={startWithEmail}>
            Continuar
          </button>

          {!!emailMsg && <div className="msg">{emailMsg}</div>}
        </div>
      </div>
    );
  }

  const lastMsg = messages[messages.length - 1];
  const showOptions = !typing && FLOW[step]?.options && lastMsg?.from === "bot";

  return (
    <div style={{ width: "100vw", height: "100dvh", background: "#f6f7fb" }}>
      <div style={{ width: "100%", height: "100%", background: "white", display: "flex", flexDirection: "column" }}>
        <div
          ref={chatRef}
          style={{ flex: 1, overflowY: "auto", padding: 16, paddingBottom: optionsHeight + 20 }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  maxWidth: "86%",
                  padding: "10px 12px",
                  borderRadius: 16,
                  background: m.from === "user" ? "#2563eb" : "#fff",
                  color: m.from === "user" ? "#fff" : "#111",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && <div>digitando•••</div>}
        </div>

        {showOptions && (
          <div ref={optionsRef} style={{ padding: 12, borderTop: "1px solid #eee" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {FLOW[step].options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionClick(opt)}
                  style={{ padding: "12px 14px", borderRadius: 999, cursor: "pointer" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
