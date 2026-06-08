export interface Account {
  id: string;
  name: string;
  type: 'debit' | 'credit';
  includeInCashBalance: boolean;
  currentBalance: number;
  creditLimit?: number;
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

  /** T‑Bank: original operation datetime (e.g. "2026-05-31 19:42:58") */
  operationDate?: string;
  /** T‑Bank: payment/settlement date (may differ from operationDate) */
  paymentDate?: string;
  /** T‑Bank: masked card number (e.g. "*5343") */
  cardNumber?: string;
  /** T‑Bank: bank‑assigned category (e.g. "Супермаркеты") */
  bankCategory?: string;
  /** T‑Bank: merchant category code (e.g. "5411") */
  mcc?: string;
  /** T‑Bank: cashback accrued */
  cashback?: number;
  /** T‑Bank: bonuses including cashback */
  bonuses?: number;
  /** T‑Bank: status (OK, HOLD, DECLINED, …) */
  bankStatus?: string;
  /** T‑Bank: original operation currency */
  operationCurrency?: string;
  /** T‑Bank: original operation amount (before rounding) */
  operationAmount?: number;
}

export interface CategoryGroup {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  plan: number;
  groupId: string;
  sortOrder: number;
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

export interface BankMapping {
  id: string;
  bankCategory: string;
  categoryId: string;
  hitCount: number;
}

export interface StoreState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  importBatches: ImportBatch[];
  rules: CategorizationRule[];
  bankMappings: BankMapping[];
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
  upsertCategory: (category: Omit<Category, 'id' | 'sortOrder'> & { id?: string }) => void;
  deleteCategory: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  learnBankMapping: (bankCategory: string, categoryId: string) => void;
  upsertGroup: (group: Omit<CategoryGroup, 'id' | 'sortOrder'> & { id?: string }) => void;
  deleteGroup: (id: string) => void;
  reorderGroups: (ids: string[]) => void;
  moveCategoryToGroup: (categoryId: string, groupId: string) => void;
}

export type DenezhkaStore = StoreState & StoreActions;
