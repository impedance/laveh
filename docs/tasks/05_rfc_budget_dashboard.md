# RFC 05: Budget Dashboard (ZBB)

## 1. Objective & UX Philosophy
Implement a strict Zero-Based Budgeting (ZBB) dashboard on `HomePage.tsx`.
**UX Constraint:** The interface must be concise, clean, and dense—like YNAB or a spreadsheet. **No distracting visual noise, no unnecessary "premium" animations.** Use color purely functionally (e.g., Red = Overspent, Green = Funded/Available, Gray = Empty/Neutral).

## 2. Domain Boundaries
- **Ownership:** `src/domain/budget/` (calculations) and `src/components/budget/` (UI).
- **Isolation:** This domain *reads* transactions and accounts but *never* mutates them directly. It only mutates `MonthState` (assignments).

## 3. TypeScript Contracts
```typescript
// src/components/budget/CategoryBudgetRow.tsx
export interface CategoryBudgetRowProps {
  categoryId: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
  isOverspent: boolean; // strict boolean check: available < 0
  onAssignChange: (newAmount: number) => void;
  onCoverClick: () => void; // Opens WAM modal
}

// src/components/budget/CoverOverspendingModal.tsx
export interface CategoryOption {
  id: string;
  name: string;
  available: number;
}

export interface CoverOverspendingModalProps {
  targetCategoryId: string;
  shortfall: number; 
  options: CategoryOption[];
  onConfirm: (sourceCategoryId: string) => void;
  onClose: () => void;
}
```

## 4. State Management (Zustand)
```typescript
// Strict contract for StoreActions
coverOverspending: (month: string, sourceCategoryId: string, targetCategoryId: string, amount: number) => void;
```

## 5. Blackbox Testing (Pareto)
**Target:** `src/store/__tests__/budgetMechanics.test.ts`
- **Test 1:** `coverOverspending` transfers exact amount between two categories' assignments in the target month.
- **Test 2:** Overspending coverage does not mutate `toBeBudgeted`.

## 6. Agent Feedback Loop
**Pre-requisite for implementing Agent:**
1. Run `make smoke && make preflight` BEFORE writing code.
2. Implement TS contracts first, check via `npm run typecheck`.
3. Write test, verify it fails.
4. Implement logic.
5. Run `make smoke && make preflight` AFTER completion to guarantee 0 regressions.
