import { useEffect, useRef, useState } from "react";
import "./App.css";
import { saveOnboarding } from "./services/onboardingService";

/* ====== FLOW (inalterado + email como primeiro passo) ====== */
const FLOW = [
  { id: "email", bot: "Para começar, digite seu e-mail 😊", type: "input_email" },
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
    options: ["Qualquer valor, só pra começar", "R$ 10 – R$ 50", "R$ 50 – R$ 200", "R$ 200+",],
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

function normalizeEmail(v) {
  return (v || "").trim().toLowerCase();
}
function isValidEmail(v) {
  const e = normalizeEmail(v);
  return e.includes("@") && e.includes(".") && e.length >= 6;
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [answers, setAnswers] = useState({});
  const [optionsHeight, setOptionsHeight] = useState(0);

  // email state (primeiro passo)
  const [emailInput, setEmailInput] = useState("");
  const [userEmail, setUserEmail] = useState(null);

  const chatRef = useRef(null);
  const optionsRef = useRef(null);
  const didInit = useRef(false);

  /* ====== 🔊 AUDIO CONTEXT ====== */
  const audioCtxRef = useRef(null);
  const soundEnabledRef = useRef(false);

  function ensureAudioEnabled() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      soundEnabledRef.current = true;
    }
  }

  function playPop() {
    if (!soundEnabledRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 880;

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  /* ====== ✅ SAVE (por e-mail) ====== */
  async function handleFinishSave(finalAnswers) {
    try {
      await saveOnboarding(finalAnswers, userEmail);
    } catch (e) {
      console.warn("[Onboarding] Não salvou no Supabase:", e?.message || e);
      try {
        localStorage.setItem(
          "onboarding_backup_answers",
          JSON.stringify({
            savedAt: new Date().toISOString(),
            email: userEmail,
            answers: finalAnswers,
          })
        );
      } catch {}
    }
  }

  /* ====== INIT ====== */
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    pushBot(FLOW[0].bot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ====== OPTIONS HEIGHT (para o chat não ficar escondido atrás) ====== */
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

  /* ====== SCROLL ====== */
  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing, optionsHeight]);

  /* ====== HELPERS ====== */
  function pushBot(text) {
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text }]);
      playPop();
      setTyping(false);
    }, 450);
  }

  function pushUser(text) {
    if (navigator.vibrate) navigator.vibrate(12);
    setMessages((prev) => [...prev, { from: "user", text }]);
  }

  function restart() {
    setMessages([]);
    setStep(0);
    setAnswers({});
    setTyping(false);
    setEmailInput("");
    setUserEmail(null);
    setOptionsHeight(0);
    setTimeout(() => pushBot(FLOW[0].bot), 200);
  }

  function goNextStepAndAskBot() {
    const nextStep = step + 1;
    setStep(nextStep);
    if (FLOW[nextStep]) setTimeout(() => pushBot(FLOW[nextStep].bot), 200);
  }

  function handleEmailContinue() {
    ensureAudioEnabled();

    const clean = normalizeEmail(emailInput);
    if (!isValidEmail(clean)) {
      pushBot("Hmm… esse e-mail parece inválido. Pode conferir e tentar de novo?");
      return;
    }

    setUserEmail(clean);
    pushUser(clean);

    // guarda no answers também (para ficar no JSON final)
    setAnswers((prev) => ({ ...prev, email: clean }));

    goNextStepAndAskBot();
  }

  function handleOptionClick(opt) {
    ensureAudioEnabled();

    if (opt === "Recomeçar") {
      restart();
      return;
    }

    const currentId = FLOW[step]?.id;

    // Link externo (Calendly): salva antes e depois abre
    if (/^https?:\/\//i.test(opt)) {
      const nextAnswers = currentId ? { ...answers, [currentId]: opt } : answers;
      handleFinishSave(nextAnswers);
      window.open(opt, "_blank", "noopener,noreferrer");
      return;
    }

    pushUser(opt);

    const nextStep = step + 1;
    const nextAnswers = currentId ? { ...answers, [currentId]: opt } : answers;

    if (currentId) setAnswers(nextAnswers);

    // se o próximo step for "done", salva ANTES de mostrar done
    if (FLOW[nextStep]?.id === "done") {
      handleFinishSave(nextAnswers);
    }

    setStep(nextStep);
    if (FLOW[nextStep]) setTimeout(() => pushBot(FLOW[nextStep].bot), 200);
  }

  const lastMsg = messages[messages.length - 1];
  const currentStep = FLOW[step];

  const showOptions =
    !typing &&
    currentStep?.options &&
    lastMsg?.from === "bot" &&
    currentStep?.id !== "email";

  const showEmailInput =
    !typing && currentStep?.id === "email" && lastMsg?.from === "bot";

  // ✅ ajuste sugerido: quando não há painel, zera optionsHeight (evita “sobrar espaço”)
  useEffect(() => {
    if (!showOptions && !showEmailInput) setOptionsHeight(0);
  }, [showOptions, showEmailInput]);

  return (
    <div className="page">
      <div className="phone">
        <div className="topbar">
          <div className="brand">upmoney</div>
          <div className="dot" />
        </div>

        <div
          ref={chatRef}
          className="chat"
          style={{ paddingBottom: optionsHeight + 20 }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`row ${m.from === "user" ? "rowUser" : "rowBot"}`}
            >
              <div className={`bubble ${m.from}`}>
                <span>{m.text}</span>
              </div>
            </div>
          ))}
          {typing && <div className="typing">digitando•••</div>}
        </div>

        {showEmailInput && (
          <div ref={optionsRef} className="panel">
            <div className="emailBox">
              <input
                className="emailInput"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="seuemail@exemplo.com"
                inputMode="email"
                autoComplete="email"
              />
              <button className="primaryBtn" onClick={handleEmailContinue}>
                Continuar
              </button>
            </div>
            <div className="hint">
              Usaremos seu e-mail para salvar e atualizar seu questionário.
            </div>
          </div>
        )}

        {showOptions && (
          <div ref={optionsRef} className="panel">
            <div className="options">
              {currentStep.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleOptionClick(opt)}
                  className={/^https?:\/\//i.test(opt) ? "linkBtn" : "pillBtn"}
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
