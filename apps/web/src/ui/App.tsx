import React, { useEffect, useMemo, useState } from "react";
import { aggregateMtf, type Candle } from "@tradai/domain";
import { fetchKlines, fetchMtfSignal } from "../services/api";
import { useAppStore } from "../state/store";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { AssistantWidget } from "./components/AssistantWidget";

const INTERVALS = ["1m","5m","15m","1h","4h","12h","1d","1w"] as const;

export function App() {
  const symbol = useAppStore(s => s.symbol);
  const interval = useAppStore(s => s.interval);
  const candles = useAppStore(s => s.candles);
  const paper = useAppStore(s => s.paper);
  const lastSignal = useAppStore(s => s.lastSignal);

  const setSymbol = useAppStore(s => s.setSymbol);
  const setInterval = useAppStore(s => s.setInterval);
  const setCandles = useAppStore(s => s.setCandles);
  const setLastSignal = useAppStore(s => s.setLastSignal);

  const openLong = useAppStore(s => s.openLong);
  const openShort = useAppStore(s => s.openShort);
  const close = useAppStore(s => s.close);
  const applySlTp = useAppStore(s => s.applySlTp);
  const addToast = useAppStore(s => s.addToast);

  const [loading, setLoading] = useState(false);

  const [confirm, setConfirm] = useState<null | { title: string; msg: string; onYes: () => void }>(null);

  const lastPrice = candles.at(-1)?.close ?? NaN;

  async function load() {
    setLoading(true);
    try {
      const cs = await fetchKlines(symbol, interval, 300);
      setCandles(cs);
    } finally {
      setLoading(false);
    }
  }

  // Initial + on changes
  useEffect(() => { void load(); }, [symbol, interval]);

  const mtfPreview = useMemo(() => {
    if (!candles.length) return null;
    // preview just for current frame; real MTF uses multi-fetch
    const frames = { [interval]: candles } as Record<string, Candle[]>;
    return aggregateMtf(symbol, frames);
  }, [symbol, interval, candles]);

  async function runMtfAnalysis() {
    setLoading(true);
    try {
      // Fetch required frames concurrently
      const wanted = ["1m","5m","15m","1h","4h","12h","1d","1w"];
      const picked = new Set([interval, "1h", "4h", "1d"]); // minimal default
      // If user selected higher TF, include it; also include 15m for local context
      picked.add("15m");
      for (const w of wanted) if (picked.has(w) === false && (w === interval)) picked.add(w);

      const framesList = Array.from(picked);
      const results = await Promise.all(framesList.map(iv => fetchKlines(symbol, iv, 300)));
      const frames: Record<string, Candle[]> = {};
      framesList.forEach((iv, i) => { frames[iv] = results[i]!; });

      const signal = await fetchMtfSignal({ symbol, interval, frames });
      setLastSignal(signal);
      addToast("Zaktualizowano analizę MTF (scaffold).");
    } catch {
      addToast("Błąd analizy MTF. Sprawdź API.");
    } finally {
      setLoading(false);
    }
  }

  function confirmOpen(side: "LONG" | "SHORT") {
    setConfirm({
      title: `Otworzyć pozycję ${side}?`,
      msg: `Symbol: ${symbol}. To jest paper trading. Potwierdź, jeśli chcesz otworzyć pozycję rynkową.`,
      onYes: () => {
        if (!Number.isFinite(lastPrice)) return;
        if (side === "LONG") openLong(lastPrice);
        else openShort(lastPrice);
        addToast(`Otwarta pozycja ${side}.`);
        setConfirm(null);
      }
    });
  }

  function confirmClose() {
    setConfirm({
      title: "Zamknąć pozycję?",
      msg: `Zamknąć aktualną pozycję rynkowo po cenie z wykresu?`,
      onYes: () => {
        if (!Number.isFinite(lastPrice)) return;
        close(lastPrice, "MANUAL");
        addToast("Pozycja zamknięta.");
        setConfirm(null);
      }
    });
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ fontWeight: 900 }}>TRADAI</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={styles.label}>
            Para:
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={styles.select}>
              {["BTCUSDT","ETHUSDT","SOLUSDT","DOGEUSDT"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label style={styles.label}>
            Interwał:
            <select value={interval} onChange={(e) => setInterval(e.target.value)} style={styles.select}>
              {INTERVALS.map(iv => <option key={iv} value={iv}>{iv}</option>)}
            </select>
          </label>

          <button onClick={load} style={styles.btn}>Odśwież świece</button>
          <button onClick={runMtfAnalysis} style={styles.btnPrimary}>Analiza MTF</button>
        </div>
      </header>

      <main style={styles.grid}>
        <section style={styles.card}>
          <div style={styles.cardTitle}>Wykres (scaffold)</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>Tu podłączymy lightweight-charts (kolejny krok). Na razie wyświetlamy ostatnią cenę i liczbę świec.</div>
          <div style={{ marginTop: 12 }}>
            <div>Świece: <b>{candles.length}</b></div>
            <div>Ostatnia cena: <b>{Number.isFinite(lastPrice) ? lastPrice.toFixed(2) : "—"}</b></div>
          </div>
          {paper.position && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontWeight: 800 }}>Aktywna pozycja</div>
              <div>Side: <b>{paper.position.side}</b></div>
              <div>Entry: <b>{paper.position.entryPrice.toFixed(2)}</b></div>
              <div>SL: <b>{paper.position.stopLoss ?? "—"}</b> | TP: <b>{paper.position.takeProfit ?? "—"}</b></div>
            </div>
          )}
        </section>

        <section style={styles.card}>
          <div style={styles.cardTitle}>Trade Panel (scaffold)</div>

          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={() => confirmOpen("LONG")} style={styles.btnGreen}>Open LONG</button>
            <button onClick={() => confirmOpen("SHORT")} style={styles.btnRed}>Open SHORT</button>
            <button disabled={!paper.position} onClick={confirmClose} style={styles.btn}>Close</button>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ opacity: 0.8 }}>SL/TP:</span>
            <input placeholder="Stop Loss" type="number" style={styles.input}
              onBlur={(e) => {
                const sl = e.target.value ? Number(e.target.value) : undefined;
                applySlTp(sl, paper.position?.takeProfit);
              }}
            />
            <input placeholder="Take Profit" type="number" style={styles.input}
              onBlur={(e) => {
                const tp = e.target.value ? Number(e.target.value) : undefined;
                applySlTp(paper.position?.stopLoss, tp);
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div>Saldo (paper): <b>{paper.balance.toFixed(2)} USDT</b></div>
            <div>Pozycja: <b>{paper.position ? `${paper.position.side} @ ${paper.position.entryPrice.toFixed(2)}` : "brak"}</b></div>
            <div>Transakcje: <b>{paper.trades.length}</b></div>
          </div>

          <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Ostatni sygnał</div>
            {lastSignal ? (
              <>
                <div>Akcja: <b>{lastSignal.action}</b> | Pewność: <b>{lastSignal.confidence}%</b></div>
                <div style={{ marginTop: 6, opacity: 0.9, whiteSpace: "pre-wrap" }}>{lastSignal.reasoning}</div>
              </>
            ) : (
              <div style={{ opacity: 0.8 }}>Brak — kliknij “Analiza MTF”.</div>
            )}
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardTitle}>MTF Preview</div>
          {mtfPreview ? (
            <div style={{ fontSize: 13 }}>
              <div>Macro bias: <b>{mtfPreview.macroBias}</b> ({mtfPreview.macroStrength}%)</div>
              <div style={{ marginTop: 8 }}>
                {mtfPreview.frames.map(f => (
                  <div key={f.interval} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span>{f.interval}</span>
                    <span>{f.trendBias} ({f.strength}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ opacity: 0.8 }}>Załaduj świece, aby zobaczyć podgląd.</div>
          )}
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={{ opacity: 0.8 }}>{loading ? "Ładowanie…" : "Gotowe."}</div>
      </footer>

      <ConfirmationModal
        open={!!confirm}
        title={confirm?.title ?? ""}
        message={confirm?.msg ?? ""}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onYes()}
        confirmText="Tak, wykonaj"
      />

      <Toasts />
      <AssistantWidget />
    </div>
  );
}

function Toasts() {
  const toasts = useAppStore(s => s.toasts);
  const remove = useAppStore(s => s.removeToast);
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", left: 16, bottom: 16, zIndex: 45, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: "#111827", color: "white", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px", minWidth: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ opacity: 0.95 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0b1220", color: "white" },
  header: { padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" },
  footer: { padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)" },
  grid: { padding: 14, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, padding: 14 },
  cardTitle: { fontWeight: 900, marginBottom: 8 },
  btn: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "transparent", color: "white", padding: "10px 12px", cursor: "pointer" },
  btnPrimary: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "#a78bfa", color: "#0b1220", padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
  btnGreen: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "#22c55e", color: "#071018", padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
  btnRed: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "#ef4444", color: "#071018", padding: "10px 12px", cursor: "pointer", fontWeight: 900 },
  label: { display: "flex", alignItems: "center", gap: 8, opacity: 0.9 },
  select: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "white", padding: "10px 12px", outline: "none" },
  input: { width: 140, borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "white", padding: "10px 12px", outline: "none" }
};
