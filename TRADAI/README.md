# TRADAI — Paper Futures Trader (Monorepo)

A trading terminal for **Binance USDT-M Perpetual** with **paper trading**, **multi-timeframe (MTF) analysis**, and an **AI assistant** (Gemini) — built with a production-ready architecture:
- **apps/web**: React + TypeScript + Vite
- **apps/api**: Fastify + TypeScript (Gemini proxy + policy gate + audit)
- **packages/domain**: deterministic trading logic (indicators, MTF aggregator, paper broker)

## Why this architecture?
- **No API keys in the browser** — Gemini calls go through `apps/api`.
- **Deterministic core** — MTF + risk + paper broker live in `packages/domain` with tests.
- **Policy gate** — AI can propose actions, but the server enforces safety constraints.

---

## Quick start (local)

### 1) Install
```bash
pnpm i
```

### 2) Configure env
Copy `.env.example` into `apps/api/.env` and set `GEMINI_API_KEY`.

### 3) Run dev
In two terminals:
```bash
pnpm --filter @tradai/api dev
pnpm --filter @tradai/web dev
```

Open: http://localhost:5173

---

## Scripts
- `pnpm lint` — lint all
- `pnpm test` — run tests (domain)
- `pnpm build` — build all
- `pnpm --filter @tradai/api dev` — start API (Fastify)
- `pnpm --filter @tradai/web dev` — start Web (Vite)

---

## Repo layout
```
apps/
  web/         # UI
  api/         # Gemini proxy, policy gate, audit
packages/
  domain/      # indicators, mtf, paper broker (+ tests)
```

---

## Notes
This is a scaffold: endpoints + core modules are present, and the UI shows a working shell.
Next steps: connect Binance WS stream, render chart, and wire trade actions through policy confirmations.
