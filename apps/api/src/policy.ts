import type { Action, Side } from "@tradai/domain";

export type ProposedAction =
  | { type: "OPEN"; side: Side; qty: number; stopLoss?: number; takeProfit?: number }
  | { type: "CLOSE" }
  | { type: "TOGGLE_AUTO"; enabled: boolean }
  | { type: "SET_SYMBOL"; symbol: string }
  | { type: "SET_INTERVAL"; interval: string };

export type PolicyDecision = { allowed: boolean; reason?: string };

export function policyGate(input: {
  action: ProposedAction;
  hasUserConfirmation: boolean;
  hasOpenPosition: boolean;
  nowMs: number;
  lastActionAtMs?: number;
}): PolicyDecision {
  const { action, hasUserConfirmation, hasOpenPosition, nowMs, lastActionAtMs } = input;

  // Basic cooldown to avoid loops
  const cooldownMs = 1500;
  if (lastActionAtMs && nowMs - lastActionAtMs < cooldownMs) {
    return { allowed: false, reason: "Cooldown aktywny — zbyt częste akcje." };
  }

  // Must confirm for destructive ops
  const requiresConfirm = action.type === "OPEN" || action.type === "CLOSE";
  if (requiresConfirm && !hasUserConfirmation) {
    return { allowed: false, reason: "Brak potwierdzenia użytkownika." };
  }

  if (action.type === "CLOSE" && !hasOpenPosition) {
    return { allowed: false, reason: "Brak otwartej pozycji do zamknięcia." };
  }

  if (action.type === "OPEN") {
    if (action.qty <= 0) return { allowed: false, reason: "Ilość musi być > 0." };
    if (hasOpenPosition) return { allowed: false, reason: "Pozycja już otwarta (najpierw zamknij / odwróć)." };
  }

  return { allowed: true };
}
