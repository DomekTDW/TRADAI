export type Side = "LONG" | "SHORT";
export type Action = "LONG" | "SHORT" | "FLAT";

export type Candle = {
  openTime: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MtfFrame = {
  interval: string; // "1m" | "5m" | ...
  lastClose: number;
  rsi14: number | null;
  ema20: number | null;
  ema50: number | null;
  atr14: number | null;
  trendBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  strength: number; // 0..100
};

export type MtfMatrix = {
  symbol: string;
  frames: MtfFrame[];
  macroBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  macroStrength: number; // 0..100
  notes: string[];
};

export type TradeSignal = {
  symbol: string;
  interval: string;
  action: Action;
  confidence: number; // 0..100
  reasoning: string;
  stopLoss?: number;
  takeProfit?: number;
  mtf?: MtfMatrix;
  createdAt: number; // ms
};

export type PaperPosition = {
  symbol: string;
  side: Side;
  qty: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: number;
  reasoning?: string;
};

export type PaperTrade = {
  symbol: string;
  side: Side;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  feesPaid: number;
  pnl: number;
  openedAt: number;
  closedAt: number;
  reason: "MANUAL" | "SL" | "TP" | "REVERSE" | "LIQ" | "AUTO";
  aiReasoning?: string;
};
