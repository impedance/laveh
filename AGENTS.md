# AGENTS.md

<!-- AICODE-NOTE: NAV/AGENT_RESPONSE when the user requests it, respond in Russian -->
- Chat responses to the user: Russian.
- Repository files and documentation language: English (`README.md`, `docs/`, AICODE anchors, code comments unless file conventions require otherwise).

## 1) What this repo is
Morgan Finance — local-first iPhone PWA for personal cashflow hygiene. Dark dashboard shows free money until next income, upcoming obligations, safe daily pace, and credit card payoff goal. Vite + React + TypeScript + Tailwind + Zustand(persist) + SheetJS. No backend in MVP. Manual Excel import from T-Bank.

System-of-record map: `docs/index.md`.

## 2) Fast commands (run these first)
- Smoke: `make smoke`
- Agent smoke (optional): `make agent-smoke`
- Preflight: `make preflight`
- Strict smoke: `make smoke STRICT=1`
- Harness info (optional): `make doctor`

## 3) Non-negotiable invariants
- Wire existing tooling first; do not migrate the stack just to satisfy the harness.
- Keep default verification offline and deterministic unless the repo documents an opt-in integration path.
- Never commit secrets or generated credentials.

## 4) Repo map
- Entrypoints: `src/app/App.tsx`, `src/app/routes.tsx`
- Core domain logic: `src/domain/dashboard/calculateDashboard.ts`, `src/domain/categorization/applyRules.ts`
- Boundaries / DTOs / config: `src/store/types.ts`, `src/domain/dashboard/types.ts`
- Adapters (I/O): `src/domain/import/parseWorkbook.ts`, `src/domain/import/deduplicateTransactions.ts`

## 5) How to finish a task
- Make the change.
- Run `make smoke`.
- (If relevant) run `make agent-smoke`.
- Run `make preflight`.
- Summarize what changed and the commands you ran.
