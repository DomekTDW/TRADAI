import type { Candle, TradeSignal } from "@tradai/domain";

const API_BASE = "http://localhost:8787";

export async function fetchKlines(symbol: string, interval: string, limit = 300): Promise<Candle[]> {
  const url = new URL(API_BASE + "/market/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error("Klines fetch failed");
  const j = await r.json();
  return j.candles as Candle[];
}

export async function fetchMtfSignal(params: {
  symbol: string;
  interval: string;
  frames: Record<string, Candle[]>;
}): Promise<TradeSignal> {
  const r = await fetch(API_BASE + "/ai/mtf-signal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!r.ok) throw new Error("MTF signal failed");
  const j = await r.json();
  return j.signal as TradeSignal;
}

export async function chat(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>) {
  const r = await fetch(API_BASE + "/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  });
  if (!r.ok) throw new Error("Chat failed");
  return r.json();
}
