# Work Plan: Phase 9a — Own Money Model (types + engine + UI + tests)

> **Depends on:** Phase 8 (credit-limit)
> **Blocks:** Phase 9b (PlanPage consistency)

## 0) Orientation
- Read: `AGENTS.md` → `docs/index.md` → `src/store/types.ts`, `src/domain/dashboard/types.ts`, `src/domain/dashboard/calculateDashboard.ts`, `src/components/cards/FreeMoneyHeroCard.tsx`, `src/components/operations/EditBalanceModal.tsx`, `src/domain/dashboard/__tests__/calculateDashboard.test.ts`
- Anchor context:
  - `src/domain/dashboard/calculateDashboard.ts:5-8` — `creditAvailableFunds` helper (DELETE)
  - `src/domain/dashboard/calculateDashboard.ts:10-19` — `computeCurrentCashBalance` (REPLACE with `computeOwnMoney`)
  - `src/domain/dashboard/calculateDashboard.ts:21-25` — `computeCreditAvailable` (DELETE)
  - `src/domain/dashboard/calculateDashboard.ts:40-48` — `computeFreeUntilNextIncome` computes balance internally (UPDATE to accept `ownMoney` as parameter)
  - `src/domain/dashboard/types.ts:17-21` — `FreeMoneyView` has `creditAvailable` (REMOVE)
  - `src/components/cards/FreeMoneyHeroCard.tsx:29-33` — references `data.creditAvailable` (REMOVE)
  - `src/components/operations/EditBalanceModal.tsx:40-44` — `creditAvailableAmount()` helper (DELETE)
  - `src/components/operations/EditBalanceModal.tsx:46-48` — `currentTotal` uses `creditAvailableAmount` (UPDATE)
  - `src/components/operations/EditBalanceModal.tsx:103-105` — "Доступно:" display (REMOVE, show debt instead)
  - `src/pages/PlanPage.tsx:407-409` — "Доступно:" per credit account — OUT OF SCOPE for 9a, flagged for 9b

## 1) Outcome
- Switch financial model from credit-inclusive to credit-exclusive. Show "Свои деньги" (own money), "Долги" (total debt). Remove credit-available from all dashboard/UI paths. Free money = own money − budget, NOT including credit.
- Success criteria:
  - `FreeMoneyView`: `+ownMoney`, `+totalDebt`, `+netWorth`, `−creditAvailable`
  - `computeOwnMoney` replaces `computeCurrentCashBalance`; `computeTotalDebt` added; `creditAvailableFunds` + `computeCreditAvailable` DELETED
  - `computeFreeUntilNextIncome` accepts `ownMoney` as parameter instead of computing balance internally
  - `FreeMoneyHeroCard` shows ownMoney + totalDebt; no credit-available line
  - `EditBalanceModal` total uses ownMoney logic; no creditAvailableAmount; shows debt for credit accounts
  - All tests green; 3+ new tests for ownMoney/totalDebt/netWorth
  - `make smoke && make preflight` pass

## 2) Scope
- In scope:
  - `src/domain/dashboard/types.ts` — FreeMoneyView type change
  - `src/domain/dashboard/calculateDashboard.ts` — engine rewrite
  - `src/domain/dashboard/__tests__/calculateDashboard.test.ts` — update + new tests
  - `src/components/cards/FreeMoneyHeroCard.tsx` — UI redesign
  - `src/components/operations/EditBalanceModal.tsx` — UI + logic update
  - `docs/index.md` — pitfall update
- Out of scope:
  - `src/pages/PlanPage.tsx` — "Доступно:" line (Phase 9b)
  - Commitments / earmarked (Phase 10+)
  - Account detail cards on dashboard
  - Transaction-based debt calculation
- Assumptions:
  - Credit `currentBalance > 0` (overpayment) → contributes to ownMoney. `max(0, currentBalance)`.
  - Credit `currentBalance < 0` (debt) → contributes 0 to ownMoney, `abs(currentBalance)` to totalDebt.
  - Credit `currentBalance = 0` → contributes 0 to both.
  - `balanceNow` kept as alias for `ownMoney` (backward compat).
  - Debit accounts: `currentBalance` used directly (positive = your money).

## 3) Change surface + safety

### Files to modify (6):

| # | File | Change |
|---|------|--------|
| 1 | `src/domain/dashboard/types.ts` | `FreeMoneyView`: +`ownMoney`, +`totalDebt`, +`netWorth`, −`creditAvailable` |
| 2 | `src/domain/dashboard/calculateDashboard.ts` | DELETE `creditAvailableFunds`, DELETE `computeCreditAvailable`, REPLACE `computeCurrentCashBalance` → `computeOwnMoney`, ADD `computeTotalDebt`, UPDATE `computeFreeUntilNextIncome` to accept `ownMoney` as parameter, UPDATE `calculateDashboard` return |
| 3 | `src/domain/dashboard/__tests__/calculateDashboard.test.ts` | Update 4 existing tests, add 3 new tests |
| 4 | `src/components/cards/FreeMoneyHeroCard.tsx` | Remove `creditAvailable` reference, show `ownMoney` + `totalDebt`, rename label |
| 5 | `src/components/operations/EditBalanceModal.tsx` | DELETE `creditAvailableAmount()`, UPDATE `currentTotal`, REMOVE "Доступно:", show debt for credit accounts, UPDATE description + label |
| 6 | `docs/index.md` | Update pitfall at ~line 91 |

### Interfaces (exact contracts):

**`FreeMoneyView` (after):**
```typescript
export interface FreeMoneyView {
  amount: number;       // Свободно = ownMoney − бюджет до зарплаты
  ownMoney: number;     // Свои деньги (дебет + max(0, кредит.баланс))
  totalDebt: number;    // Долги (сумма max(0, −кредит.баланс))
  netWorth: number;     // Чистая стоимость = ownMoney − totalDebt
  balanceNow: number;   // = ownMoney (backward compat)
}
```

**`computeOwnMoney` (new, replaces `computeCurrentCashBalance`):**
```typescript
function computeOwnMoney(accounts: Account[]): number {
  return accounts
    .filter((a) => a.includeInCashBalance)
    .reduce((sum, a) => {
      if (a.type === 'credit') {
        return sum + Math.max(0, a.currentBalance);
      }
      return sum + a.currentBalance;
    }, 0);
}
```

**`computeTotalDebt` (new):**
```typescript
function computeTotalDebt(accounts: Account[]): number {
  return accounts
    .filter((a) => a.includeInCashBalance && a.type === 'credit')
    .reduce((sum, a) => sum + Math.max(0, -a.currentBalance), 0);
}
```

**`calculateDashboard` return (after):**
```typescript
const freeMoney: FreeMoneyView = {
  amount: freeAmount,
  ownMoney,
  totalDebt,
  netWorth: ownMoney - totalDebt,
  balanceNow: ownMoney,
};
```

### Invariants:
- `freeUntilNextIncome = ownMoney − totalRequiredAllocations` — same structure, different base
- `creditAvailable` REMOVED from all paths — no field, no computation, no UI
- Debit behavior: completely unchanged
- `includeInCashBalance` gate preserved
- Calculation remains pure — no side effects

### Risks + mitigation:
- Test "without creditLimit" uses `currentBalance: 50000` (positive) on credit → old: credit contributes 0 to cashBalance (balanceNow = 100000 debit only), new: contributes 50000 to ownMoney (balanceNow = 150000). Update expectation.
- Test "with creditLimit" asserts `creditAvailable` → remove that assertion, check `ownMoney`/`totalDebt` instead.
- `netWorth` negative for indebted users → display with red styling.
- `currentBalance` on debit could be negative (overdraft) → included as-is, reduces ownMoney. Correct behavior.
- **PlanPage.tsx:407-409** still shows "Доступно:" — OUT OF SCOPE, handled in 9b.

## 4) Implementation steps

### Step 1: `src/domain/dashboard/types.ts`
Replace FreeMoneyView:
```typescript
export interface FreeMoneyView {
  amount: number;
  ownMoney: number;
  totalDebt: number;
  netWorth: number;
  balanceNow: number;
}
```

### Step 2: `src/domain/dashboard/calculateDashboard.ts`
1. DELETE function `creditAvailableFunds` (lines 5-8)
2. DELETE function `computeCreditAvailable` (lines 21-25)
3. REPLACE function `computeCurrentCashBalance` (lines 10-19) with:
   ```typescript
   function computeOwnMoney(accounts: Account[]): number {
     return accounts
       .filter((a) => a.includeInCashBalance)
       .reduce((sum, a) => {
         if (a.type === 'credit') {
           return sum + Math.max(0, a.currentBalance);
         }
         return sum + a.currentBalance;
       }, 0);
   }

   function computeTotalDebt(accounts: Account[]): number {
     return accounts
       .filter((a) => a.includeInCashBalance && a.type === 'credit')
       .reduce((sum, a) => sum + Math.max(0, -a.currentBalance), 0);
   }
   ```
4. UPDATE `computeFreeUntilNextIncome` (lines 40-48): accept `ownMoney` as parameter instead of computing internally:
   ```typescript
   function computeFreeUntilNextIncome(input: DashboardInput, ownMoney: number): number {
     const totalRequired = computeTotalRequiredAllocations(
       input.categories,
       input.nextIncomeDate,
       input.today,
     );
     return ownMoney - totalRequired;
   }
   ```
5. UPDATE `calculateDashboard` (lines 65-80):
   ```typescript
   const ownMoney = computeOwnMoney(input.accounts);
   const totalDebt = computeTotalDebt(input.accounts);
    const freeAmount = computeFreeUntilNextIncome(input, ownMoney);
   const freeMoney: FreeMoneyView = {
     amount: freeAmount,
     ownMoney,
     totalDebt,
     netWorth: ownMoney - totalDebt,
     balanceNow: ownMoney,
   };
   ```

### Step 3: `src/components/cards/FreeMoneyHeroCard.tsx`
Replace entire component body:
```tsx
export default function FreeMoneyHeroCard({ data, onEditBalance }: Props) {
  return (
    <section className="rounded-[18px] border-t-2 border-t-[#58d68d] bg-[#121821] p-[18px]">
      <div className="mb-4">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#75b8ff]">
            Свободно до следующего дохода
          </div>
          <div className="text-[34px] font-extrabold leading-[0.98] tracking-[-0.05em] text-[#eef4f8]">
            {data.amount.toLocaleString('ru-RU')} ₽
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEditBalance}
        className="cursor-pointer text-left"
      >
        <div className="mb-1">
          <div className="text-xs text-[#8795a5]">Свои деньги</div>
          <div className="text-sm font-bold text-[#eef4f8]">{data.ownMoney.toLocaleString('ru-RU')} ₽</div>
        </div>
        {data.totalDebt > 0 && (
          <div>
            <div className="text-xs text-[#e74c3c]">Долги</div>
            <div className="text-sm font-bold text-[#e74c3c]">−{data.totalDebt.toLocaleString('ru-RU')} ₽</div>
          </div>
        )}
      </button>
    </section>
  );
}
```

### Step 4: `src/components/operations/EditBalanceModal.tsx`

Changes (by line in current file):

1. **DELETE `creditAvailableAmount` helper** (lines 40-44). Remove the entire function.

2. **UPDATE `currentTotal`** (lines 46-48). Replace with ownMoney logic:
   ```typescript
   const currentTotal =
     debitAccounts.reduce((sum, a) => sum + a.currentBalance + (edits[a.id] ?? 0), 0) +
     creditAccounts.reduce((sum, a) => sum + Math.max(0, a.currentBalance + (edits[a.id] ?? 0)), 0);
   ```

3. **UPDATE description** (line 54-55): "Сумма остатков дебетовых счетов и доступных средств кредитных карт." → "Свои реальные деньги: дебетовые остатки и переплаты по кредиткам."

4. **UPDATE title** (line 53): "Баланс сейчас" → "Свои деньги"

5. **DELETE `avail` variable** (line 95). Remove `const avail = creditAvailableAmount(acc);` — it references the deleted helper.

6. **REPLACE credit card "Доступно:" line** (lines 103-105). Instead of `Доступно: {avail}` show debt (with pending edits):
   ```tsx
   {(() => {
     const editedBalance = acc.currentBalance + (edits[acc.id] ?? 0);
     return editedBalance < 0 ? (
       <div className="text-xs text-[#e74c3c]">
         Долг: {Math.abs(editedBalance).toLocaleString('ru-RU')} ₽
       </div>
     ) : (
       <div className="text-xs text-[#58d68d]">
         Переплата: {editedBalance.toLocaleString('ru-RU')} ₽
       </div>
     );
   })()}
   ```

7. **UPDATE total label** (line 176): "Итого баланс сейчас" → "Свои деньги"

### Step 5: `src/domain/dashboard/__tests__/calculateDashboard.test.ts`

**Update test 1** ("freeUntilNextIncome = cashBalance - proportionalLiving", line 32):
- Rename test to "freeUntilNextIncome = ownMoney - proportionalLiving"
- `balanceNow` stays 212000 (debit only, credit-1 has -30000 → ownMoney += 0)
- Add: `expect(result.freeMoney.ownMoney).toBe(212000)`
- Add: `expect(result.freeMoney.totalDebt).toBe(30000)`
- Add: `expect(result.freeMoney.netWorth).toBe(212000 - 30000)`

**Update test 2** ("credit account without creditLimit", line 43):
- Rename to "credit account with positive balance contributes overpayment to ownMoney"
- Credit account: `currentBalance: 50000` (positive, no creditLimit)
- `ownMoney = 100000 + 50000 = 150000`
- `balanceNow = 150000`
- `totalDebt = 0`
- Remove old expectation `balanceNow === 100000`

**Update test 3** ("credit account with creditLimit contributes available funds", line 55):
- Rename to "credit account with debt: ownMoney excludes debt, totalDebt includes it"
- Account: credit `currentBalance: -300000, creditLimit: 500000`
- `ownMoney = 100000` (debit only, credit contributes max(0, -300000) = 0)
- `totalDebt = 300000`
- `balanceNow = 100000`
- `netWorth = 100000 - 300000 = -200000`
- REMOVE `creditAvailable` assertion

**Update test 4** ("credit account over limit contributes 0", line 68):
- Rename to "credit account over limit: ownMoney excludes debt, totalDebt includes full debt"
- Account: credit `currentBalance: -550000, creditLimit: 500000`
- `ownMoney = 100000`
- `totalDebt = 550000`
- REMOVE `creditAvailable` assertion
- Add `ownMoney`, `totalDebt` assertions

**New test 5**: "netWorth = ownMoney - totalDebt"
- 1 debit (200000) + 1 credit (currentBalance -110000)
- `ownMoney = 200000`, `totalDebt = 110000`, `netWorth = 90000`

**New test 6**: "debit account with positive balance contributes fully to ownMoney"
- Single debit (150000)
- `ownMoney = 150000`, `totalDebt = 0`, `netWorth = 150000`

**New test 7**: "excluded accounts do not affect ownMoney or totalDebt"
- 1 debit (100000, includeInCashBalance: true) + 1 credit (currentBalance: -50000, includeInCashBalance: false)
- `ownMoney = 100000`, `totalDebt = 0` (credit excluded from all calculations)

### Step 6: `docs/index.md`
Replace pitfall at ~line 91:
```
- **Own money vs credit:** credit accounts contribute `max(0, currentBalance)` to ownMoney (overpayment only). Available credit is NOT shown — goal is to reduce credit dependency. `totalDebt = sum(max(0, -currentBalance))` for credit accounts with `includeInCashBalance: true`.
```

## 5) Validation
- Fast gate: `make smoke` → lint + test pass
- `npx vitest run src/domain/dashboard/` → all tests pass (4 updated + 3 new)
- `npm run typecheck` → exit 0
- Pareto blackbox:
  - Credit `currentBalance: -113000, creditLimit: 250000`: `ownMoney` excludes 137K available, `totalDebt = 113000`
  - Credit `currentBalance: 50000` (overpayment): `ownMoney` includes 50K, `totalDebt = 0`
  - Debit `currentBalance: 200000`: `ownMoney = 200000`
  - Mixed 1 debit (200K) + 1 credit (-110K): `ownMoney = 200K`, `totalDebt = 110K`
- Rollback: revert all 6 files, `make preflight` green

## 6) DOD
- [ ] `FreeMoneyView`: `+ownMoney`, `+totalDebt`, `+netWorth`, `−creditAvailable`
- [ ] `creditAvailableFunds` DELETED from calculateDashboard.ts
- [ ] `computeCreditAvailable` DELETED from calculateDashboard.ts
- [ ] `computeCurrentCashBalance` REPLACED by `computeOwnMoney`
- [ ] `computeTotalDebt` ADDED to calculateDashboard.ts
- [ ] `computeFreeUntilNextIncome` accepts `ownMoney` as parameter
- [ ] HeroCard shows "Свои деньги" + "Долги", no credit-available
- [ ] EditBalanceModal: ownMoney total, no creditAvailableAmount, shows debt
- [ ] docs/index.md pitfall updated
- [ ] 4 existing tests updated, 3 new tests added
- [ ] `make preflight` passes

## 7) Final verdict
Ready for implementation: yes