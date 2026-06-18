# RFC 07: Planner Matrix (Future Goals)

## 1. Objective & UX Philosophy
Transform `PlanPage.tsx` into a high-density matrix (Months x Categories) to set future targets.
**UX Constraint:** Pure data table / spreadsheet view. No padding waste. Users should be able to scan 6-12 months of targets on a single screen. Functional typography over aesthetic styling.

## 2. Domain Boundaries
- **Ownership:** `src/domain/planner/` and `src/components/plan/`.
- **Isolation:** Interacts purely with the `MonthState.categoryTargets` property. Does not affect current month `categoryAssignments` or `toBeBudgeted`.

## 3. TypeScript Contracts
```typescript
// src/store/types.ts
export interface MonthState {
  month: string;
  categoryAssignments: Record<string, number>;
  categoryCarryover: Record<string, number>;
  toBeBudgeted: number;
  categoryTargets?: Record<string, number>; // Target needed for this month
}

// src/components/plan/PlannerMatrix.tsx
export interface PlannerMatrixProps {
  categories: { id: string; name: string; groupId: string }[];
  months: string[]; // ['2026-06', '2026-07', ...]
  targets: Record<string, Record<string, number>>; // month -> categoryId -> amount
  onUpdateTarget: (month: string, categoryId: string, amount: number) => void;
}
```

## 4. State Management (Zustand)
```typescript
setCategoryTarget: (month: string, categoryId: string, amount: number) => void;
```

## 5. Blackbox Testing (Pareto)
**Target:** `src/store/__tests__/planner.test.ts`
- **Test 1:** `setCategoryTarget` securely creates a future `MonthState` if it does not exist, initializing targets correctly.

## 6. Agent Feedback Loop
**Pre-requisite for implementing Agent:**
1. Run `make smoke && make preflight` BEFORE writing code.
2. Implement TS contracts first, check via `npm run typecheck`.
3. Write test, verify it fails.
4. Implement logic.
5. Run `make smoke && make preflight` AFTER completion to guarantee 0 regressions.
