import type { FastifyInstance } from "fastify";
import { env } from "../env.js";

type Kline = any[];

function toNumber(x: unknown) {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

export async function marketRoutes(app: FastifyInstance) {
  // Futures klines: /fapi/v1/klines?symbol=BTCUSDT&interval=15m&limit=300
  app.get("/market/klines", async (req, res) => {
    const q = req.query as any;
    const symbol = String(q.symbol ?? "BTCUSDT").toUpperCase();
    const interval = String(q.interval ?? "15m");
    const limit = Math.min(1500, Math.max(10, Number(q.limit ?? 300)));

    const url = new URL(env.BINANCE_FUTURES_REST + "/fapi/v1/klines");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", String(limit));

    const r = await fetch(url.toString());
    if (!r.ok) return res.code(502).send({ error: "BINANCE_KLINES_FAILED" });

    const data = (await r.json()) as Kline[];
    // Return minimal normalized candles
    const candles = data.map(k => ({
      openTime: toNumber(k[0]),
      open: toNumber(k[1]),
      high: toNumber(k[2]),
      low: toNumber(k[3]),
      close: toNumber(k[4]),
      volume: toNumber(k[5])
    }));
    return { symbol, interval, candles };
  });
}
