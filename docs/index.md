# Documentation Hub

Use this file as the repo map for agents. Keep it short and specific.

## Start Here
- Testing rules: `docs/testing.md`
- Harness plan (discovery): `docs/harness_plan.md`
- Agent notes / known pitfalls: `docs/agent-notes.md` (create if useful)

## Fast Commands
- `make smoke` - fastest verification loop
- `make agent-smoke` - smoke + optional black-box checks (if wired)
- `make preflight` - broader verification loop

## Code Map
- **Entrypoints:** `src/app/App.tsx`, `src/app/routes.tsx`
- **Core domain logic:** `src/domain/dashboard/calculateDashboard.ts`, `src/domain/categorization/applyRules.ts`
- **Boundaries / DTOs / config:** `src/store/types.ts`, `src/domain/dashboard/types.ts`
- **Adapters (I/O):** `src/domain/import/parseWorkbook.ts`, `src/domain/import/deduplicateTransactions.ts`

## Implementation Plans
- **Master spec (reference):** `tasks/01-product-and-stack.md` through `tasks/05-visual-phases-delivery.md` — product requirements, not execution plans.
- **Execution plans (follow these):** `docs/tasks/` — one file per phase, each with Outcome, Scope, Steps, Validation, DOD, Rollback.
  - `docs/tasks/00-scaffold.md` — Phase 0: Vite + React + TS + Tailwind scaffolding
  - `docs/tasks/01-static-ui.md` — Phase 1: HTML mock → React components
  - `docs/tasks/02-store-and-backup.md` — Phase 2: Zustand store + persist + JSON backup
  - `docs/tasks/03-dashboard-calc.md` — Phase 3: calculateDashboard + unit tests
  - `docs/tasks/04-excel-import.md` — Phase 4: SheetJS import + dedup
  - `docs/tasks/05-categories-review.md` — Phase 5: categorization rules, Operations, Plan screens
  - `docs/tasks/06-pwa.md` — Phase 6: PWA manifest + service worker

## Task Router
- **UI / routes / controllers:** `src/pages/`, `src/components/` -> focused tests: `npx vitest run --reporter=verbose` (planned)
- **Core domain behavior:** `src/domain/dashboard/`, `src/domain/categorization/` -> focused tests: `npx vitest run src/domain/`
- **Persistence / store:** `src/store/` -> focused tests: `npx vitest run src/store/`
- **Import/export or external I/O:** `src/domain/import/` -> focused tests: `npx vitest run src/domain/import/`
- **Docs / harness only:** `AGENTS.md`, `docs/`, `Makefile`, `tools/`, `.github/workflows/` -> `make smoke && make preflight`

## Change Contracts
- If changing public behavior, update the closest docs and focused tests.
- If changing core domain rules, update the canonical rule doc before or with code.
- If changing data shape, update architecture/model docs and migration tests.
- If changing I/O mapping, update fixtures or examples that prove the mapping.
- If changing harness files only, do not touch product runtime code.

## Typing Surfaces
- Config boundary: `src/store/types.ts` - `Account`, `Transaction`, `Category`, `Obligation`, `Allocation`, `Goal`, `ImportBatch`, `CategorizationRule`
- Service boundary: `src/domain/dashboard/types.ts` - `DashboardInput`, `DashboardViewModel`
- External I/O boundary: `src/domain/import/` - Excel column mapping, `externalHash` format

## Test Map
- **Smoke path:** `make smoke` — structural + typecheck (once tooling is wired)
- **Black-box path (optional):** `make agent-smoke` — smoke + optional integration checks
- **Full path:** `make preflight` — smoke + tests + broader checks
- **Integration path (opt-in):** not yet wired

## Test Selection Matrix
- **Small docs/harness change:** `make smoke && make preflight`
- **Core domain change:** `npx vitest run src/domain/` then `make preflight`
- **UI/component change:** `npx vitest run src/components/` then `make preflight`
- **I/O/import/export change:** `npx vitest run src/domain/import/` then `make preflight`
- **Shared behavior or risky refactor:** `make preflight`

## Known Pitfalls
- **localStorage loss:** Safari can purge localStorage. Always export JSON backup before clearing browser data. Backup is Phase 2, not later.
- **Credit card balance:** credit account balance must NOT be included in Current Cash Balance. The formula subtracts obligations, not adds credit limit.
- **Zero-code state:** the project is in planning. `make smoke` and `make preflight` will no-op until Vite/TypeScript/Vitest scaffolding is added in Phase 0 (`docs/tasks/00-scaffold.md`).
