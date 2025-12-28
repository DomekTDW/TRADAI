import type { FastifyInstance } from "fastify";
import { aggregateMtf, type Candle, type TradeSignal } from "@tradai/domain";
import { env } from "../env.js";

// NOTE: This is a scaffold. Replace the "mock" Gemini call with real Gemini SDK or REST call.
// We keep it server-side to avoid exposing keys.

function mustNumber(x: unknown) {
  const n = Number(x);
  if (!Number.isFinite(n)) throw new Error("Invalid number");
  return n;
}

export async function aiRoutes(app: FastifyInstance) {
  app.post("/ai/mtf-signal", async (req, res) => {
    const body = req.body as any;
    const symbol = String(body.symbol ?? "BTCUSDT").toUpperCase();
    const interval = String(body.interval ?? "15m");
    const frames = body.frames as Record<string, Candle[]>;

    if (!frames || typeof frames !== "object") return res.code(400).send({ error: "BAD_FRAMES" });

    const mtf = aggregateMtf(symbol, frames);

    // --- Placeholder: Gemini output should be in Polish and based on mtf matrix.
    const signal: TradeSignal = {
      symbol,
      interval,
      action: mtf.macroBias === "BULLISH" ? "LONG" : mtf.macroBias === "BEARISH" ? "SHORT" : "FLAT",
      confidence: Math.max(50, mtf.macroStrength),
      reasoning: `Syntetyczna analiza MTF: bias = ${mtf.macroBias}, siła = ${mtf.macroStrength}%. (Scaffold — podłącz Gemini w apps/api/src/services/gemini.ts)`,
      stopLoss: undefined,
      takeProfit: undefined,
      mtf,
      createdAt: Date.now()
    };

    return { signal };
  });

  app.post("/ai/chat", async (req, res) => {
    // Chat proxy scaffold: do not expose API key to web.
    const body = req.body as any;
    const messages = body.messages ?? [];
    return {
      reply: "Scaffold: endpoint /ai/chat działa. Podłącz Gemini i policy tool-calls po stronie backendu.",
      messagesCount: Array.isArray(messages) ? messages.length : 0
    };
  });
}
