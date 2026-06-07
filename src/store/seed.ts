import type { StoreState } from './types';

export const seedData: StoreState = {
  accounts: [
    { id: 'cash-1', name: 'Основной счёт', type: 'debit', includeInCashBalance: true, currentBalance: 212000 },
  ],
  transactions: [],
  categories: [
    { id: 'cat-1', name: 'Продукты', plan: 60000, type: 'living' },
    { id: 'cat-2', name: 'Подписки', plan: 5000, type: 'living' },
    { id: 'cat-3', name: 'Транспорт', plan: 20000, type: 'living' },
  ],
  obligations: [
    { id: 'obl-1', title: 'Ипотека', amount: 84000, dueDate: '2026-06-10', isProtected: true },
    { id: 'obl-2', title: 'Автокредит', amount: 34000, dueDate: '2026-06-15', isProtected: true },
    { id: 'obl-3', title: 'Кредитка · платёж месяца', amount: 30000, dueDate: '2026-06-20', isProtected: false },
  ],
  allocations: [
    { id: 'alloc-1', obligationId: 'obl-1', amount: 84000, date: '2026-06-01' },
    { id: 'alloc-2', obligationId: 'obl-2', amount: 34000, date: '2026-06-01' },
    { id: 'alloc-3', obligationId: 'obl-3', amount: 18000, date: '2026-06-01' },
  ],
  goals: [
    { id: 'goal-1', title: 'Закрыть кредитку', type: 'debt_payoff', targetAmount: 700000, currentAmount: 400000, isPrimary: true },
  ],
  importBatches: [],
  rules: [],
  nextIncomeDate: '2026-06-25',
  expectedMonthlyIncome: 212000,
  todayFlexibleSpent: 1240,
};
