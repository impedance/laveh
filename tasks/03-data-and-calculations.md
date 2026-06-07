---

## 11. Data model

Типы описывают структуру Zustand store. Хранятся в `src/store/types.ts`.

### accounts

```ts
type Account = {
  id: string;
  name: string;
  type: 'cash' | 'debit' | 'credit' | 'savings';
  bank?: 'tbank' | 'manual' | 'other';
  currency: 'RUB';
  includeInCashBalance: boolean;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
};
```

Rule:

```txt
Credit accounts must not increase Current Cash Balance.
```

---

### transactions

```ts
type Transaction = {
  id: string;
  date: string;
  amount: number;
  direction: 'income' | 'expense' | 'transfer';
  accountId: string;
  merchant?: string;
  description?: string;
  categoryId?: string;
  owner: 'me';
  source: 'excel' | 'manual';
  sourceImportId?: string;
  externalHash: string;
  isReviewed: boolean;
  isInternalTransfer: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

### categories

```ts
type Category = {
  id: string;
  name: string;
  group: 'income' | 'mandatory' | 'living' | 'flexible' | 'debt' | 'reserve' | 'joy';
  monthlyPlan?: number;
  isActive: boolean;
};
```

---

### obligations

```ts
type Obligation = {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  dueDate?: string;
  categoryId: string;
  priority: number;
  isMandatory: boolean;
  allocatedAmount: number;
  status: 'protected' | 'underfunded' | 'paid';
  createdAt: string;
  updatedAt: string;
};
```

---

### allocations

```ts
type Allocation = {
  id: string;
  period: string; // YYYY-MM
  targetType: 'category' | 'obligation' | 'goal' | 'reserve';
  targetId: string;
  plannedAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  createdAt: string;
  updatedAt: string;
};
```

---

### goals

```ts
type Goal = {
  id: string;
  title: string;
  type: 'debt_payoff' | 'reserve' | 'saving';
  targetAmount: number;
  currentAmount: number;
  priority: number;
  nextMilestoneAmount?: number;
  deadline?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

### imports

```ts
type ImportBatch = {
  id: string;
  fileName: string;
  importedAt: string;
  rowCount: number;
  importedCount: number;
  duplicateCount: number;
  needsReviewCount: number;
  status: 'preview' | 'committed' | 'failed';
};
```

---

### rules

```ts
type CategorizationRule = {
  id: string;
  name: string;
  matchField: 'merchant' | 'description';
  matchType: 'contains' | 'equals' | 'regex';
  pattern: string;
  categoryId: string;
  priority: number;
  isActive: boolean;
## 17. Dashboard calculation service

Create a pure calculation module:

```txt
src/domain/dashboard/calculateDashboard.ts
```

Inputs:

```ts
type DashboardInput = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  obligations: Obligation[];
  allocations: Allocation[];
  goals: Goal[];
  nextIncomeDate: string;
  today: string;
};
```

Output:

```ts
type DashboardViewModel = {
  currentCashBalance: number;
  alreadyAllocated: number;
  freeUntilNextIncome: number;
  nextIncomeDate: string;
  daysUntilNextIncome: number;
  safeDailyPace: number;
  todayFlexibleSpent: number;
  todayRemaining: number;
  obligationSummary: {
    required: number;
    allocated: number;
    gap: number;
  };
  obligations: ObligationView[];
  primaryGoal: GoalView;
  recurringExpenses: RecurringExpenseView[];
  moneyGuardAction?: MoneyGuardAction;
  mode: 'calm' | 'caution' | 'stop';
};
```
