# Work Plan: Phase 2 — Zustand Store + Data + Backup

> **Status: Done**

## 0) Orientation
- Read: `tasks/03-data-and-calculations.md` §11 (data model, 8 entity types), `tasks/01-product-and-stack.md` §3 (localStorage justification), `tasks/05-visual-phases-delivery.md` §21 Phase 2
- Anchor context: `docs/index.md` → Typing Surfaces: `src/store/types.ts`, `src/store/index.ts`, `src/store/seed.ts`
- Dependency: **Phase 1 completed** (static UI with mock file rendering).
- Current state: Cards accept props from `src/mock/dashboardData.ts`. No persistence, no store.

## 1) Outcome
- Goal: Replace mock data file with a typed Zustand store persisted to localStorage. Cards render from store selectors. JSON backup export/restore works.
- Success criteria:
  - Zustand store with all 8 entity types (`accounts`, `transactions`, `categories`, `obligations`, `allocations`, `goals`, `importBatches`, `rules`) compiles and persists to localStorage.
  - Dashboard renders same cards as Phase 1, but data flows from store selectors instead of mock file.
  - JSON export downloads a `.json` file containing the full store state.
  - JSON restore rehydrates the store from a selected `.json` file.
  - `npm run typecheck` passes.
  - `npm run lint` passes.
  - `npm run test` exits 0 (store test file exists with at least 1 passing test).
  - `make preflight` passes.

## 2) Scope
- In scope:
  - `src/store/types.ts` — all 8 entity types from `tasks/03-data-and-calculations.md` §11.
  - `src/store/index.ts` — Zustand store with typed slices: `accountsSlice`, `transactionsSlice`, `categoriesSlice`, `obligationsSlice`, `allocationsSlice`, `goalsSlice`, `importBatchesSlice`, `rulesSlice`.
  - Zustand `persist` middleware → localStorage (key: `denezhka-store`).
  - `src/store/seed.ts` — demo data matching the numbers in `denezhka_dark_dashboard_mock.html` (accounts: 1 cash account with 212 000 ₽; obligations: ипотека, автокредит, кредитка; goals: credit card payoff; categories: продукты, подписки, транспорт).
  - `src/store/__tests__/store.test.ts` — at minimum: store initializes from seed data, persist middleware exists, store exports clean JSON.
  - `src/domain/money/formatMoney.ts` — `formatMoney(amount: number): string` → `"212 000 ₽"`.
  - `src/domain/money/dateUtils.ts` — `daysBetween(a: string, b: string): number`, `formatDate(date: string): string`.
  - JSON export: `downloadBackup()` — reads `useStore.getState()`, serializes to JSON, triggers browser download.
  - JSON restore: `restoreBackup(file: File)` — reads file, `JSON.parse`, calls `useStore.setState()`.
  - Remove `src/mock/dashboardData.ts` — all data now flows from store.
- Out of scope:
  - Dashboard calculation logic (`calculateDashboard.ts`) — still use static view model from seed data.
  - Excel import, categorization.
  - PWA manifest, service worker.
  - IndexedDB/Dexie migration.
- Assumptions / open questions:
  - Assumption: localStorage 5MB limit is sufficient (max ~1MB for 5000 transactions).
  - Open question: should restore merge or replace? Answer for MVP: **replace** (simpler, safer — user restores a known-good snapshot).

## 3) Change surface + safety
- Entry points: `src/store/index.ts` (store creation + persist), `src/pages/HomePage.tsx` (data source changed)
- Files/modules:
  - New: `src/store/types.ts`, `src/store/index.ts`, `src/store/seed.ts`, `src/store/__tests__/store.test.ts`
  - New: `src/domain/money/formatMoney.ts`, `src/domain/money/dateUtils.ts`
  - Modify: HomePage — use `useStore` selectors instead of mock import
  - Modify: all 7 card components — remove mock data dependency, accept store-derived props
  - Delete: `src/mock/dashboardData.ts`
  - New: `src/pages/SettingsPage.tsx` — Export/Import buttons (minimal, rest of settings in Phase 5)
- Invariants/contracts to preserve:
  - Dashboard visual output must be identical to Phase 1.
  - Store shape must NOT change after persist is enabled — Zustand versioning/migration must be considered.
  - `useStore.getState()` must return a `JSON.stringify`-able object (no functions, no Maps, no Dates inside store).
  - Credit account balance must NOT increase Current Cash Balance (enforced in store selector, not here — but types must support this distinction).
- Main risks + mitigation:
  - Risk: Zustand persist with complex nested objects may cause rehydration issues → mitigation: use `partialize` to control what's persisted; seed data on first launch via `onRehydrateStorage`.
  - Risk: localStorage quota exceeded → mitigation: store backups early (Phase 2, not later); seed data should be small.
  - Risk: Safari clears localStorage → mitigation: export/restore is mandatory and implemented here, not later.

## 4) Implementation steps
1. Create `src/store/types.ts` with all 8 entity types. Use `string` for dates (ISO 8601) to ensure JSON serializability.
2. Define store interface in `src/store/types.ts`: `type DenezhkaStore = { accounts: Account[]; transactions: Transaction[]; ... }` plus action methods.
3. Create `src/store/seed.ts` — demo data:
   - `accounts`: `[{ id: 'cash-1', name: 'Основной счёт', type: 'debit', includeInCashBalance: true, currentBalance: 212000 }]`
   - `obligations`: ипотека 84 000 (protected), автокредит 34 000 (protected), кредитка 30 000 (underfunded, gap 12 000)
   - `goals`: `[{ id: 'goal-1', title: 'Закрыть кредитку', type: 'debt_payoff', targetAmount: 700000, currentAmount: 400000, isPrimary: true }]`
   - `categories`: продукты (plan 60 000), подписки (plan 5 000), транспорт (plan 20 000)
   - Empty arrays for transactions, allocations, importBatches, rules.
4. Create `src/store/index.ts`:
   - `useStore = create<DenezhkaStore>()(persist(storeDefinition, { name: 'denezhka-store' }))`
   - Actions: `addTransaction`, `updateCategory`, `setNextIncomeDate`, `exportBackup`, `restoreBackup`, etc.
5. Create `src/domain/money/formatMoney.ts` — number → `"212 000 ₽"` (space as thousand separator).
6. Create `src/domain/money/dateUtils.ts` — `daysBetween`, `formatDate`.
7. Create `src/pages/SettingsPage.tsx` — minimal page with Export JSON button and Import JSON file input.
8. Wire export: `useStore.getState()` → `JSON.stringify` → `Blob` → `URL.createObjectURL` → download link.
9. Wire restore: file input → `FileReader` → `JSON.parse` → `useStore.setState(parsedState)`.
10. Update HomePage and all card components: replace `import { mockData }` with `useStore(selector)`.
11. Create `src/store/__tests__/store.test.ts`:
    - Test: store initializes with default state (empty arrays).
    - Test: store after seeding has expected demo data.
    - Test: `getState()` returns JSON-serializable object (no circular refs, no functions).
    - Test: adding a transaction and reading it back works.
12. Run `npm run typecheck && npm run lint` → fix errors.
13. Run `npm run test` → verify store tests pass.
14. Delete `src/mock/dashboardData.ts`.
15. Run `make preflight` → verify all gates pass.

## 5) Validation
- Fast gate: `npm run typecheck` → expected: exit 0.
- Task-specific checks:
  - `npm run test` → expected: store tests pass.
  - `npm run lint` → expected: exit 0.
  - Manual: open `npx vite` → dashboard renders same as Phase 1.
  - Manual: click Export → downloads `denezhka-backup-YYYY-MM-DD.json`.
  - Manual: edit JSON file, restore → dashboard reflects changes.
  - `localStorage.getItem('denezhka-store')` in browser console returns valid JSON.
- Pareto blackbox: one vitest test that seeds store, exports JSON, parses it, restores, and verifies state equality.
- Rollback:
  - Restore deleted `src/mock/dashboardData.ts` from git.
  - Revert HomePage and card imports back to mock data import.
  - Delete `src/store/`, `src/domain/money/`, `src/pages/SettingsPage.tsx`.
  - Rollback verification: `npx vite` renders dashboard from mock file, `make preflight` passes.

## 6) DOD
- All 8 entity types defined in `src/store/types.ts`.
- Zustand store with persist middleware saves to localStorage.
- Dashboard renders from store selectors, visually identical to Phase 1.
- JSON export/restore works.
- `npm run test` passes with store tests.
- `npm run typecheck && npm run lint` pass.
- `make preflight` passes.
- All new files committed with message `feat: Zustand store with persist, seed data, JSON backup`.

## 7) Final verdict
- Ready for implementation: **yes**
