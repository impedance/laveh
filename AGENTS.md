# AGENTS.md

<!-- AICODE-NOTE: NAV_REPO_RULES Chat in Russian, docs in English -->
- Chat responses: Russian.
- Files/docs: English (`README.md`, `docs/`, `AICODE-*` lines, code comments).

## What this repo is
Денежка — local-first iPhone PWA for personal cashflow hygiene.
Vite + React 19 + TypeScript 6 + Tailwind 4 + Zustand 5(persist) + SheetJS.
No backend. Manual Excel/CSV import from T-Bank.

System-of-record map: `docs/index.md`.

## Fast commands
- Smoke: `make smoke`
- Preflight: `make preflight`
- Test: `npm test`

## Repo map
- Entrypoint: `src/app/App.tsx` (tab routing: Главная / Операции / План / Импорт)
- Pages: `src/pages/HomePage.tsx`, `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`, `src/pages/ImportPage.tsx`
- Core domain: `src/domain/dashboard/calculateDashboard.ts`, `src/domain/categorization/applyRules.ts`
- Import: `src/domain/import/parseWorkbook.ts`, `src/domain/import/deduplicateTransactions.ts`, `src/domain/import/mapRowsToTransactions.ts`
- Store: `src/store/index.ts`, `src/store/types.ts`, `src/store/seed.ts`

## AICODE anchors
Allowed: `AICODE-NOTE:`, `AICODE-TODO:`, `AICODE-QUESTION:` (ASCII only).
Anchors in `src/` files near code logic. Keep grep-friendly and self-contained.
Close stale `AICODE-TODO:` when resolved; convert `AICODE-QUESTION:` to `AICODE-NOTE:decision:` when answered.

## Session boot
1. Read `AGENTS.md`
2. Read `docs/index.md`
3. `rg -n "AICODE-(NOTE|TODO|QUESTION):"` for anchor context
4. Read relevant `docs/tasks/` plan

## Finish task
- `make smoke && make preflight`
- Summarize what changed
