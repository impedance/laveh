import type { Account, Transaction, Category, CategoryGroup, MonthState } from '../../store/types';

export interface BudgetCategoryView {
  id: string;
  name: string;
  plan: number;
  assigned: number;
  activity: number;
  available: number;
}

export interface BudgetGroupView {
  id: string;
  name: string;
  sortOrder: number;
  type?: 'obligatory' | 'regular' | 'sinking_fund';
  categories: BudgetCategoryView[];
  totalPlan: number;
  totalAssigned: number;
  totalActivity: number;
  totalAvailable: number;
  planGap: number;
}

export interface CreditCardPaymentView {
  accountId: string;
  accountName: string;
  balance: number;
  creditLimit?: number;
  available: number;
  activity: number;
  assigned: number;
  debtRemaining: number;
  paymentGap: number;
}

export interface BudgetViewModel {
  month: string;
  toBeBudgeted: number;
  totalIncome: number;
  totalAssigned: number;
  totalAssignedAll: number; // sum of all category + CC assignments (for hero subtitle)
  totalActivity: number;
  ownMoney: number;
  totalDebt: number;
  freeMoney: number; // = toBeBudgeted (YNAB envelope model)
  categoryGroups: BudgetGroupView[];
  creditCardPayments: CreditCardPaymentView[];
}

export interface BudgetInput {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  monthState: MonthState;
  previousMonthState?: MonthState;
  month: string;
}
