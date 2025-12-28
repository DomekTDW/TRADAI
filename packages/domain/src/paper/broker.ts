import type { PaperPosition, PaperTrade, Side } from "../types.js";

export type BrokerConfig = {
  makerFeeBps: number; // e.g. 2 = 0.02%
  takerFeeBps: number; // e.g. 5 = 0.05%
  slippageBps: number; // e.g. 2 = 0.02%
};

export type PaperState = {
  balance: number;
  position: PaperPosition | null;
  trades: PaperTrade[];
};

export function createPaperState(initialBalance = 10_000): PaperState {
  return { balance: initialBalance, position: null, trades: [] };
}

function fee(notional: number, bps: number) {
  return (notional * bps) / 10_000;
}

function applySlippage(price: number, side: Side, bps: number) {
  const slip = (price * bps) / 10_000;
  return side === "LONG" ? price + slip : price - slip;
}

/**
 * Market open (paper). Returns new state.
 */
export function openMarket(
  s: PaperState,
  cfg: BrokerConfig,
  symbol: string,
  side: Side,
  qty: number,
  price: number,
  meta?: { stopLoss?: number; takeProfit?: number; reasoning?: string; reason?: "MANUAL" | "AUTO" }
): PaperState {
  if (s.position) {
    // simplistic: forbid stacking; caller should close or reverse explicitly
    return s;
  }
  const fill = applySlippage(price, side, cfg.slippageBps);
  const notional = fill * qty;
  const fees = fee(notional, cfg.takerFeeBps);

  // For paper we deduct fees immediately
  const balance = s.balance - fees;

  const position: PaperPosition = {
    symbol,
    side,
    qty,
    entryPrice: fill,
    stopLoss: meta?.stopLoss,
    takeProfit: meta?.takeProfit,
    openedAt: Date.now(),
    reasoning: meta?.reasoning
  };

  return { ...s, balance, position };
}

/**
 * Market close (paper). Returns new state and records trade.
 */
export function closeMarket(
  s: PaperState,
  cfg: BrokerConfig,
  price: number,
  reason: PaperTrade["reason"] = "MANUAL"
): PaperState {
  const p = s.position;
  if (!p) return s;

  const side = p.side;
  const exitFill = applySlippage(price, side === "LONG" ? "SHORT" : "LONG", cfg.slippageBps);
  const notional = exitFill * p.qty;
  const fees = fee(notional, cfg.takerFeeBps);

  const pnl = (side === "LONG" ? (exitFill - p.entryPrice) : (p.entryPrice - exitFill)) * p.qty;
  const balance = s.balance + pnl - fees;

  const trade: PaperTrade = {
    symbol: p.symbol,
    side: p.side,
    qty: p.qty,
    entryPrice: p.entryPrice,
    exitPrice: exitFill,
    feesPaid: fees,
    pnl,
    openedAt: p.openedAt,
    closedAt: Date.now(),
    reason,
    aiReasoning: p.reasoning
  };

  return { ...s, balance, position: null, trades: [trade, ...s.trades] };
}

/**
 * Evaluate SL/TP against current price.
 */
export function checkStops(s: PaperState, price: number): "SL" | "TP" | null {
  const p = s.position;
  if (!p) return null;
  if (p.side === "LONG") {
    if (p.stopLoss != null && price <= p.stopLoss) return "SL";
    if (p.takeProfit != null && price >= p.takeProfit) return "TP";
  } else {
    if (p.stopLoss != null && price >= p.stopLoss) return "SL";
    if (p.takeProfit != null && price <= p.takeProfit) return "TP";
  }
  return null;
}

export function updateSlTp(s: PaperState, stopLoss?: number, takeProfit?: number): PaperState {
  if (!s.position) return s;
  return { ...s, position: { ...s.position, stopLoss, takeProfit } };
}
