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
- **Entrypoint:** `src/app/App.tsx` (tab-based routing: Главная / Операции / Бюджет / Импорт)
- **Entry bootstrap:** `src/main.tsx` (StrictMode render + dev-mode state-dump subscribe)
- **Pages:** `src/pages/HomePage.tsx`, `src/pages/OperationsPage.tsx`, `src/pages/BudgetPage.tsx`, `src/pages/ImportPage.tsx`, `src/pages/SettingsPage.tsx`
- **Core domain logic:**
  - `src/domain/dashboard/calculateDashboard.ts` — dashboard calculation engine (deprecated)
  - `src/domain/dashboard/types.ts` — input/view model types (deprecated)
  - `src/domain/budget/calculateBudget.ts` — YNAB budget calculation engine (assign/activity/available)
  - `src/domain/budget/types.ts` — BudgetViewModel, BudgetInput, credit card views
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
  - Cards: `ReadyToAssignHeroCard.tsx`, `BudgetGroupsCard.tsx`, `CreditCardPaymentsCard.tsx`
  - Import: `ImportPreview.tsx`, `ImportHistory.tsx`
  - Operations: `ReviewQueue.tsx`, `EditCategoryModal.tsx`
  - Layout: `AppLayout.tsx`, `BottomNavigation.tsx`

## Implementation Plans
`docs/tasks/` — Directory for storing project implementation phases.
Currently, all initial implementation phases (including YNAB budget integration) have been completed. Future features will have their plans added here as needed.

## Typing Surfaces
- `src/store/types.ts` — `Transaction`, `Category`, `CategoryGroup`, `ImportBatch`, `CategorizationRule`, `BankMapping`, `Account`, `MonthState`, `StoreState`, `StoreActions`, `DenezhkaStore`
- `src/domain/dashboard/types.ts` — `DashboardInput`, `DashboardViewModel`, `FreeMoneyView` (deprecated, replaced by budget)
- `src/domain/budget/types.ts` — `BudgetInput`, `BudgetViewModel`, `BudgetGroupView`, `BudgetCategoryView`, `CreditCardPaymentView`
- `src/domain/import/types.ts` — `ParsedRow`, `ColumnMapping`, `TBankRawRow`, `TBankParsedRow`, `TBankStatus`, `ImportConfig`, `ParseResult`, `MapResult`, `DedupResult`, `ImportPreviewStats`

## Store Features
- **Persistence:** Zustand `persist` middleware → localStorage (`laveh-store`, v4→v5). `partialize` excludes runtime-only fields. Migrations: v1 date normalization, v2 bankMappings auto-build, v3 categoryGroups + type→group, v4 obligatoryPayments seed, v5 YNAB MonthState + ObligatoryPayment→Category.
- **Import pipeline (`commitImport`):** auto-categorizes incoming transactions via `bankMappings` (hitCount ≥ 2) → `applyRules` (description pattern match), assigns `importBatchId`, creates batch record.
- **Cascade deletes:** `deleteCategory` clears `categoryId` from affected transactions, removes related `bankMappings`, renumbers rule priorities; `deleteAccount` removes associated transactions.
- **Learning:** `learnBankMapping` creates/increments bank→category mappings from manual category assignments via `EditCategoryModal`.

## Task Router
- **UI / routes / controllers:** `src/pages/`, `src/components/`
- **Core domain:** `src/domain/dashboard/` (deprecated), `src/domain/budget/`, `src/domain/categorization/`
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
- **Focused budget:** `npx vitest run src/domain/budget/`
- **Focused import:** `npx vitest run src/domain/import/`
- **Focused categorization:** `npx vitest run src/domain/categorization/`
- **Focused store:** `npx vitest run src/store/`
- **Focused dashboard (legacy):** `npx vitest run src/domain/dashboard/`

## Known Pitfalls
- **localStorage loss:** Safari can purge localStorage. Always export JSON backup before clearing browser data.
- **Own money vs credit:** credit accounts contribute `max(0, currentBalance)` to ownMoney (overpayment only). Available credit is NOT shown — goal is to reduce credit dependency. `totalDebt = sum(max(0, -currentBalance))` for credit accounts with `onBudget: true`.
- **YNAB budget model:** budget layer is decoupled from accounts. `Category.plan` = target/goal. Per-month `assigned`/`activity`/`available` stored in `MonthState`. Credit card spending auto-moves money from spending category to payment category.

(End of file — total 95 lines)
