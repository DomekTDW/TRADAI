import React, { useMemo, useState } from "react";
import { chat } from "../../services/api";
import { useAppStore } from "../../state/store";

type Msg = { role: "user" | "assistant"; content: string };

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Cześć. Jestem Asystentem TRADAI. Zapytaj o ostatni sygnał lub MTF." }
  ]);

  const lastSignal = useAppStore(s => s.lastSignal);

  const context = useMemo(() => {
    if (!lastSignal) return "Brak ostatniego sygnału.";
    return [
      "Ostatni sygnał (kontekst do Q&A):",
      `Symbol: ${lastSignal.symbol}`,
      `Interwał: ${lastSignal.interval}`,
      `Akcja: ${lastSignal.action}, Pewność: ${lastSignal.confidence}%`,
      `Uzasadnienie: ${lastSignal.reasoning}`,
      lastSignal.mtf ? `MTF: macroBias=${lastSignal.mtf.macroBias}, strength=${lastSignal.mtf.macroStrength}%` : "MTF: brak"
    ].join("\n");
  }, [lastSignal]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content: text }]);

    try {
      const payload = [
        { role: "system" as const, content: "Odpowiadaj po polsku. Odpowiadaj krótko i rzeczowo. Nie wymyślaj danych." },
        { role: "system" as const, content: context },
        ...messages.map(m => ({ role: m.role as any, content: m.content })),
        { role: "user" as const, content: text }
      ];
      const r = await chat(payload);
      setMessages(m => [...m, { role: "assistant", content: r.reply ?? "(brak odpowiedzi)" }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: "Błąd czatu. Sprawdź apps/api i /ai/chat." }]);
    }
  }

  return (
    <div style={wrap}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={fab}>Asystent</button>
      ) : (
        <div style={panel}>
          <div style={header}>
            <div style={{ fontWeight: 800 }}>Asystent</div>
            <button onClick={() => setOpen(false)} style={xbtn}>✕</button>
          </div>
          <div style={body}>
            {messages.slice(-12).map((m, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ ...bubble, background: m.role === "user" ? "#22c55e" : "rgba(255,255,255,0.08)", color: m.role==="user" ? "#071018" : "white" }}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div style={composer}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Napisz pytanie…"
              style={inputStyle}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            />
            <button onClick={send} style={sendBtn}>Wyślij</button>
          </div>
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = { position: "fixed", right: 16, bottom: 16, zIndex: 40 };
const fab: React.CSSProperties = { borderRadius: 999, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.18)", background: "#111827", color: "white", fontWeight: 800, cursor: "pointer", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" };
const panel: React.CSSProperties = { width: "min(380px, calc(100vw - 32px))", height: "min(420px, calc(100vh - 80px))", background: "#0b1220", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column" };
const header: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" };
const xbtn: React.CSSProperties = { background: "transparent", border: "none", color: "white", fontSize: 18, cursor: "pointer" };
const body: React.CSSProperties = { flex: 1, padding: 10, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 };
const bubble: React.CSSProperties = { maxWidth: "86%", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", whiteSpace: "pre-wrap", lineHeight: 1.35 };
const composer: React.CSSProperties = { display: "flex", gap: 8, padding: 10, borderTop: "1px solid rgba(255,255,255,0.08)" };
const inputStyle: React.CSSProperties = { flex: 1, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", padding: "10px 12px", outline: "none" };
const sendBtn: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "#22c55e", color: "#071018", fontWeight: 800, padding: "10px 12px", cursor: "pointer" };
