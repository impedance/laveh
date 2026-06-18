# RFC: Budget Dashboard (ZBB)

## 1. Objective
Refactor `HomePage.tsx` to act as a strict Zero-Based Budgeting (ZBB) dashboard. Implement the core "Assigned / Activity / Available" columns and the "Roll with the Punches" (cover overspending) mechanism.

## 2. TypeScript Contracts

```typescript
// src/components/budget/CategoryBudgetRow.tsx
export interface CategoryBudgetRowProps {
  categoryId: string;
  name: string;
  assigned: number;
  activity: number;
  available: number;
  isOverspent: boolean; // true if available < 0
  onAssignChange: (newAmount: number) => void;
  onCoverClick: () => void; // Triggers the WAM (Whack-a-mole) modal
}

// src/components/budget/CoverOverspendingModal.tsx
export interface CategoryOption {
  id: string;
  name: string;
  available: number;
}

export interface CoverOverspendingModalProps {
  targetCategoryId: string;
  shortfall: number; // Absolute amount needed to reach 0
  options: CategoryOption[];
  onConfirm: (sourceCategoryId: string) => void;
  onClose: () => void;
}
```

## 3. State Management (Zustand)
Add `coverOverspending` action to `StoreActions`:
```typescript
coverOverspending: (month: string, sourceCategoryId: string, targetCategoryId: string, amount: number) => void;
```
*Logic:* Decreases `categoryAssignments` for source by `amount`, increases `categoryAssignments` for target by `amount` in the given `month`.

## 4. Blackbox Testing Strategy (Pareto Principle)
**Target File:** `src/store/__tests__/budgetMechanics.test.ts`
- **Test 1:** `coverOverspending` correctly moves assignment from Source to Target without affecting `toBeBudgeted`.
- **Test 2:** `coverOverspending` fails or clamps gracefully if `amount` is invalid or negative.
