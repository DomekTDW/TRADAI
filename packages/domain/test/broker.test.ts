import { describe, it, expect } from "vitest";
import { createPaperState, openMarket, closeMarket } from "../src/paper/broker.js";

describe("paper broker", () => {
  it("opens and closes a LONG with positive pnl when price rises", () => {
    const cfg = { makerFeeBps: 2, takerFeeBps: 5, slippageBps: 0 };
    let s = createPaperState(1000);
    s = openMarket(s, cfg, "BTCUSDT", "LONG", 1, 100, { reason: "MANUAL" });
    const before = s.balance;
    s = closeMarket(s, cfg, 110, "MANUAL");
    expect(s.position).toBe(null);
    expect(s.trades.length).toBe(1);
    expect(s.balance).toBeGreaterThan(before);
  });
});
