import { create } from "zustand";
import type { Candle, PaperPosition, TradeSignal } from "@tradai/domain";
import { createPaperState, type PaperState, openMarket, closeMarket, updateSlTp, checkStops } from "@tradai/domain";

type UiToast = { id: string; message: string };

type State = {
  symbol: string;
  interval: string;
  candles: Candle[];
  lastSignal: TradeSignal | null;

  paper: PaperState;

  autoTrading: boolean;

  toasts: UiToast[];
  addToast: (message: string) => void;
  removeToast: (id: string) => void;

  setSymbol: (symbol: string) => void;
  setInterval: (interval: string) => void;
  setCandles: (candles: Candle[]) => void;
  setLastSignal: (s: TradeSignal | null) => void;

  openLong: (price: number) => void;
  openShort: (price: number) => void;
  close: (price: number, reason?: any) => void;
  applySlTp: (sl?: number, tp?: number) => void;
  tickStops: (price: number) => void;
};

const brokerCfg = { makerFeeBps: 2, takerFeeBps: 5, slippageBps: 2 };

export const useAppStore = create<State>((set, get) => ({
  symbol: "BTCUSDT",
  interval: "15m",
  candles: [],
  lastSignal: null,

  paper: createPaperState(10_000),

  autoTrading: false,

  toasts: [],
  addToast: (message) => set((s) => ({
    toasts: [{ id: crypto.randomUUID(), message }, ...s.toasts].slice(0, 5)
  })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  setSymbol: (symbol) => set({ symbol }),
  setInterval: (interval) => set({ interval }),
  setCandles: (candles) => set({ candles }),
  setLastSignal: (lastSignal) => set({ lastSignal }),

  openLong: (price) => set((s) => ({ paper: openMarket(s.paper, brokerCfg, s.symbol, "LONG", 0.01, price, { reason: "MANUAL" }) })),
  openShort: (price) => set((s) => ({ paper: openMarket(s.paper, brokerCfg, s.symbol, "SHORT", 0.01, price, { reason: "MANUAL" }) })),
  close: (price, reason="MANUAL") => set((s) => ({ paper: closeMarket(s.paper, brokerCfg, price, reason) })),
  applySlTp: (sl, tp) => set((s) => ({ paper: updateSlTp(s.paper, sl, tp) })),
  tickStops: (price) => {
    const s = get();
    const hit = checkStops(s.paper, price);
    if (hit) {
      set({ paper: closeMarket(s.paper, brokerCfg, price, hit) });
      s.addToast(hit === "SL" ? "Uderzony Stop Loss" : "Zrealizowany Take Profit");
    }
  }
}));
