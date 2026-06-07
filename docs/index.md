# Documentation Hub

System-of-record map for Денежка.

## Stack
Vite + React 19 + TypeScript 6 + Tailwind 4 + Zustand 5 (persist) + SheetJS.
No backend. Local-first PWA. Manual Excel/CSV import from T-Bank.

## Fast Commands
- `make smoke` — fastest verification loop (lint + test)
- `make preflight` — full gate (lint + typecheck + test)
- `npx vitest run src/domain/` — focused domain tests

## Code Map
- **Entrypoint:** `src/app/App.tsx` (tab-based routing: Главная / Операции / План / Импорт)
- **Pages:** `src/pages/HomePage.tsx`, `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`, `src/pages/ImportPage.tsx`
- **Core domain logic:**
  - `src/domain/dashboard/calculateDashboard.ts` — dashboard calculation engine
  - `src/domain/categorization/applyRules.ts` — auto-categorization rules
  - `src/domain/import/parseWorkbook.ts` — Excel/CSV parsing
  - `src/domain/import/deduplicateTransactions.ts` — dedup by externalHash
  - `src/domain/import/mapRowsToTransactions.ts` — row → Transaction mapping
- **Store:** `src/store/index.ts` (Zustand + persist), `src/store/types.ts` (all DTOs), `src/store/seed.ts` (default data + rules)
- **Components:** `src/components/cards/` (dashboard cards), `src/components/import/` (ImportPreview, ImportHistory), `src/components/operations/` (ReviewQueue, EditCategoryModal)

## Implementation Plans
`docs/tasks/` — one file per phase:
- `00-scaffold.md` — Vite + React + TS + Tailwind
- `01-static-ui.md` — HTML mock → React components
- `02-store-and-backup.md` — Zustand + persist + JSON backup
- `03-dashboard-calc.md` — calculateDashboard + tests
- `04-excel-import.md` — SheetJS import + dedup ✓ done
- `05-categories-review.md` — categorization + Operations + Plan ✓ done
- `06-pwa.md` — PWA manifest + service worker

## Typing Surfaces
- `src/store/types.ts` — `Transaction`, `Category`, `Obligation`, `Allocation`, `Goal`, `ImportBatch`, `CategorizationRule`, `Account`
- `src/domain/dashboard/types.ts` — `DashboardInput`, `DashboardViewModel`
- `src/domain/import/types.ts` — `ParsedRow`, `ColumnMapping`

## Task Router
- **UI / routes / controllers:** `src/pages/`, `src/components/`
- **Core domain:** `src/domain/dashboard/`, `src/domain/categorization/`
- **Store / persistence:** `src/store/`
- **Import / I/O:** `src/domain/import/`

## Change Contracts
- If changing public behavior, update the closest docs and focused tests.
- If changing data shape, update `src/store/types.ts` and migration tests.
- If changing I/O mapping, update fixtures in `tests/fixtures/`.

## Test Selection Matrix
- **Docs/harness only:** `make smoke && make preflight`
- **Core domain change:** `npx vitest run src/domain/` then `make preflight`
- **Import change:** `npx vitest run src/domain/import/` then `make preflight`

## Test Map
- **Smoke:** `make smoke` — structural + lint + test
- **Full:** `make preflight` — structural + lint + typecheck + test
- **Focused domain:** `npx vitest run src/domain/dashboard/`, `npx vitest run src/domain/import/`
- **Focused store:** `npx vitest run src/store/`

## Known Pitfalls
- **localStorage loss:** Safari can purge localStorage. Always export JSON backup before clearing browser data.
- **Credit card balance:** credit account balance must NOT be included in Current Cash Balance.
