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
    { id: 'cat-1', name: 'Продукты', plan: 60000, groupId: 'group-obligatory', sortOrder: 0 },
    { id: 'cat-2', name: 'Подписки', plan: 5000, groupId: 'group-regular', sortOrder: 0 },
    { id: 'cat-3', name: 'Транспорт', plan: 20000, groupId: 'group-regular', sortOrder: 1 },
  ],
  categoryGroups: [
    { id: 'group-obligatory', name: 'Обязательные', sortOrder: 0 },
    { id: 'group-regular', name: 'Регулярные', sortOrder: 1 },
    { id: 'group-fun', name: 'Отдых', sortOrder: 2 },
    { id: 'group-reserves', name: 'Резервы', sortOrder: 3 },
    { id: 'group-debts', name: 'Долги', sortOrder: 4 },
  ],
  importBatches: [],
  rules: [],
  nextIncomeDate: '2026-06-25',
  expectedMonthlyIncome: 212000,
  todayFlexibleSpent: 1240,
  today: '2026-06-07',
};

describe('calculateDashboard', () => {
  it('freeUntilNextIncome = cashBalance - proportionalLiving', () => {
    const result = calculateDashboard(baseInput);
    const cashBalance = 212000;
    const totalPlan = 60000 + 5000 + 20000;
    const daysToIncome = 18;
    const monthFraction = daysToIncome / 30;
    const expectedProportional = Math.round(totalPlan * monthFraction);
    expect(result.freeMoney.balanceNow).toBe(cashBalance);
    expect(result.freeMoney.amount).toBe(cashBalance - expectedProportional);
  });

  it('credit account without creditLimit contributes 0 to cash balance', () => {
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

  it('credit account with creditLimit contributes available funds to cash balance', () => {
    const input: DashboardInput = {
      ...baseInput,
      accounts: [
        { id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 100000 },
        { id: 'credit-1', name: 'Кредитка', type: 'credit', includeInCashBalance: true, currentBalance: -300000, creditLimit: 500000 },
      ],
    };
    const result = calculateDashboard(input);
    expect(result.freeMoney.balanceNow).toBe(100000 + 200000);
    expect(result.freeMoney.creditAvailable).toBe(200000);
  });

  it('credit account over limit contributes 0', () => {
    const input: DashboardInput = {
      ...baseInput,
      accounts: [
        { id: 'cash-1', name: 'Основной', type: 'debit', includeInCashBalance: true, currentBalance: 100000 },
        { id: 'credit-1', name: 'Кредитка', type: 'credit', includeInCashBalance: true, currentBalance: -550000, creditLimit: 500000 },
      ],
    };
    const result = calculateDashboard(input);
    expect(result.freeMoney.balanceNow).toBe(100000);
    expect(result.freeMoney.creditAvailable).toBe(0);
  });

  it('spendingGroups has correct grouping and totalPlan', () => {
    const result = calculateDashboard(baseInput);
    expect(result.spendingGroups).toHaveLength(2);
    const obligatory = result.spendingGroups.find((g) => g.id === 'group-obligatory');
    expect(obligatory).toBeDefined();
    expect(obligatory!.categories).toHaveLength(1);
    expect(obligatory!.categories[0].name).toBe('Продукты');
    expect(obligatory!.totalPlan).toBe(60000);
    const regular = result.spendingGroups.find((g) => g.id === 'group-regular');
    expect(regular).toBeDefined();
    expect(regular!.categories).toHaveLength(2);
    expect(regular!.totalPlan).toBe(25000);
  });

  it('spendingGroups hides groups with no categories', () => {
    const result = calculateDashboard(baseInput);
    expect(result.spendingGroups.find((g) => g.id === 'group-fun')).toBeUndefined();
    expect(result.spendingGroups.find((g) => g.id === 'group-reserves')).toBeUndefined();
    expect(result.spendingGroups.find((g) => g.id === 'group-debts')).toBeUndefined();
  });
});
