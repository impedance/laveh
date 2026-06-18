# RFC 06: Accounts Reconciliation

## 1. Objective & UX Philosophy
Implement the "Reconcile" feature in `AccountsPage.tsx`. 
**UX Constraint:** Extremely utilitarian. A simple list of accounts with their calculated balances, and a clean numeric input for reconciliation. No visual clutter.

## 2. Domain Boundaries
- **Ownership:** `src/domain/accounts/` and `src/components/accounts/`.
- **Isolation:** Modifies `Account.currentBalance` and generates a single system `Transaction`. It must not touch budget categories or month states directly.

## 3. TypeScript Contracts
```typescript
// src/components/accounts/ReconcileModal.tsx
export interface ReconcileModalProps {
  accountId: string;
  accountName: string;
  calculatedBalance: number;
  onConfirm: (actualBalance: number) => void;
  onClose: () => void;
}
```

## 4. State Management (Zustand)
```typescript
reconcileAccount: (accountId: string, actualBalance: number) => void;
```
*Logic:* 
`delta = actualBalance - account.currentBalance`.
If `delta !== 0`, create a `Transaction` (amount: delta, description: "Reconciliation Adjustment", isReviewed: true). Update `account.currentBalance`.

## 5. Blackbox Testing (Pareto)
**Target:** `src/store/__tests__/reconciliation.test.ts`
- **Test 1:** `reconcileAccount` with discrepancy generates exactly one adjustment transaction and matches the new balance.
- **Test 2:** `reconcileAccount` with matching balance generates 0 transactions.

## 6. Agent Feedback Loop
**Pre-requisite for implementing Agent:**
1. Run `make smoke && make preflight` BEFORE writing code.
2. Implement TS contracts first, check via `npm run typecheck`.
3. Write test, verify it fails.
4. Implement logic.
5. Run `make smoke && make preflight` AFTER completion to guarantee 0 regressions.
