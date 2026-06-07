# Work Plan: Phase 5 — Categories, Review Queue, Operations & Plan Screens

## 0) Orientation
- Read: `tasks/04-import-and-screens.md` §13-15 (categorization rules, Operations screen, Plan screen, review queue), `tasks/03-data-and-calculations.md` §11 (Category, CategorizationRule types)
- Anchor context: `docs/index.md` → Core domain: `src/domain/categorization/applyRules.ts`, Pages: `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`
- Dependency: **Phase 4 completed** (Excel import writes transactions with `isReviewed: false` and no category).
- Current state: Transactions exist in store but are uncategorized. No Operations, Plan, or review UI.

## 1) Outcome
- Goal: Transactions are auto-categorized on import via rules. User can review uncategorized transactions, manually assign categories, and manage their financial plan.
- Success criteria:
  - Default rules from `tasks/04-import-and-screens.md` §13 are applied on import.
  - Operations page lists transactions with filters (date, category, review status).
  - Review queue shows uncategorized transactions in a tinder-like quick review.
  - Plan page allows editing: income date/amount, obligations, category plans, reserve, goal.
  - `npm run typecheck && npm run lint && npm run test` pass.

## 2) Scope
- In scope:
  - `src/domain/categorization/applyRules.ts` — pure function: takes transactions + rules → returns categorized transactions.
  - `src/domain/categorization/__tests__/applyRules.test.ts` — test rule matching (contains, equals, priority ordering).
  - Default seed rules: Пятёрочка→Продукты, Перекрёсток→Продукты, etc. (seed.ts in Phase 2, wired here).
  - Wire `applyRules` into import flow (after dedup, before commit).
  - `src/pages/OperationsPage.tsx` — transaction list with:
    - Filter bar: date range, category picker, review status toggle.
    - Transaction row: merchant, amount, date, category badge.
    - Tap row → edit category modal.
  - `src/components/operations/ReviewQueue.tsx` — card-based quick review:
    - Shown as a card on HomePage when `uncategorizedCount > 0`.
    - Each item: merchant, amount, date, suggested category (if rule matched partially), category picker.
    - "Save" → moves to next.
  - `src/pages/PlanPage.tsx` — settings form:
    - Income date (date picker), expected income amount (number input).
    - Obligation editor (CRUD list: name, amount, due day, category).
    - Category plan editor (CRUD list: name, monthly plan, group).
    - Reserve protection amount.
    - Primary goal editor (target amount, current amount).
  - `src/components/operations/EditCategoryModal.tsx` — modal with category list, "always categorize similar" checkbox → creates new rule.
  - Update `src/store/index.ts` — add actions: `updateTransactionCategory`, `addRule`, `toggleRuleActive`, `upsertObligation`, `deleteObligation`, `upsertCategory`, `setIncomeDate`, `setGoalProgress`.
- Out of scope:
  - Complex filtering/sorting UI in Operations (just basic filters).
  - Dashboard setup wizard (first-launch onboarding) — too complex for MVP, user uses Plan page manually.
  - Credit card limit/balance tracking.
  - Multi-account transaction view.
- Assumptions / open questions:
  - Assumption: `applyRules` runs during import commit, not retroactively. User can re-apply rules manually via button on Operations page.
  - Assumption: "Always categorize similar" creates a rule with `matchType: 'contains', matchField: 'merchant'` and adds it to the store's rules array.

## 3) Change surface + safety
- Entry points: `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`, `src/domain/categorization/applyRules.ts`
- Files/modules:
  - New: `src/domain/categorization/applyRules.ts`, `src/domain/categorization/__tests__/applyRules.test.ts`
  - New: `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`
  - New: `src/components/operations/ReviewQueue.tsx`, `src/components/operations/EditCategoryModal.tsx`
  - Modify: `src/store/index.ts` — add categorization and plan editing actions
  - Modify: `src/store/seed.ts` — add default rules
  - Modify: `src/pages/HomePage.tsx` — render ReviewQueue when uncategorized > 0
  - Modify: import flow in Phase 4 code — call `applyRules` between dedup and commit
- Invariants/contracts to preserve:
  - Category rules MUST be applied deterministically — same input → same output.
  - Rules with higher priority applied first, first match wins.
  - Manual category assignment overrides auto-assigned category.
  - Obligations and allocations are source-of-truth for dashboard calculations (Phase 3).
- Main risks + mitigation:
  - Risk: large rule set slows import → mitigation: regex rules are compiled once, string matching is O(n*m) for 20 rules × 500 transactions = 10k operations, negligible.
  - Risk: user edits obligations but dashboard doesn't recalculate → mitigation: dashboard recalculates on every store change via React reactivity.

## 4) Implementation steps
1. Create `src/domain/categorization/applyRules.ts`:
   - `applyRules(transactions: Transaction[], rules: CategorizationRule[]): Transaction[]`
   - Sort rules by priority DESC.
   - For each uncategorized transaction, find first matching rule by `matchType` (contains/equals/regex) on `matchField` (merchant/description).
   - Assign `categoryId` and mark `isReviewed: true` for matched transactions.
   - Return updated array (do not mutate originals).
2. Create `src/domain/categorization/__tests__/applyRules.test.ts`:
   - Test: merchant contains "Пятёрочка" → Продукты.
   - Test: higher priority rule matches first.
   - Test: already-reviewed transaction is not re-categorized.
   - Test: no matching rules → transaction stays uncategorized.
3. Add default rules to `src/store/seed.ts`: 9 rules from `tasks/04-import-and-screens.md` §13.
4. Wire `applyRules` into import flow: after dedup, before commit → call `applyRules` with new transactions + store rules.
5. Add store actions for categories and review (see scope above).
6. Create `src/components/operations/ReviewQueue.tsx`:
   - Fetches `transactions.filter(t => !t.isReviewed)` from store.
   - Shows as a card on HomePage: "N операций без категории".
   - Tap → opens review mode (inline or modal): merchant, amount, date, suggested category, category picker dropdown.
   - Save → dispatches `updateTransactionCategory`.
7. Create `src/components/operations/EditCategoryModal.tsx`:
   - Category list (from store categories).
   - Checkbox: "Всегда категоризировать так же".
   - On save: update transaction category. If checkbox checked, add new rule.
8. Create `src/pages/OperationsPage.tsx`:
   - Transaction list from store.
   - Filter bar: date range (from/to inputs), category dropdown, "only unreviewed" toggle.
   - Each row: merchant, amount (colored: green=income, red=expense), date, category tag.
   - Tap row → EditCategoryModal.
   - "Применить правила ко всем" button — re-runs `applyRules` on all unreviewed transactions.
9. Create `src/pages/PlanPage.tsx`:
   - Income section: next income date, expected monthly income.
   - Obligations section: list of obligations with add/edit/delete. Each: name, amount, due day.
   - Categories section: list of living categories with monthly plan.
   - Reserve section: reserve protection amount.
   - Goal section: target amount, current amount (manual input for MVP).
10. Update HomePage — add ReviewQueue card when uncategorized transactions exist.
11. Run `npm run typecheck && npm run lint` → fix errors.
12. Run `npm run test` → verify all tests pass.
13. Run `make preflight` → verify all gates pass.

## 5) Validation
- Fast gate: `npm run typecheck` → expected: exit 0.
- Task-specific checks:
  - `npm run test -- src/domain/categorization/` → expected: rule tests pass.
  - `npm run lint` → expected: exit 0.
  - Manual: import sample.xlsx → transactions show with auto-assigned categories.
  - Manual: Operations page shows transactions with filters working.
  - Manual: ReviewQueue shows uncategorized → assign category → queue decreases.
  - Manual: Plan page: change income date → dashboard recalculates.
  - Manual: Plan page: add obligation → UpcomingObligationsCard updates.
- Pareto blackbox: integration test — import transactions, verify auto-categorization, manually recategorize one, verify rule was created.
- Rollback:
  - Delete new files: `src/domain/categorization/`, `src/pages/OperationsPage.tsx`, `src/pages/PlanPage.tsx`, `src/components/operations/`.
  - Revert store changes: remove new actions, default rules from seed.
  - Revert import flow: remove `applyRules` call.
  - Revert HomePage: remove ReviewQueue.
  - Rollback verification: `make preflight` passes.

## 6) DOD
- Default categorization rules applied on import.
- Operations page with transaction list, filters, and category editing.
- ReviewQueue shows uncategorized transactions and allows quick review.
- Plan page allows editing income, obligations, category plans, reserve, goal.
- Plan changes trigger dashboard recalculation.
- `npm run test` passes.
- `npm run typecheck && npm run lint` pass.
- `make preflight` passes.
- All new/modified files committed with message `feat: categorization rules, Operations page, Plan page`.

## 7) Final verdict
- Ready for implementation: **yes**
