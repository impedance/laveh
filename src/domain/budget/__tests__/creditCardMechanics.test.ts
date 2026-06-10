import { describe, it, expect } from 'vitest';
import { calculateBudget } from '../calculateBudget';
import type { BudgetInput } from '../types';
import type { Account, Category, CategoryGroup } from '../../../store/types';

const creditAccount: Account = { id: 'a-cc', name: 'Карта', type: 'credit', onBudget: true, currentBalance: -10000 };
const debitAccount: Account = { id: 'a-debit', name: 'Осн', type: 'debit', onBudget: true, currentBalance: 50000 };
const foodCat: Category = { id: 'cat-food', name: 'Продукты', plan: 60000, groupId: 'g-oblig', sortOrder: 0 };
const ccPaymentCat: Category = { id: 'cc-payment-a-cc', name: 'Оплата: Карта', plan: 0, groupId: 'g-cc', sortOrder: 0 };
const defaultGroups: CategoryGroup[] = [
  { id: 'g-oblig', name: 'Обязательные', sortOrder: 0 },
  { id: 'g-cc', name: 'Оплата карт', sortOrder: 99 },
];

describe('Credit Card Mechanics', () => {
  it('multiple credit card transactions sum up in payment available', () => {
    const input: BudgetInput = {
      accounts: [debitAccount, creditAccount],
      categories: [foodCat, ccPaymentCat],
      categoryGroups: defaultGroups,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'A', amount: -3000, categoryId: 'cat-food', accountId: 'a-cc' },
        { id: 't2', date: '2026-06-06', description: 'B', amount: -7000, categoryId: 'cat-food', accountId: 'a-cc' },
      ],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000 },
        categoryCarryover: {},
        toBeBudgeted: 0,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    expect(vm.creditCardPayments[0].activity).toBe(10000);
    expect(vm.creditCardPayments[0].available).toBe(10000);
  });

  it('transfer to credit card decreases payment available', () => {
    const input: BudgetInput = {
      accounts: [debitAccount, { ...creditAccount, currentBalance: 0 }],
      categories: [foodCat, ccPaymentCat],
      categoryGroups: defaultGroups,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Трата', amount: -10000, categoryId: 'cat-food', accountId: 'a-cc' },
        { id: 't2', date: '2026-06-15', description: 'Платёж', amount: -10000, accountId: 'a-debit', transferAccountId: 'a-cc' },
        { id: 't3', date: '2026-06-15', description: 'Платёж', amount: 10000, accountId: 'a-cc', transferAccountId: 'a-debit' },
      ],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000 },
        categoryCarryover: {},
        toBeBudgeted: 0,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);

    expect(vm.creditCardPayments[0].activity).toBe(0);
    expect(vm.creditCardPayments[0].available).toBe(0);
  });

  it('extra assigned to payment category increases available for debt payoff', () => {
    const input: BudgetInput = {
      accounts: [debitAccount, creditAccount],
      categories: [foodCat, ccPaymentCat],
      categoryGroups: defaultGroups,
      transactions: [],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000, 'cc-payment-a-cc': 20000 },
        categoryCarryover: {},
        toBeBudgeted: 20000,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    expect(vm.creditCardPayments[0].assigned).toBe(20000);
    expect(vm.creditCardPayments[0].available).toBe(20000);
    expect(vm.creditCardPayments[0].activity).toBe(0);
  });

  it('debtRemaining and paymentGap are computed correctly', () => {
    const input: BudgetInput = {
      accounts: [debitAccount, creditAccount],
      categories: [foodCat, ccPaymentCat],
      categoryGroups: defaultGroups,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Трата', amount: -3000, categoryId: 'cat-food', accountId: 'a-cc' },
      ],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000 },
        categoryCarryover: {},
        toBeBudgeted: 0,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    expect(vm.creditCardPayments[0].debtRemaining).toBe(10000);
    expect(vm.creditCardPayments[0].paymentGap).toBe(7000);
    expect(vm.creditCardPayments[0].available).toBe(3000);
  });

  it('overpaid credit card has debtRemaining 0 and paymentGap 0', () => {
    const overpaidCard: Account = { id: 'a-cc2', name: 'Переплата', type: 'credit', onBudget: true, currentBalance: 5000 };
    const input: BudgetInput = {
      accounts: [debitAccount, overpaidCard],
      categories: [],
      categoryGroups: [],
      transactions: [],
      monthState: {
        month: '2026-06',
        categoryAssignments: {},
        categoryCarryover: {},
        toBeBudgeted: 0,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    expect(vm.creditCardPayments[0].debtRemaining).toBe(0);
    expect(vm.creditCardPayments[0].paymentGap).toBe(0);
  });

  it('partial transfer reduces available but not below zero', () => {
    const input: BudgetInput = {
      accounts: [debitAccount, { ...creditAccount, currentBalance: 0 }],
      categories: [foodCat, ccPaymentCat],
      categoryGroups: defaultGroups,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Трата', amount: -20000, categoryId: 'cat-food', accountId: 'a-cc' },
        { id: 't2', date: '2026-06-15', description: 'Частичный платёж', amount: 5000, accountId: 'a-cc', transferAccountId: 'a-debit' },
      ],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000 },
        categoryCarryover: {},
        toBeBudgeted: 0,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    expect(vm.creditCardPayments[0].activity).toBe(15000);
    expect(vm.creditCardPayments[0].available).toBe(15000);
  });
});
