# RFC 08: Operations Inbox & Categorization

## 1. Objective & UX Philosophy
Manage the `OperationsPage.tsx` as a high-speed Inbox for uncategorized transactions (`ReviewQueue`) and a historical feed.
**UX Constraint:** Optimize for speed of categorization. When an imported transaction lacks a category, the user must be able to assign it with 1 tap (using predictive UI or a clean dropdown). No animations, just instant response.

## 2. Domain Boundaries
- **Ownership:** `src/domain/import/` (parsing), `src/domain/categorization/` (rules), and `src/components/operations/`.
- **Isolation:** This domain mutates `Transaction.categoryId` and `Transaction.isReviewed`. It does NOT touch `MonthState` directly (the derived store logic handles the recalculation of Activity/Available automatically).

## 3. TypeScript Contracts
```typescript
// src/components/operations/ReviewQueue.tsx
export interface ReviewTransactionProps {
  transactionId: string;
  description: string;
  amount: number;
  date: string;
  suggestedCategoryId?: string;
  onApprove: (transactionId: string, categoryId: string) => void;
}

export interface ReviewQueueProps {
  unreviewedTransactions: ReviewTransactionProps[];
  onApproveAll: () => void;
}
```

## 4. State Management (Zustand)
```typescript
// Existing actions in store/types.ts
updateTransactionCategory: (id: string, categoryId: string) => void;
markTransactionReviewed: (id: string) => void; // Potentially needed if not combining
```

## 5. Blackbox Testing (Pareto)
**Target:** `src/domain/categorization/__tests__/reviewQueue.test.ts` (or store test)
- **Test 1:** Marking a transaction as reviewed updates its flag and correctly removes it from the `unreviewedTransactions` selector.

## 6. Agent Feedback Loop
**Pre-requisite for implementing Agent:**
1. Run `make smoke && make preflight` BEFORE writing code.
2. Implement TS contracts first, check via `npm run typecheck`.
3. Write test, verify it fails.
4. Implement logic.
5. Run `make smoke && make preflight` AFTER completion to guarantee 0 regressions.
