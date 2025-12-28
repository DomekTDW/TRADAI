import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  GEMINI_API_KEY: req("GEMINI_API_KEY"),
  BINANCE_FUTURES_REST: process.env.BINANCE_FUTURES_REST ?? "https://fapi.binance.com",
  BINANCE_FUTURES_WS: process.env.BINANCE_FUTURES_WS ?? "wss://fstream.binance.com/ws",
  PORT: Number(process.env.PORT ?? 8787),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173"
};
