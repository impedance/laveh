# Work Plan: Phase 4 — Excel Import Flow

## 0) Orientation
- Read: `tasks/04-import-and-screens.md` §12-13 (Excel import flow, column mapping, dedup hash, categorization rules), `tasks/01-product-and-stack.md` §3 (SheetJS), `tasks/03-data-and-calculations.md` §11 (ImportBatch type)
- Anchor context: `docs/index.md` → Adapters: `src/domain/import/parseWorkbook.ts`, `src/domain/import/deduplicateTransactions.ts`
- Dependency: **Phase 3 completed** (dashboard calculates from store, transactions entity exists but is empty).
- Current state: Store has `transactions: []`. No import mechanism exists.

## 1) Outcome
- Goal: User can select an Excel/CSV file, preview parsed transactions with dedup stats, and import them into the store. Dashboard recalculates automatically.
- Success criteria:
  - File input accepts .xlsx and .csv.
  - SheetJS parses workbook → rows → normalized Transaction objects.
  - `externalHash` is generated per row, duplicates detected.
  - Preview screen shows: found/count, new, duplicates, needs-review.
  - Confirm writes transactions to Zustand store → dashboard recalculates.
  - Import history is recorded as ImportBatch in store.
  - `npm run typecheck` && `npm run lint` && `npm run test` pass.

## 2) Scope
- In scope:
  - `src/domain/import/parseWorkbook.ts` — `parseWorkbook(file: File): Promise<ParsedRow[]>` supports .xlsx and .csv via SheetJS.
  - `src/domain/import/mapRowsToTransactions.ts` — `mapRowsToTransactions(rows: ParsedRow[], accountId: string, sourceProfile: string): Transaction[]` — configurable column mapping with default T-Bank mapping.
  - `src/domain/import/deduplicateTransactions.ts` — `deduplicateTransactions(newTxns: Transaction[], existingTxns: Transaction[]): { new: Transaction[], duplicates: Transaction[] }` via externalHash match.
  - `src/domain/import/generateHash.ts` — `generateHash(date, amount, description, account, sourceProfile): string` using SHA-256 via SubtleCrypto API.
  - `src/pages/ImportPage.tsx` — full import flow: file input → preview → confirm → success.
  - `src/components/import/ImportPreview.tsx` — summary card: found X, new Y, duplicates Z, needs-review N.
  - `src/components/import/ImportHistory.tsx` — list of past ImportBatches with undo action.
  - Update `src/pages/HomePage.tsx` — "Импорт Excel: 2 дня назад" now reflects real last import date.
  - `src/domain/import/__tests__/parseWorkbook.test.ts` — test with small .xlsx fixture (`tests/fixtures/sample.xlsx`) and .csv fixture.
  - `src/domain/import/__tests__/deduplicateTransactions.test.ts` — test dedup logic.
- Out of scope:
  - Auto-categorization (Phase 5).
  - .xls, .ofx, .qif formats (CSV + .xlsx only for MVP).
  - Editing column mapping per import (first import uses default; customizable mapping UI is Phase 5).
  - Multi-account support for import (all imports go to one default account in MVP).
- Assumptions / open questions:
  - Assumption: T-Bank Excel format has known columns: date, amount, description/payee. Default mapping covers this.
  - Assumption: SubtleCrypto API (for SHA-256) is available in all target browsers (Safari ≥ 15, Chrome ≥ 60).
  - Open question: what happens if SubtleCrypto is unavailable in some context? Answer: fallback to JSON.stringify + simple concatenation hash (weaker but MVP-adequate).

## 3) Change surface + safety
- Entry points: `src/pages/ImportPage.tsx`, `src/domain/import/parseWorkbook.ts`
- Files/modules:
  - New: `src/domain/import/parseWorkbook.ts`, `src/domain/import/mapRowsToTransactions.ts`, `src/domain/import/deduplicateTransactions.ts`, `src/domain/import/generateHash.ts`
  - New: `src/domain/import/types.ts` — `ParsedRow`, `ColumnMapping`
  - New: `src/pages/ImportPage.tsx`
  - New: `src/components/import/ImportPreview.tsx`, `src/components/import/ImportHistory.tsx`
  - New: `tests/fixtures/sample.xlsx`, `tests/fixtures/sample.csv`
  - New: `src/domain/import/__tests__/parseWorkbook.test.ts`, `src/domain/import/__tests__/deduplicateTransactions.test.ts`
  - Modify: `src/store/index.ts` — add `addImportBatch`, `commitImport`, `undoImport` actions
  - Modify: `src/pages/HomePage.tsx` — read last import date from store
- Invariants/contracts to preserve:
  - Import does NOT overwrite existing transactions — duplicates are skipped by hash.
  - Import writes transactions to store via actions (not direct state mutation).
  - Import MUST increment dashboard recalculation (done by React reactivity on store change).
  - Hash function MUST be deterministic: same input → same hash.
  - Undo MUST remove all transactions from that batch (by `sourceImportId`).
- Main risks + mitigation:
  - Risk: large Excel files (~1000 rows) freeze the main thread during parsing → mitigation: SheetJS parses natively in the browser, but for 1000 rows it's <1s. Show loading spinner.
  - Risk: column mapping mismatch for non-T-Bank exports → mitigation: for MVP, show a warning if columns don't match expected mapping. Editable mapping in Phase 5.
  - Risk: async hash generation (SubtleCrypto) vs sync preview → mitigation: hash generation happens during parse step, before preview. Store hashes with transactions.

## 4) Implementation steps
1. Create `src/domain/import/types.ts` — `ParsedRow` (raw string fields), `ColumnMapping` (config: field → column index).
2. Create `src/domain/import/generateHash.ts` — async SHA-256 via SubtleCrypto: `date + "|" + amount + "|" + description + "|" + account + "|" + sourceProfile`. Fallback to simple string digest if SubtleCrypto unavailable.
3. Create `src/domain/import/parseWorkbook.ts` — `async parseWorkbook(file: File): Promise<ParsedRow[]>` — SheetJS `XLSX.read(arrayBuffer)` → `sheet_to_json` with `header: 1` → rows as `string[][]`.
4. Create `src/domain/import/mapRowsToTransactions.ts` — takes `ParsedRow[]` + `accountId` + `sourceProfile` → maps columns per `ColumnMapping` → generates `externalHash` → returns `Transaction[]`.
5. Create `src/domain/import/deduplicateTransactions.ts` — pure function: compares `externalHash` of new transactions with existing. Returns `{new: Transaction[], duplicates: number}`.
6. Add store actions: `commitImport(transactions: Transaction[], importBatch: ImportBatch)` and `undoImport(batchId: string)`.
7. Create `src/components/import/ImportPreview.tsx` — shows: file name, rows found, new count, duplicate count, needs-review count, [Import] CTA.
8. Create `src/components/import/ImportHistory.tsx` — reads `importBatches` from store, shows list with dates/names/counts, undo button per batch.
9. Create `src/pages/ImportPage.tsx` — file input (accept `.xlsx,.csv`), parse on select, show ImportPreview on success, show error on parse failure, show ImportHistory below.
10. Create test fixtures:
    - `tests/fixtures/sample.xlsx` — 5-row Excel with known columns.
    - `tests/fixtures/sample.csv` — same data in CSV format.
11. Create `src/domain/import/__tests__/parseWorkbook.test.ts` — test xlsx parsing and csv parsing from fixtures.
12. Create `src/domain/import/__tests__/deduplicateTransactions.test.ts` — test: no duplicates, all duplicates, partial duplicates.
13. Update HomePage "last import" line to read `importBatches` from store.
14. Run `npm run typecheck && npm run lint` → fix errors.
15. Run `npm run test -- src/domain/import/` → verify tests pass.
16. Run `make preflight` → verify all gates pass.

## 5) Validation
- Fast gate: `npm run typecheck` → expected: exit 0.
- Task-specific checks:
  - `npm run test -- src/domain/import/` → expected: parse and dedup tests pass.
  - `npm run lint` → expected: exit 0.
  - Manual: select `tests/fixtures/sample.xlsx` in ImportPage → preview shows correct counts → confirm → transactions appear in Operations screen (when built), dashboard recalculates.
  - Manual: import same file twice → second import shows all as duplicates.
  - Manual: undo import → transactions removed.
- Pareto blackbox: end-to-end test that parses sample.xlsx, maps to transactions, deduplicates against existing store, and returns correct ImportPreview counts.
- Rollback:
  - Delete new files: `src/domain/import/`, `src/components/import/`, `src/pages/ImportPage.tsx`, test fixtures.
  - Revert store changes: remove `commitImport`, `undoImport`, `importBatches` actions.
  - Rollback verification: `npx vite` — Import tab is missing or placeholder, dashboard works as before, `make preflight` passes.

## 6) DOD
- User can import .xlsx and .csv files.
- Preview shows found/new/duplicates/needs-review counts.
- Confirm writes transactions to store.
- Duplicates are skipped on re-import.
- Undo removes batch transactions.
- Import history stored and displayed.
- `npm run test -- src/domain/import/` passes.
- `npm run typecheck && npm run lint` pass.
- `make preflight` passes.
- All new/modified files committed with message `feat: Excel/CSV import with dedup and undo`.

## 7) Final verdict
- Ready for implementation: **yes**
