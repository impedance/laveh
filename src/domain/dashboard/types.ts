import type { Account, Transaction, Category, CategoryGroup, ImportBatch, CategorizationRule, ObligatoryPayment } from '../../store/types';

export interface DashboardInput {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  importBatches: ImportBatch[];
  rules: CategorizationRule[];
  nextIncomeDate: string;
  expectedMonthlyIncome: number;
  todayFlexibleSpent: number;
  today: string;
  obligatoryPayments: ObligatoryPayment[];
}


export interface FreeMoneyView {
  amount: number;
  ownMoney: number;
  totalDebt: number;
  netWorth: number;
  balanceNow: number;
}

export interface CategoryView {
  id: string;
  name: string;
  plan: number;
}

export interface CategoryGroupView {
  id: string;
  name: string;
  categories: CategoryView[];
  totalPlan: number;
}

export interface ObligatoryPaymentView {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  dueDate: string;
  isDue: boolean;
}

export interface DashboardViewModel {
  freeMoney: FreeMoneyView;
  spendingGroups: CategoryGroupView[];
  obligatoryPayments: ObligatoryPaymentView[];
}
