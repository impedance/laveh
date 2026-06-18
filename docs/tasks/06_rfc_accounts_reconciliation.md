# RFC: Accounts Reconciliation

## 1. Objective
Implement the "Reconcile" (Сверка баланса) feature in `AccountsPage.tsx`. This allows users to input their actual bank balance. If it differs from the app's calculated balance, a corrective transaction is automatically created to bridge the gap.

## 2. TypeScript Contracts

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

## 3. State Management (Zustand)
Add `reconcileAccount` action to `StoreActions`:
```typescript
reconcileAccount: (accountId: string, actualBalance: number) => void;
```

*Logic:* 
1. Find `account` by `accountId`. Calculate `delta = actualBalance - account.currentBalance`.
2. If `delta !== 0`, create a new `Transaction`:
   - `id`: generated UUID
   - `accountId`: `accountId`
   - `amount`: `delta`
   - `description`: "Reconciliation Adjustment"
   - `date`: Today's ISO date string
   - `isReviewed`: true
3. The store's derived state calculation will automatically absorb this transaction and correct the overall `account.currentBalance` and `toBeBudgeted` (if it's an on-budget debit account).

## 4. Blackbox Testing Strategy
**Target File:** `src/store/__tests__/reconciliation.test.ts`
- **Test 1:** Calling `reconcileAccount` with a balance $100 higher creates a +$100 transaction.
- **Test 2:** Calling `reconcileAccount` with the same balance does nothing (no transaction created).
- **Test 3:** Reconciliation of a Credit account correctly adjusts debt without inflating liquid cash.
