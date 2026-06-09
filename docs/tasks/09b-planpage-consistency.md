# Work Plan: Phase 9b — PlanPage Credit Display Consistency

> **Depends on:** Phase 9a (own-money-model)
> **Blocks:** None

## 0) Orientation
- Read: `src/pages/PlanPage.tsx:394-413` — credit account section shows "Доступно:" using `creditLimit + currentBalance`
- After Phase 9a, the dashboard no longer shows credit available anywhere. PlanPage still shows "Доступно:" per credit account using the old formula. This is a consistency issue.
- Anchor context:
  - `src/pages/PlanPage.tsx:407-409` — shows computed available: `Math.max(0, acc.creditLimit + acc.currentBalance)` with label "Доступно:"
  - Phase 9a removed credit-available from FreeMoneyHeroCard and EditBalanceModal. PlanPage is the last place showing credit-available display.

## 1) Outcome
- Replace "Доступно:" (credit available) with "Долг:" (debt) for credit accounts in PlanPage. Consistent with Phase 9a financial truth model.
- Success criteria:
  - PlanPage credit accounts show "Долг: {abs(currentBalance)} ₽" when `currentBalance < 0`
  - PlanPage credit accounts show "Переплата: {currentBalance} ₽" when `currentBalance > 0`
  - No "Доступно:" text or `creditLimit + currentBalance` computation anywhere in the app
  - Credit limit input still available (needed for reference/editing, not for dashboard model)

## 2) Scope
- In scope:
  - `src/pages/PlanPage.tsx:394-413` — credit account display section
- Out of scope:
  - PlanPage layout/structure changes
  - Removing creditLimit from Account type (still needed for editing, even though not used in dashboard)

## 3) Change surface + safety
- Entry points:
  - `src/pages/PlanPage.tsx:407-409` — "Доступно:" line
- Files/modules:
  - Modify: `src/pages/PlanPage.tsx` (lines 407-409: replace "Доступно:" with debt display)
- Invariants:
  - `creditLimit` field remains on Account type (used in EditBalanceModal input, not in dashboard)
  - PlanPage still renders credit limit input for editing
  - No `creditLimit + currentBalance` computation anywhere in PlanPage after this change

## 4) Implementation steps

### Step 1: Replace credit account "Доступно:" display in PlanPage
**File:** `src/pages/PlanPage.tsx`, lines ~407-409

Current:
```tsx
<div className="mt-1 text-xs text-[#75b8ff]">
  Доступно: {(acc.creditLimit == null || acc.creditLimit === 0 ? 0 : Math.max(0, acc.creditLimit + acc.currentBalance)).toLocaleString('ru-RU')} ₽
</div>
```

Replace with:
```tsx
{acc.currentBalance < 0 ? (
  <div className="mt-1 text-xs text-[#e74c3c]">
    Долг: {Math.abs(acc.currentBalance).toLocaleString('ru-RU')} ₽
  </div>
) : acc.currentBalance > 0 ? (
  <div className="mt-1 text-xs text-[#58d68d]">
    Переплата: {acc.currentBalance.toLocaleString('ru-RU')} ₽
  </div>
) : null}
```

## 5) Validation
- `make smoke` → lint + test pass (PlanPage has no unit tests, but typecheck must pass)
- `npm run typecheck` → exit 0
- Visual: PlanPage credit accounts show "Долг:" (red) when negative, "Переплата:" (green) when positive, nothing when zero. No "Доступно:" anywhere.
- Rollback: revert `src/pages/PlanPage.tsx` lines 407-409

## 6) DOD
- [x] PlanPage credit accounts show debt/overpayment instead of available credit
- [x] No `creditLimit + currentBalance` computation in PlanPage
- [x] No "Доступно:" text anywhere in the app
- [x] `creditLimit` input still present for editing
- [x] `make preflight` passes

## 7) Final verdict
Ready for implementation: yes