import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

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
    options: ["Não, ainda não", "Sim, comecei recentemente", "Sim, já invisto há um tempo"],
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
    options: ["Poupança / Conta remunerada", "Tesouro / Renda fixa", "Ações / FIIs", "Cripto", "Um pouco de tudo"],
  },
  {
    id: "invested",
    bot: "Hoje, quanto você já tem investido (aprox.)?",
    options: ["Nada ainda", "Até R$ 1.000", "R$ 1.000 – R$ 5.000", "R$ 5.000 – R$ 20.000", "R$ 20.000 – R$ 50.000", "Acima de R$ 50.000"],
  },
  {
    id: "income",
    bot: "Qual é sua renda mensal aproximada?",
    options: ["Até R$ 1.500", "R$ 1.500 – R$ 3.000", "R$ 3.000 – R$ 6.000", "R$ 6.000 – R$ 10.000", "Acima de R$ 10.000", "Prefiro não informar"],
  },
  {
    id: "monthly",
    bot: "E por mês, quanto você consegue investir (aprox.)?",
    options: ["R$ 0 por enquanto", "Até R$ 100", "R$ 100 – R$ 300", "R$ 300 – R$ 800", "Acima de R$ 800"],
  },
  {
    id: "time",
    bot: "Em quanto tempo você quer começar a ver resultados?",
    options: ["1–3 meses", "3–12 meses", "1–3 anos", "Sem pressa, quero consistência"],
  },
  {
    id: "risk",
    bot: "E qual frase combina mais com você?",
    options: ["Prefiro segurança total", "Aceito um pouco de risco pra crescer mais", "Topo mais risco por ganhos maiores", "Ainda não sei"],
  },
  {
    id: "dividends",
    bot: "Dividendos são um objetivo pra você?",
    options: ["Sim, é meu foco principal", "Quero, mas primeiro preciso organizar tudo", "Prefiro crescimento do patrimônio", "Ainda não sei"],
  },
  {
    id: "firstDividendEmotion",
    bot: "Se você recebesse seu primeiro dividendo, qual valor já te deixaria feliz?",
    options: ["Qualquer valor, só pra começar", "R$ 10 – R$ 50", "R$ 50 – R$ 200", "R$ 200+"],
  },
  {
    id: "expenseControl",
    bot: "Hoje você faz algum controle das suas despesas?",
    options: ["Não controlo", "Anoto em papel", "Uso planilha", "Uso algum app", "Já controlo bem"],
  },
  {
    id: "coaching",
    bot: "Você se sente mais seguro(a) com acompanhamento mais próximo?",
    options: ["Sim, gosto de acompanhamento passo a passo", "Prefiro aprender sozinho(a)", "Depende do momento", "Nunca tive, mas teria interesse"],
  },
  {
    id: "learning",
    bot: "E você prefere aprender como?",
    options: ["Passo a passo bem simples", "Resumo rápido + ação prática", "Explicação completa", "Um pouco de tudo"],
  },
  {
    id: "done",
    bot: "Perfeito ✅ Já entendi seu perfil. Agora você pode clicar no link abaixo e agendar seu primeiro acompanhamento.",
    options: ["https://calendly.com/upmoney/meu-primeiro-dividendo", "Recomeçar"],
  },
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [answers, setAnswers] = useState({});
  const [optionsHeight, setOptionsHeight] = useState(120);

  const chatRef = useRef(null);
  const optionsRef = useRef(null);
  const didInit = useRef(false);

  const currentStep = useMemo(() => FLOW[step], [step]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    pushBot(FLOW[0].bot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ mede altura real do bloco de opções (para nunca ficar encoberto no mobile)
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

  // ✅ auto-scroll mantendo a última mensagem visível + espaço das opções
  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing, optionsHeight]);

  function pushBot(text) {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text }]);
      setTyping(false);
    }, 650);
  }

  function pushUser(text) {
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  function resetFlow() {
    setMessages([]);
    setStep(0);
    setTyping(false);
    setAnswers({});
    setTimeout(() => pushBot(FLOW[0].bot), 200);
  }

  function handleOptionClick(opt) {
    if (opt === "Recomeçar") {
      resetFlow();
      return;
    }

    // ✅ se for link (Calendly), abre em nova aba
    if (/^https?:\/\//i.test(opt)) {
      window.open(opt, "_blank", "noopener,noreferrer");
      return;
    }

    pushUser(opt);

    if (currentStep?.id) {
      setAnswers((prev) => ({ ...prev, [currentStep.id]: opt }));
    }

    let next = step + 1;

    // regras de pulo (mantidas)
    if (FLOW[next]?.id === "blocker" && answers?.alreadyInvest && answers?.alreadyInvest !== "Não, ainda não") {
      next += 1;
    }

    if (FLOW[next]?.id === "whereInvest" && answers?.alreadyInvest === "Não, ainda não") {
      next += 1;
    }

    setStep(next);

    if (FLOW[next]) {
      setTimeout(() => pushBot(FLOW[next].bot), 220);
    }
  }

  const lastMsg = messages[messages.length - 1];
  const showOptions = !typing && currentStep?.options?.length && lastMsg?.from === "bot";

  return (
    <>
      {/* ✅ CSS mínimo pra garantir 100% mobile-friendly sem mexer no App.css */}
      <style>{`
        html, body, #root { height: 100%; }
        body { margin: 0; overflow: hidden; }
        /* iOS safe areas */
        .safeBottom { padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
      `}</style>

      <div
        style={{
          height: "100dvh", // ✅ viewport dinâmico real no mobile
          background: "#f6f7fb",
          display: "flex",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            height: "100%",
            background: "white",
            borderRadius: 0, // ✅ melhor no mobile (full screen)
            overflow: "hidden",
            boxShadow: "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* CHAT (única área rolável) */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              padding: 16,
              // ✅ deixa espaço pra área de botões embaixo (nunca encobre)
              paddingBottom: optionsHeight + 18,
              background: "linear-gradient(180deg, rgba(246,247,251,1) 0%, rgba(255,255,255,1) 100%)",
            }}
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
                    background: m.from === "user" ? "#2563eb" : "white",
                    color: m.from === "user" ? "white" : "#111827",
                    border: m.from === "user" ? "1px solid rgba(37,99,235,0.25)" : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: m.from === "user" ? "0 8px 18px rgba(37,99,235,0.14)" : "0 8px 18px rgba(0,0,0,0.04)",
                    fontSize: 15,
                    lineHeight: 1.35,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 16,
                    fontSize: 14,
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.08)",
                    color: "#6b7280",
                  }}
                >
                  digitando<span style={{ marginLeft: 6 }}>•••</span>
                </div>
              </div>
            )}
          </div>

          {/* OPTIONS (fixas embaixo, sem “encobrir”) */}
          <div
            ref={optionsRef}
            className="safeBottom"
            style={{
              position: "sticky",
              bottom: 0,
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(10px)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              padding: 12,
            }}
          >
            {showOptions && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  justifyContent: "center",
                }}
              >
                {currentStep.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionClick(opt)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 650,
                      fontSize: 14,
                      maxWidth: "100%",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
