import type { Candle } from "../types.js";

export function ema(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  const k = 2 / (period + 1);
  // SMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i]!.close;
  let value = sum / period;

  for (let i = period; i < candles.length; i++) {
    value = candles[i]!.close * k + value * (1 - k);
  }
  return value;
}
