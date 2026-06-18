# RFC: Planner Matrix (Future Goals)

## 1. Objective
Transform `PlanPage.tsx` into a matrix view (Months across columns, Categories across rows) to set and visualize future targets. This bridges the gap between short-term ZBB budgeting and long-term financial forecasting.

## 2. TypeScript Contracts

```typescript
// src/store/types.ts update for MonthState
export interface MonthState {
  month: string;
  categoryAssignments: Record<string, number>;
  categoryCarryover: Record<string, number>;
  toBeBudgeted: number;
  categoryTargets?: Record<string, number>; // NEW: Target goals for the month
}

// src/components/plan/PlannerMatrix.tsx
export interface PlannerMatrixProps {
  categories: Category[];
  months: string[]; // e.g., ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
  targets: Record<string, Record<string, number>>; // month -> categoryId -> targetAmount
  onUpdateTarget: (month: string, categoryId: string, amount: number) => void;
}
```

## 3. State Management (Zustand)
Add `setCategoryTarget` action to `StoreActions`:
```typescript
setCategoryTarget: (month: string, categoryId: string, amount: number) => void;
```
*Logic:* Finds the `MonthState` for `month` (creates it if it doesn't exist). Initializes `categoryTargets` object if undefined. Sets `categoryTargets[categoryId] = amount`.

## 4. Blackbox Testing Strategy
**Target File:** `src/store/__tests__/planner.test.ts`
- **Test 1:** `setCategoryTarget` saves target correctly for an existing month state.
- **Test 2:** `setCategoryTarget` seamlessly creates a future month state if it doesn't exist yet, ensuring future planning doesn't crash the app.
