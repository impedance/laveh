import { describe, it, expect } from 'vitest';
import { calculateDashboard } from '../calculateDashboard';
import type { DashboardInput } from '../types';

const baseInput: DashboardInput = {
  accounts: [
    { id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 212000 },
    { id: 'credit-1', name: 'Кредитка', type: 'credit', includeInCashBalance: true, currentBalance: -30000 },
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
    { id: 'obl-3', title: 'Кредитка', amount: 30000, dueDate: '2026-06-20', isProtected: false },
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
  today: '2026-06-07',
};

describe('calculateDashboard', () => {
  it('freeUntilNextIncome = cashBalance - totalRequiredAllocations', () => {
    const result = calculateDashboard(baseInput);
    const cashBalance = 212000;
    const expectedFree = result.freeMoney.amount;
    expect(result.freeMoney.balanceNow).toBe(cashBalance);
    expect(expectedFree).toBeGreaterThan(0);
    expect(result.freeMoney.amount).toBe(cashBalance - result.freeMoney.distributed);
  });

  it('credit account excluded from cash balance', () => {
    const input: DashboardInput = {
      ...baseInput,
      accounts: [
        { id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 100000 },
        { id: 'credit-1', name: 'Кредитка', type: 'credit', includeInCashBalance: true, currentBalance: 50000 },
      ],
    };
    const result = calculateDashboard(input);
    expect(result.freeMoney.balanceNow).toBe(100000);
  });

  it('mode = stop when freeMoney < 0', () => {
    const input: DashboardInput = {
      ...baseInput,
      accounts: [{ id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 1000 }],
      obligations: [
        { id: 'obl-1', title: 'Долг', amount: 50000, dueDate: '2026-06-10', isProtected: false },
      ],
      allocations: [],
      categories: [],
      goals: [],
    };
    const result = calculateDashboard(input);
    expect(result.freeMoney.mode).toBe('стоп');
  });

  it('mode = calm when incomeRatio > 0.2', () => {
    const input: DashboardInput = {
      ...baseInput,
      obligations: [],
      allocations: [],
      categories: [],
      goals: [],
      accounts: [{ id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 100000 }],
      expectedMonthlyIncome: 100000,
    };
    const result = calculateDashboard(input);
    expect(result.freeMoney.mode).toBe('спокойно');
  });

  it('mode = caution when incomeRatio between 0 and 0.2', () => {
    const input: DashboardInput = {
      ...baseInput,
      obligations: [],
      allocations: [],
      categories: [],
      goals: [],
      accounts: [{ id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 10000 }],
      expectedMonthlyIncome: 100000,
    };
    const result = calculateDashboard(input);
    expect(result.freeMoney.mode).toBe('внимание');
  });

  it('safeDailyPace = 0 when daysUntilIncome = 0', () => {
    const input: DashboardInput = {
      ...baseInput,
      nextIncomeDate: '2026-06-07',
      today: '2026-06-07',
      obligations: [],
      allocations: [],
      categories: [],
      goals: [],
      accounts: [{ id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 100 }],
    };
    const result = calculateDashboard(input);
    expect(result.safeDailyPace.perDay).toBe(0);
  });

  it('obligation gap = plannedAmount - allocatedAmount', () => {
    const result = calculateDashboard(baseInput);
    const creditCardObl = result.obligations.items.find((o) => o.title === 'Кредитка');
    expect(creditCardObl).toBeDefined();
    expect(creditCardObl!.type).toBe('warn');
  });

  it('obligation gap = 0 when allocatedAmount >= plannedAmount', () => {
    const input: DashboardInput = {
      ...baseInput,
      allocations: [
        { id: 'alloc-1', obligationId: 'obl-3', amount: 30000, date: '2026-06-01' },
      ],
    };
    const result = calculateDashboard(input);
    const creditCardObl = result.obligations.items.find((o) => o.title === 'Кредитка');
    expect(creditCardObl).toBeDefined();
    expect(creditCardObl!.type).toBe('ok');
  });

  it('primaryGoal progress = current / target', () => {
    const result = calculateDashboard(baseInput);
    expect(result.primaryGoal.percent).toBe(57);
    expect(result.primaryGoal.accumulated).toBe(400000);
    expect(result.primaryGoal.target).toBe(700000);
  });


});
