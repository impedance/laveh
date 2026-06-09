# Work Plan: Phase 8 — Credit Limit + Credit Accounts in Cash Balance

> **Status: Draft**

## 0) Orientation
- Read: `AGENTS.md` → `docs/index.md` → `src/store/types.ts` (Account), `src/domain/dashboard/calculateDashboard.ts`, `src/components/operations/EditBalanceModal.tsx`, `src/pages/PlanPage.tsx` (accounts section), `src/components/cards/FreeMoneyHeroCard.tsx`
- Anchor context:
  - `src/domain/dashboard/calculateDashboard.ts:6-10` — `computeCurrentCashBalance` excludes credit accounts via `a.type !== 'credit'`
  - `docs/index.md:91` — Known Pitfall: "Credit card balance: credit account balance must NOT be included in Current Cash Balance." **This invariant is being deliberately changed.**
  - `src/components/operations/EditBalanceModal.tsx:23-28` — separates debit (editable) vs credit/excluded (non-editable)
  - `src/pages/PlanPage.tsx:408-431` — accounts section with balance-only inline editing
  - `AICODE-NOTE: PLAN_PAGE` at `src/pages/PlanPage.tsx:10`
- Dependency: **Phase 3 (dashboard-calc) completed**, **Phase 7 (category-groups) completed**. Store, dashboard, and UI are stable.
- Current state: credit accounts are hard-excluded from `computeCurrentCashBalance`. All money on credit cards → cashBalance = 0 → freeMoney negative → режим СТОП. User scenario: all salary goes to credit cards, daily spending happens from credit cards, mortgage payments withdrawn from credit cards.

## 1) Outcome
- Goal: Allow credit accounts to contribute available funds to cash balance via new `creditLimit` field. `availableFunds = max(0, creditLimit + currentBalance)`. Show credit cards as editable in a separate section in EditBalanceModal. Show credit available as a separate line in FreeMoneyHeroCard.
- Success criteria:
  - `Account` type gains optional `creditLimit?: number` field.
  - User can create new accounts (debit and credit) via PlanPage UI.
  - User can delete accounts via PlanPage UI.
  - `computeCurrentCashBalance` includes credit accounts with `includeInCashBalance: true`, computing available funds as `max(0, creditLimit + currentBalance)`.
  - `FreeMoneyView` gains `creditAvailable: number` field, displayed in `FreeMoneyHeroCard`.
  - `EditBalanceModal` has separate editable "Кредитные счета" section for credit accounts with `includeInCashBalance: true`. Total balance includes credit available funds.
  - `PlanPage` accounts section has inline `creditLimit` input for credit accounts.
  - All existing tests pass; new test covers credit account with `creditLimit` in cash balance.
  - `docs/index.md:91` pitfall updated to reflect new behavior.
  - `make smoke && make preflight` pass.

## 2) Scope
- In scope:
  - Add `creditLimit?: number` to `Account` type (`src/store/types.ts`)
  - Add UI to create new accounts (debit and credit) in `PlanPage` accounts section
  - Update `computeCurrentCashBalance` in `src/domain/dashboard/calculateDashboard.ts` to include credit accounts
  - Add `creditAvailable: number` to `FreeMoneyView` (`src/domain/dashboard/types.ts`)
  - Update `calculateDashboard` to compute and pass `creditAvailable`
  - Update `FreeMoneyHeroCard` to display `creditAvailable` below `balanceNow`
  - Restructure `EditBalanceModal` into three sections: debit active, credit active, excluded
  - Add `creditLimit` inline editing in `PlanPage` accounts section
  - Update `docs/index.md:91` pitfall
- Out of scope:
  - Auto-calculating `currentBalance` from transactions
  - Transaction-based credit limit tracking
- Assumptions / open questions:
  - `currentBalance` on credit accounts is typically NEGATIVE (debt). Formula: `availableFunds = max(0, creditLimit + currentBalance)`. Example: limit 500K, debt -300K → available 200K.
  - For debit accounts: `availableFunds = currentBalance` (unchanged).
  - If `creditLimit` is `undefined` or `0`, available funds = 0 for that credit account.
  - If `currentBalance` is positive (overpaid credit card), available = creditLimit + positiveBalance (more than limit — correct, overpayment is your money).
  - `includeInCashBalance` is the sole gate for participation; `type` only affects the AVAILABLE formula.
  - User confirmed: 2 credit cards (Платинум, обычная). Variant 2 (creditLimit field) chosen over removing exclusion or informational-only approach.

## 3) Change surface + safety
- Entry points: `src/domain/dashboard/calculateDashboard.ts:6-10` (core formula), `src/components/operations/EditBalanceModal.tsx:23-99` (UI sections), `src/pages/PlanPage.tsx:408-431` (plan editing)
- Files/modules:
  - Modify: `src/store/types.ts` (Account interface)
  - Modify: `src/domain/dashboard/types.ts` (FreeMoneyView)
  - Modify: `src/domain/dashboard/calculateDashboard.ts` (computeCurrentCashBalance + calculateDashboard)
  - Modify: `src/components/cards/FreeMoneyHeroCard.tsx` (display creditAvailable)
  - Modify: `src/components/operations/EditBalanceModal.tsx` (three-section layout + creditLimit edits)
  - Modify: `src/pages/PlanPage.tsx` (add account UI + creditLimit input in accounts section)
  - Modify: `docs/index.md` (pitfall update)
  - Modify: `src/domain/dashboard/__tests__/calculateDashboard.test.ts` (new test + update existing)
  - Modify: `src/store/__tests__/store.test.ts` (creditLimit in account operations + add account with creditLimit)
- Invariants/contracts to preserve:
  - Debit account behavior: completely unchanged. `includeInCashBalance` + `type === 'debit'` → `currentBalance` used directly.
   - `freeUntilNextIncome = cashBalance - totalRequiredAllocations` — formula unchanged, only `cashBalance` source broadened.
  - `creditLimit` is optional — backward compatible with existing persisted state (old credit accounts have no `creditLimit`, fall back to 0 available).
  - `includeInCashBalance` is the sole gate; `type` only affects computation formula within the gate.
  - Calculation remains pure — no side effects.
- Main risks + mitigation:
  - Risk: old state without `creditLimit` — mitigation: optional field, `?? 0` fallback.
  - Risk: `currentBalance` sign confusion — mitigation: documented formula `max(0, creditLimit + currentBalance)`. Negative balance (debt) reduces available, positive (overpayment) increases.
  - Risk: `availableFunds` goes negative when over limit — mitigation: `Math.max(0, ...)` clamp.
  - Risk: EditBalanceModal `currentTotal` only sums debit accounts — mitigation: add credit available to total.

## 4) Implementation steps

### Step 0: Add account creation UI in PlanPage
**File:** `src/pages/PlanPage.tsx` (accounts section)

Add a form at the top of the accounts section to create new accounts:
- Input fields: name (text), type (debit/credit selector), initial balance (number), creditLimit (number, shown only when type=credit)
- `includeInCashBalance` defaults to `true` for new accounts
- On submit calls `store.addAccount(...)`
- Delete button on each account row (with confirmation)

UI layout in accounts section:
```
┌─────────────────────────────────┐
│ Счета                           │
│ ┌─────────────────────────────┐ │
│ │ Название: [________]        │ │
│ │ Тип: [debit ▼]              │ │
│ │ Баланс: [________]          │ │
│ │ [+ Добавить счёт]           │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Основной счёт   Дебетовый   │ │
│ │ [212000] ₽         [✕]     │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Платинум      Кредитный     │ │
│ │ Баланс: [-300000] ₽         │ │
│ │ Лимит: [500000] ₽           │ │
│ │ Доступно: 200000 ₽   [✕]  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

For credit accounts: show `creditLimit` input row below balance. Display computed available: `max(0, creditLimit + currentBalance)` as read-only hint.

### Step 1: Add `creditLimit` to `Account` type
**File:** `src/store/types.ts:1-7`
```typescript
export interface Account {
  id: string;
  name: string;
  type: 'debit' | 'credit';
  includeInCashBalance: boolean;
  currentBalance: number;
  creditLimit?: number;
}
```

### Step 2: Add `creditAvailable` to `FreeMoneyView`
**File:** `src/domain/dashboard/types.ts:21-29`
Add field `creditAvailable: number` to `FreeMoneyView` interface.

### Step 3: Update `computeCurrentCashBalance` to include credit accounts
**File:** `src/domain/dashboard/calculateDashboard.ts:6-10`
Replace with:
```typescript
function computeCurrentCashBalance(accounts: Account[]): number {
  return accounts
    .filter((a) => a.includeInCashBalance)
    .reduce((sum, a) => {
      if (a.type === 'credit') {
        return sum + Math.max(0, (a.creditLimit ?? 0) + a.currentBalance);
      }
      return sum + a.currentBalance;
    }, 0);
}
```

### Step 4: Update `calculateDashboard` to compute and pass `creditAvailable`
**File:** `src/domain/dashboard/calculateDashboard.ts`
- Add helper `function computeCreditAvailable(accounts: Account[]): number` — sums available funds for credit accounts with `includeInCashBalance: true`.
- In `calculateDashboard` (around line 179-185), compute `creditAvailable` and include in `freeMoney` object.
- `balanceNow` already uses updated `computeCurrentCashBalance` which includes credit available.

### Step 5: Update `FreeMoneyHeroCard` to display credit available
**File:** `src/components/cards/FreeMoneyHeroCard.tsx`
After the "Баланс сейчас" line (line 37), when `creditAvailable > 0`, show a separate line with available credit amount.

### Step 6: Restructure `EditBalanceModal` into three sections
**File:** `src/components/operations/EditBalanceModal.tsx`

New structure (3 sections):
1. **"Дебетовые счета"** — `type === 'debit' && includeInCashBalance` — editable balance (same as current "Активные счета")
2. **"Кредитные счета"** — `type === 'credit' && includeInCashBalance` — editable balance + creditLimit. Show available funds per card: `max(0, creditLimit + currentBalance)`.
3. **"Не участвуют в балансе"** — `!includeInCashBalance` — non-editable, greyed out

`currentTotal` computation: sum of debit balances + sum of credit available funds.

For credit section: add `creditLimit` input field next to balance adjustment. Use a separate `creditLimitEdits` state.

### Step 7: Add `creditLimit` inline editing in PlanPage accounts section
**File:** `src/pages/PlanPage.tsx` (accounts section)

For each credit account (`acc.type === 'credit'`) in the list, add a `creditLimit` input row below the balance input (already implemented as part of Step 0). Ensure:
- `creditLimit` persists via `updateAccount`
- Available funds display updates reactively as user changes balance or limit

### Step 8: Update `docs/index.md` pitfall
**File:** `docs/index.md:91`
Change from: "Credit card balance: credit account balance must NOT be included in Current Cash Balance."
To: "Credit accounts with `includeInCashBalance: true` contribute `max(0, creditLimit + currentBalance)` to cash balance. Without `creditLimit`, available = 0."

### Step 9: Update tests
**File:** `src/domain/dashboard/__tests__/calculateDashboard.test.ts`
1. Update existing test "credit account excluded from cash balance" (line 52-62): credit account with `includeInCashBalance: true` but no `creditLimit` → contributes 0 → test expectation stays (balanceNow should be 100000).
2. Add new test: "credit account with creditLimit contributes available funds to cash balance"
3. Add new test: "credit account over limit contributes 0"

**File:** `src/store/__tests__/store.test.ts`
1. Update test "adds an account": add `creditLimit: 500000`, verify it's stored.
2. Update test "updates an account": test updating `creditLimit`.

## 5) Validation
- Fast gate: `make smoke` → expected: lint + test pass.
- Task-specific checks:
  - `npx vitest run src/domain/dashboard/` → expected: all tests pass including new credit limit tests.
  - `npx vitest run src/store/` → expected: all tests pass including creditLimit in account operations.
  - `npm run typecheck` → expected: exit 0.
- Pareto blackbox tests:
  - Credit account with `creditLimit=500K, balance=-300K, includeInCashBalance: true` → `balanceNow` includes 200K from credit + all debit.
  - Credit account over limit → contributes 0.
  - Credit account without `creditLimit` → contributes 0 (backward compat).
  - Debit account behavior unchanged.
- Rollback:
  - Revert `src/store/types.ts` (remove `creditLimit` field)
  - Revert `src/domain/dashboard/calculateDashboard.ts` (restore `a.type !== 'credit'` filter)
  - Revert `src/domain/dashboard/types.ts` (remove `creditAvailable`)
  - Revert `src/components/cards/FreeMoneyHeroCard.tsx` (remove credit display)
  - Revert `src/components/operations/EditBalanceModal.tsx` (restore 2-section layout)
  - Revert `src/pages/PlanPage.tsx` (remove creditLimit input)
  - Revert `docs/index.md` (restore pitfall text)
  - Revert test files
  - Rollback verification: `make smoke && make preflight` pass.

## 6) DOD
- `creditLimit` field added to `Account`, optional, backward compatible.
- Account creation UI in PlanPage: name, type selector, balance, creditLimit (for credit).
- Account deletion UI in PlanPage with confirmation.
- `computeCurrentCashBalance` includes credit accounts via `max(0, creditLimit + currentBalance)`.
- `FreeMoneyView.creditAvailable` computed and passed through `calculateDashboard`.
- `FreeMoneyHeroCard` displays credit available as separate line.
- `EditBalanceModal` shows three sections: debit active (editable), credit active (balance+creditLimit editable), excluded (grey).
- `PlanPage` accounts section: inline balance + creditLimit editing, add/delete account.
- `docs/index.md` pitfall updated.
- All existing tests pass; 2 new dashboard tests pass; 2 updated store tests pass.
- `npm run typecheck && npm run lint` pass.
- `make preflight` passes.

## 7) Final verdict
Ready for implementation: yes
