# Work Plan: Phase 3 — Dashboard Calculations

> **Status: Done**

## 0) Orientation
- Read: `tasks/03-data-and-calculations.md` §17 (calculation service interface), `tasks/02-home-screen-ux.md` §6 (formulas), §9.1 (mode logic)
- Anchor context: `docs/index.md` → Core domain logic: `src/domain/dashboard/calculateDashboard.ts`, `src/domain/dashboard/types.ts`
- Dependency: **Phase 2 completed** (Zustand store with demo data, cards render from store selectors with static view model).
- Current state: Cards display hardcoded numbers from seed data. `DashboardViewModel` is manually constructed, not computed from store data.

## 1) Outcome
- Goal: Implement a pure `calculateDashboard` function that takes raw store state and returns a correct `DashboardViewModel`. Cards must reflect real computed values, not hardcoded seed data.
- Success criteria:
  - `calculateDashboard(state) → DashboardViewModel` computes all fields per the formula spec.
  - `Free Until Next Income` = Current Cash Balance - Total Required Allocations.
  - `mode` = calm/caution/stop per incomeRatio thresholds.
  - Obligation gaps are computed from `plannedAmount - allocatedAmount`.
  - `Safe Daily Pace` = FreeUntilNextIncome / DaysUntilNextIncome.
  - `MoneyGuard` action is selected by priority rules.
  - Unit tests cover: happy path, negative free money, zero-day edge case, credit account exclusion, stale import warning.
  - `make preflight` passes (typecheck + lint + test).

## 2) Scope
- In scope:
  - `src/domain/dashboard/types.ts` — `DashboardInput`, `DashboardViewModel`, `ObligationView`, `GoalView`, `RecurringExpenseView`, `MoneyGuardAction`, `Mode`
  - `src/domain/dashboard/calculateDashboard.ts` — pure function with tests:
    1. `computeCurrentCashBalance(accounts)` — sum of balances where `includeInCashBalance && type !== 'credit'`
    2. `computeObligationGaps(obligations, allocations, nextIncomeDate)` — per-obligation gap
    3. `computeFreeUntilNextIncome(input)` — main formula
    4. `computeMode(freeUntilNextIncome, expectedMonthlyIncome)` — calm/caution/stop
    5. `computeSafeDailyPace(freeUntilNextIncome, daysUntilNextIncome)` — daily amount
    6. `computeTodayRemaining(safeDailyPace, todayFlexibleSpent)` — today's remaining
    7. `computeMoneyGuardAction(input)` — priority-based recommendation
    8. `computeRecurringExpenses(categories, allocations, transactions, today)` — per-category progress
    9. `computePrimaryGoalView(goal)` — progress, next milestone
  - `src/domain/dashboard/__tests__/calculateDashboard.test.ts` — unit tests (see validation section).
  - Update `src/pages/HomePage.tsx` — call `calculateDashboard(store)()` on store data, pass result to cards.
- Out of scope:
  - Category warning logic ("above pace") — calculated here, displayed as-is.
  - Obligation interaction (creating, editing) — still mock data, UI for editing comes in Phase 5.
  - Actual transaction-based spending computation — no transactions yet (all mock).
- Assumptions / open questions:
  - Assumption: `nextIncomeDate` and `expectedMonthlyIncome` are stored in a settings slice of the Zustand store (from Phase 2).
  - Assumption: `today` is passed as `new Date().toISOString().slice(0, 10)` at call time — calculation function is time-aware but deterministic given `today` param.
  - Open question: where does `todayFlexibleSpent` come from without real transactions? Answer: Phase 3 uses 0. Real value comes in Phase 4-5 when transactions exist and are categorized.

## 3) Change surface + safety
- Entry points: `src/domain/dashboard/calculateDashboard.ts`, `src/pages/HomePage.tsx`
- Files/modules:
  - New: `src/domain/dashboard/types.ts`
  - New: `src/domain/dashboard/calculateDashboard.ts`
  - New: `src/domain/dashboard/__tests__/calculateDashboard.test.ts`
  - Modify: `src/pages/HomePage.tsx` — replace static view model construction with `calculateDashboard(...)` call
- Invariants/contracts to preserve:
  - Credit account balance MUST NOT be included in `currentCashBalance`.
  - `freeUntilNextIncome` MUST be `currentCashBalance - totalRequiredAllocations`.
  - `safeDailyPace = 0` when `daysUntilNextIncome = 0` (avoid division by zero).
  - `mode = 'stop'` when `freeUntilNextIncome < 0`, regardless of incomeRatio.
  - Calculation is pure — no side effects, no localStorage access, no store mutation.
- Main risks + mitigation:
  - Risk: incorrect formula yields wrong free money → mitigation: unit tests with known inputs/outputs, manually verified against Excel/spreadsheet.
  - Risk: date edge cases (income date today, past, far future) → mitigation: parameterized tests for `daysBetween`.
  - Risk: undefined/null in store data crashes calculation → mitigation: defensive defaults (0 for missing amounts, empty arrays for missing collections).

## 4) Implementation steps
1. Create `src/domain/dashboard/types.ts` — all view model types.
2. Create `src/domain/dashboard/calculateDashboard.ts` in this order:
   a. `computeCurrentCashBalance(accounts)` — iterates accounts, sums balances where `includeInCashBalance && type !== 'credit'`.
   b. `computeObligationGaps(obligations, allocations, nextIncomeDate)` — for each obligation due before next income, computes `gap = max(0, amount - allocatedAmount)`.
   c. `computeTotalRequiredAllocations(...)` — sum of: obligation gaps + living category plans (proportional to month progress) + reserve allocation + goal contribution.
   d. `computeFreeUntilNextIncome(input)` — `currentCashBalance - totalRequiredAllocations`.
   e. `computeMode(freeUntilNextIncome, expectedMonthlyIncome)` — per `tasks/02-home-screen-ux.md` §9.1.
   f. `computeSafeDailyPace(freeUntilNextIncome, daysUntilNextIncome)` — divide, handle zero days.
   g. `computeMoneyGuardAction(input)` — 6-rule priority check (underfunded obligation, stale import, uncategorized, negative free money, missed goal, overspending).
   h. `computeRecurringExpenses(categories, allocations, transactions, today)` — per-category spent/plan/remaining with `abovePace` flag.
   i. `computePrimaryGoalView(goal)` — progress %, next milestone.
   j. Top-level `calculateDashboard(input: DashboardInput): DashboardViewModel` — composes all sub-functions.
3. Create `src/domain/dashboard/__tests__/calculateDashboard.test.ts` with tests:
   - `test: freeUntilNextIncome = cashBalance - totalRequiredAllocations` (golden test, known inputs)
   - `test: credit account is excluded from cash balance`
   - `test: mode = 'stop' when freeMoney < 0`
   - `test: mode = 'calm' when incomeRatio > 0.2`
   - `test: mode = 'caution' when incomeRatio between 0 and 0.2`
   - `test: safeDailyPace = 0 when daysUntilIncome = 0`
   - `test: obligation gap = plannedAmount - allocatedAmount`
   - `test: obligation gap = 0 when allocatedAmount >= plannedAmount`
   - `test: moneyGuard recommends underfunded obligation first`
   - `test: moneyGuard recommends stale import second`
   - `test: moneyGuard returns undefined when everything is good`
   - `test: primaryGoal progress = current / target`
   - `test: recurring expense abovePace when actualSpend > expectedSpend * 1.15`
4. Update `src/pages/HomePage.tsx`:
   - Replace mock view model construction with `calculateDashboard(selectors)`.
   - Pass result to cards via props.
5. Run `npm run typecheck && npm run lint` → fix errors.
6. Run `npm run test -- src/domain/dashboard/` → verify all tests pass.
7. Run `make preflight` → verify all gates pass.

## 5) Validation
- Fast gate: `npm run typecheck` → expected: exit 0.
- Task-specific checks:
  - `npm run test -- src/domain/dashboard/` → expected: all 13+ tests pass.
  - `npm run lint` → expected: exit 0.
  - Manual: open `npx vite` → dashboard numbers are computed, not hardcoded (changing store data changes dashboard).
- Pareto blackbox: golden test with complete DashboardInput covering all formula paths — verifies end-to-end `calculateDashboard` output matches hand-computed expected values.
- Rollback:
  - Revert `src/pages/HomePage.tsx` back to static view model from seed data.
  - Delete `src/domain/dashboard/`.
  - Rollback verification: `npx vite` renders dashboard from seed data, `make preflight` passes.

## 6) DOD
- `calculateDashboard` produces correct `DashboardViewModel` for all formula paths.
- All unit tests pass (coverage: 100% of formula logic, not 100% lines).
- Dashboard renders computed (not hardcoded) values.
- `npm run typecheck && npm run lint` pass.
- `make preflight` passes.
- All new/modified files committed with message `feat: dashboard calculation service with unit tests`.

## 7) Final verdict
- Ready for implementation: **yes**
