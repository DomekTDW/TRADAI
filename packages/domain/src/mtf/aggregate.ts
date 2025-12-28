import type { Candle, MtfFrame, MtfMatrix } from "../types.js";
import { rsi14 } from "../indicators/rsi.js";
import { ema } from "../indicators/ema.js";
import { atr } from "../indicators/atr.js";

export function computeFrame(interval: string, candles: Candle[]): MtfFrame {
  const last = candles.at(-1);
  const lastClose = last?.close ?? NaN;

  const ema20 = ema(candles, 20);
  const ema50 = ema(candles, 50);
  const rsi = rsi14(candles, 14);
  const atr14 = atr(candles, 14);

  let trendBias: MtfFrame["trendBias"] = "NEUTRAL";
  let strength = 50;

  if (ema20 != null && ema50 != null) {
    const diff = ema20 - ema50;
    const rel = Math.abs(diff) / (lastClose || 1);
    if (diff > 0) trendBias = "BULLISH";
    else if (diff < 0) trendBias = "BEARISH";
    strength = Math.max(0, Math.min(100, Math.round(50 + (diff > 0 ? 1 : -1) * rel * 5000)));
  }

  // RSI tilt (light)
  if (rsi != null) {
    if (rsi > 60 && trendBias === "BULLISH") strength = Math.min(100, strength + 10);
    if (rsi < 40 && trendBias === "BEARISH") strength = Math.min(100, strength + 10);
  }

  return {
    interval,
    lastClose,
    rsi14: rsi,
    ema20,
    ema50,
    atr14,
    trendBias,
    strength
  };
}

export function aggregateMtf(symbol: string, data: Record<string, Candle[]>): MtfMatrix {
  const frames: MtfFrame[] = Object.entries(data).map(([interval, candles]) =>
    computeFrame(interval, candles)
  );

  // Macro bias: weighted by higher TFs if present
  const weights: Record<string, number> = { "1m": 1, "5m": 1.5, "15m": 2, "1h": 3, "4h": 4, "12h": 4.5, "1d": 6, "1w": 8 };
  let score = 0;
  let wsum = 0;

  for (const f of frames) {
    const w = weights[f.interval] ?? 1;
    wsum += w;
    if (f.trendBias === "BULLISH") score += w;
    else if (f.trendBias === "BEARISH") score -= w;
  }

  const norm = wsum === 0 ? 0 : score / wsum; // -1..1
  let macroBias: MtfMatrix["macroBias"] = "NEUTRAL";
  if (norm > 0.15) macroBias = "BULLISH";
  else if (norm < -0.15) macroBias = "BEARISH";

  const macroStrength = Math.round(Math.min(100, Math.abs(norm) * 100));

  const notes: string[] = [];
  notes.push(`Macro bias: ${macroBias} (${macroStrength}%)`);

  return { symbol, frames, macroBias, macroStrength, notes };
}
