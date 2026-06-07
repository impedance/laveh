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

export interface ObligationsView {
  period: string;
  remainingToAllocate: number;
  totalNeeded: number;
  alreadyAllocated: number;
  items: Array<{
    title: string;
    date: string;
    status: string;
    amount: number;
    type: 'ok' | 'warn';
  }>;
}

export interface SafeDailyPaceView {
  perDay: number;
  spentToday: number;
  remainingToday: number;
  percentUsed: number;
}

export interface MoneyGuardView {
  actionCount: number;
  action: { title: string; description: string };
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

export interface RecurringExpensesView {
  items: Array<{
    name: string;
    percent: number;
    amount: number;
    type?: 'warn' | 'green';
  }>;
}

export interface DashboardViewModel {
  freeMoney: FreeMoneyView;
  obligations: ObligationsView;
  safeDailyPace: SafeDailyPaceView;
  moneyGuard: MoneyGuardView;
  primaryGoal: PrimaryGoalView;
  recurringExpenses: RecurringExpensesView;
}
