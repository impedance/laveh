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
- **Entry bootstrap:** `src/main.tsx` (StrictMode render + dev-mode state-dump subscribe)
- **Pages:** `src/pages/HomePage.tsx`, `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`, `src/pages/ImportPage.tsx`, `src/pages/SettingsPage.tsx`
- **Core domain logic:**
  - `src/domain/dashboard/calculateDashboard.ts` — dashboard calculation engine
  - `src/domain/dashboard/types.ts` — input/view model types
  - `src/domain/categorization/applyRules.ts` — auto-categorization by pattern rules
  - `src/domain/categorization/applyBankMappings.ts` — auto-categorization by bank category mappings (hitCount ≥ 2)
  - `src/domain/import/parseWorkbook.ts` — Excel/CSV parsing (SheetJS)
  - `src/domain/import/types.ts` — T-Bank row types, ColumnMapping, pipeline result types
  - `src/domain/import/mapRowsToTransactions.ts` — row → Transaction mapping
  - `src/domain/import/deduplicateTransactions.ts` — dedup by externalHash
  - `src/domain/import/generateHash.ts` — deterministic SHA-256 hash for dedup
  - `src/domain/import/excelDate.ts` — Excel serial number → ISO date conversion
  - `src/domain/import/normalizeTBankRow.ts` — raw string row → typed parsed row
  - `src/domain/money/dateUtils.ts` — date difference, Russian locale formatting
  - `src/domain/money/formatMoney.ts` — ruble formatting (toLocaleString)
- **Shared:**
  - `src/shared/formatDate.ts` — short date formatter (DD-MM-YY)
- **Store:** `src/store/index.ts` (Zustand + persist v2), `src/store/types.ts` (all DTOs), `src/store/seed.ts` (default data + rules)
- **Components:**
  - Cards: `FreeMoneyHeroCard.tsx`, `SpendingGroupsCard.tsx`
  - Import: `ImportPreview.tsx`, `ImportHistory.tsx`
  - Operations: `ReviewQueue.tsx`, `EditCategoryModal.tsx`
  - Layout: `AppLayout.tsx`, `BottomNavigation.tsx`

## Implementation Plans
`docs/tasks/` — one file per phase (all completed):
- `00-scaffold.md` — Vite + React + TS + Tailwind ✓ done
- `01-static-ui.md` — HTML mock → React components ✓ done
- `02-store-and-backup.md` — Zustand + persist + JSON backup ✓ done
- `03-dashboard-calc.md` — calculateDashboard + tests ✓ done
- `04-excel-import.md` — SheetJS import + dedup ✓ done
- `05-categories-review.md` — categorization + Operations + Plan ✓ done
- `06-pwa.md` — PWA manifest + service worker ✓ done

## Typing Surfaces
- `src/store/types.ts` — `Transaction`, `Category`, `CategoryGroup`, `ImportBatch`, `CategorizationRule`, `BankMapping`, `Account`, `StoreState`, `StoreActions`, `DenezhkaStore`
- `src/domain/dashboard/types.ts` — `DashboardInput`, `DashboardViewModel`, `FreeMoneyView`
- `src/domain/import/types.ts` — `ParsedRow`, `ColumnMapping`, `TBankRawRow`, `TBankParsedRow`, `TBankStatus`, `ImportConfig`, `ParseResult`, `MapResult`, `DedupResult`, `ImportPreviewStats`

## Store Features
- **Persistence:** Zustand `persist` middleware → localStorage (`denezhka-store`, v2). `partialize` excludes runtime-only fields. Migrations: v1 normalizes date fields, v2 auto-builds `bankMappings` from existing categorized transactions.
- **Import pipeline (`commitImport`):** auto-categorizes incoming transactions via `bankMappings` (hitCount ≥ 2) → `applyRules` (description pattern match), assigns `importBatchId`, creates batch record.
- **Cascade deletes:** `deleteCategory` clears `categoryId` from affected transactions, removes related `bankMappings`, renumbers rule priorities; `deleteAccount` removes associated transactions.
- **Learning:** `learnBankMapping` creates/increments bank→category mappings from manual category assignments via `EditCategoryModal`.

## Task Router
- **UI / routes / controllers:** `src/pages/`, `src/components/`
- **Core domain:** `src/domain/dashboard/`, `src/domain/categorization/`
- **Store / persistence:** `src/store/`
- **Import / I/O:** `src/domain/import/`
- **Money utilities:** `src/domain/money/`
- **Shared utilities:** `src/shared/`
- **Layout:** `src/components/layout/`

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
- **Focused dashboard:** `npx vitest run src/domain/dashboard/`
- **Focused import:** `npx vitest run src/domain/import/`
- **Focused categorization:** `npx vitest run src/domain/categorization/`
- **Focused store:** `npx vitest run src/store/`

## Known Pitfalls
- **localStorage loss:** Safari can purge localStorage. Always export JSON backup before clearing browser data.
- **Own money vs credit:** credit accounts contribute `max(0, currentBalance)` to ownMoney (overpayment only). Available credit is NOT shown — goal is to reduce credit dependency. `totalDebt = sum(max(0, -currentBalance))` for credit accounts with `includeInCashBalance: true`.

(End of file — total 95 lines)
