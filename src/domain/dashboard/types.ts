import type { Account, Transaction, Category, Obligation, Allocation, Goal, ImportBatch, CategorizationRule } from '../../store/types';

export interface DashboardInput {
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
  today: string;
}

export type Mode = 'calm' | 'caution' | 'stop';

export interface FreeMoneyView {
  amount: number;
  mode: string;
  needToSave: number;
  needToSaveUntil: string;
  balanceNow: number;
  distributed: number;
  nextIncome: string;
  lastImport: string;
}

export interface ObligationItemView {
  title: string;
  date: string;
  status: string;
  amount: number;
  type: 'ok' | 'warn';
}

export interface ObligationsView {
  period: string;
  remainingToAllocate: number;
  totalNeeded: number;
  alreadyAllocated: number;
  items: ObligationItemView[];
}

export interface SafeDailyPaceView {
  perDay: number;
  spentToday: number;
  remainingToday: number;
  percentUsed: number;
}

export interface MoneyGuardAction {
  title: string;
  description: string;
}

export interface MoneyGuardView {
  actionCount: number;
  action: MoneyGuardAction;
  uncategorized: { count: number; label: string };
}

export interface PrimaryGoalView {
  title: string;
  subtitle: string;
  percent: number;
  accumulated: number;
  target: number;
  nextMilestone: number;
}

export interface RecurringExpenseItemView {
  name: string;
  percent: number;
  amount: number;
  type?: 'warn' | 'green';
}

export interface RecurringExpensesView {
  items: RecurringExpenseItemView[];
}

export interface DashboardViewModel {
  freeMoney: FreeMoneyView;
  obligations: ObligationsView;
  safeDailyPace: SafeDailyPaceView;
  moneyGuard: MoneyGuardView;
  primaryGoal: PrimaryGoalView;
  recurringExpenses: RecurringExpensesView;
}
