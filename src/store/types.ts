export interface Account {
  id: string;
  name: string;
  type: 'debit' | 'credit';
  includeInCashBalance: boolean;
  currentBalance: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId?: string;
  accountId: string;
  importBatchId?: string;
  externalHash?: string;
  isReviewed?: boolean;
  sourceProfile?: string;
}

export interface Category {
  id: string;
  name: string;
  plan: number;
  type: 'living' | 'savings' | 'obligation';
}

export interface Obligation {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  isProtected: boolean;
  categoryId?: string;
}

export interface Allocation {
  id: string;
  obligationId: string;
  amount: number;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  type: 'debt_payoff' | 'savings';
  targetAmount: number;
  currentAmount: number;
  isPrimary: boolean;
}

export interface ImportBatch {
  id: string;
  date: string;
  filename: string;
  transactionCount: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface CategorizationRule {
  id: string;
  pattern: string;
  categoryId: string;
  priority: number;
  matchType: 'contains' | 'equals' | 'regex';
  matchField: 'description';
  active?: boolean;
}

export interface StoreState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  obligations: Obligation[];
  allocations: Allocation[];
  goals: Goal[];
  importBatches: ImportBatch[];
  rules: CategorizationRule[];
  nextIncomeDate: string;
  expectedMonthlyIncome: number;
  todayFlexibleSpent: number;
}

export interface StoreActions {
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  addTransactions: (txns: Omit<Transaction, 'id'>[]) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  setNextIncomeDate: (date: string) => void;
  setExpectedMonthlyIncome: (amount: number) => void;
  setTodayFlexibleSpent: (amount: number) => void;
  restoreFromJSON: (json: string) => void;
  commitImport: (transactions: Omit<Transaction, 'id'>[], batch: Omit<ImportBatch, 'id'>) => void;
  undoImport: (batchId: string) => void;
  updateTransactionCategory: (id: string, categoryId: string) => void;
  addRule: (rule: Omit<CategorizationRule, 'id'>) => void;
  toggleRuleActive: (id: string, active: boolean) => void;
  upsertObligation: (obligation: Omit<Obligation, 'id'> & { id?: string }) => void;
  deleteObligation: (id: string) => void;
  upsertCategory: (category: Omit<Category, 'id'> & { id?: string }) => void;
  setGoalProgress: (id: string, currentAmount: number) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  deleteAllocation: (id: string) => void;
}

export type DenezhkaStore = StoreState & StoreActions;
