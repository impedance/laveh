import { describe, it, expect } from 'vitest';
import { calculateBudget } from '../calculateBudget';
import type { BudgetInput } from '../types';
import type { Account, Category, CategoryGroup, MonthState } from '../../../store/types';

const defaultAccounts: Account[] = [
  { id: 'a-debit', name: 'Основной', type: 'debit', onBudget: true, currentBalance: 100000 },
  { id: 'a-credit', name: 'Кредитка', type: 'credit', onBudget: true, currentBalance: -50000, creditLimit: 300000 },
];

const defaultCategories: Category[] = [
  { id: 'cat-food', name: 'Продукты', plan: 60000, groupId: 'g-oblig', sortOrder: 0 },
  { id: 'cat-transport', name: 'Транспорт', plan: 20000, groupId: 'g-reg', sortOrder: 0 },
];

const defaultGroups: CategoryGroup[] = [
  { id: 'g-oblig', name: 'Обязательные', sortOrder: 0 },
  { id: 'g-reg', name: 'Регулярные', sortOrder: 1 },
  { id: 'g-empty', name: 'Пустая', sortOrder: 2 },
];

const defaultMonthState: MonthState = {
  month: '2026-06',
  categoryAssignments: { 'cat-food': 60000, 'cat-transport': 20000 },
  categoryCarryover: {},
  toBeBudgeted: 20000,
};

const defaultInput: BudgetInput = {
  accounts: defaultAccounts,
  transactions: [],
  categories: defaultCategories,
  categoryGroups: defaultGroups,
  monthState: defaultMonthState,
  month: '2026-06',
};

describe('calculateBudget', () => {
  it('T1 — I1: category available = carryover + assigned + activity', () => {
    const input: BudgetInput = {
      ...defaultInput,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Магнит', amount: -5000, categoryId: 'cat-food', accountId: 'a-debit' },
      ],
    };
    const vm = calculateBudget(input);
    const food = vm.categoryGroups[0].categories.find((c) => c.id === 'cat-food')!;
    expect(food.assigned).toBe(60000);
    expect(food.activity).toBe(-5000);
    expect(food.available).toBe(55000);
  });

  it('T2 — I2: activity only includes transactions in the given month', () => {
    const input: BudgetInput = {
      ...defaultInput,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'A', amount: -3000, categoryId: 'cat-food', accountId: 'a-debit' },
        { id: 't2', date: '2026-05-28', description: 'B', amount: -2000, categoryId: 'cat-food', accountId: 'a-debit' },
        { id: 't3', date: '2026-06-10', description: 'C', amount: -7000, categoryId: 'cat-food', accountId: 'a-debit' },
      ],
    };
    const vm = calculateBudget(input);
    const food = vm.categoryGroups[0].categories.find((c) => c.id === 'cat-food')!;
    expect(food.activity).toBe(-10000);
  });

  it('T3 — I4: credit card spending auto-moves to payment category', () => {
    const input: BudgetInput = {
      accounts: [
        { id: 'a-debit', name: 'Осн', type: 'debit', onBudget: true, currentBalance: 100000 },
        { id: 'a-credit', name: 'Карта', type: 'credit', onBudget: true, currentBalance: -10000 },
      ],
      categories: [
        { id: 'cat-food', name: 'Продукты', plan: 60000, groupId: 'g-oblig', sortOrder: 0 },
        { id: 'cc-payment-a-credit', name: 'Оплата: Карта', plan: 0, groupId: 'g-cc', sortOrder: 0 },
      ],
      categoryGroups: [
        { id: 'g-oblig', name: 'Обязательные', sortOrder: 0 },
        { id: 'g-cc', name: 'Credit Card Payments', sortOrder: 10 },
      ],
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Магнит', amount: -5000, categoryId: 'cat-food', accountId: 'a-credit' },
      ],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000 },
        categoryCarryover: {},
        toBeBudgeted: 40000,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);

    const food = vm.categoryGroups[0].categories.find((c) => c.id === 'cat-food')!;
    expect(food.activity).toBe(-5000);
    expect(food.available).toBe(55000);

    const cc = vm.creditCardPayments.find((c) => c.accountId === 'a-credit')!;
    expect(cc.activity).toBe(5000);
    expect(cc.available).toBe(5000);
  });

  it('T4 — I5: ownMoney = sum of debit balances + max(0, credit balance)', () => {
    const input: BudgetInput = {
      ...defaultInput,
      accounts: [
        { id: 'a-debit', name: 'Дебет', type: 'debit', onBudget: true, currentBalance: 100000 },
        { id: 'a-credit-overpaid', name: 'Переплата', type: 'credit', onBudget: true, currentBalance: 5000 },
        { id: 'a-credit-debt', name: 'Долг', type: 'credit', onBudget: true, currentBalance: -30000 },
        { id: 'a-off-budget', name: 'Off', type: 'debit', onBudget: false, currentBalance: 99999 },
      ],
    };
    const vm = calculateBudget(input);
    expect(vm.ownMoney).toBe(105000);
    expect(vm.totalDebt).toBe(30000);
  });

  it('T5 — TBB persistence: toBeBudgeted comes from monthState', () => {
    const input: BudgetInput = {
      ...defaultInput,
      monthState: { ...defaultMonthState, toBeBudgeted: 4242 },
    };
    const vm = calculateBudget(input);
    expect(vm.toBeBudgeted).toBe(4242);
  });

  it('T6 — zero-assigned categories still show up with available = carryover + activity', () => {
    const input: BudgetInput = {
      ...defaultInput,
      monthState: {
        ...defaultMonthState,
        categoryAssignments: { 'cat-food': 0, 'cat-transport': 0 },
        categoryCarryover: { 'cat-food': 10000 },
      },
      transactions: [
        { id: 't1', date: '2026-06-01', description: 'X', amount: -3000, categoryId: 'cat-food', accountId: 'a-debit' },
      ],
    };
    const vm = calculateBudget(input);
    const food = vm.categoryGroups[0].categories.find((c) => c.id === 'cat-food')!;
    expect(food.assigned).toBe(0);
    expect(food.available).toBe(7000);
  });

  it('T7 — viewModel totals match sum of individual categories', () => {
    const vm = calculateBudget(defaultInput);
    const sumAssigned = vm.categoryGroups.reduce((s, g) => s + g.totalAssigned, 0);
    const sumActivity = vm.categoryGroups.reduce((s, g) => s + g.totalActivity, 0);
    expect(vm.totalAssigned).toBe(sumAssigned);
    expect(vm.totalActivity).toBe(sumActivity);
    expect(vm.totalAssigned).toBe(80000);
  });

  it('T8 — refund on credit card does not increase payment available', () => {
    const input: BudgetInput = {
      accounts: [{ id: 'a-credit', name: 'Карта', type: 'credit', onBudget: true, currentBalance: 0 }],
      categories: [
        { id: 'cat-food', name: 'Продукты', plan: 60000, groupId: 'g-oblig', sortOrder: 0 },
        { id: 'cc-payment-a-credit', name: 'Оплата: Карта', plan: 0, groupId: 'g-cc', sortOrder: 0 },
      ],
      categoryGroups: [
        { id: 'g-oblig', name: 'Обязательные', sortOrder: 0 },
        { id: 'g-cc', name: 'CC', sortOrder: 1 },
      ],
      transactions: [
        { id: 't1', date: '2026-06-10', description: 'Возврат', amount: 2000, categoryId: 'cat-food', accountId: 'a-credit' },
      ],
      monthState: { month: '2026-06', categoryAssignments: {}, categoryCarryover: {}, toBeBudgeted: 0 },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    expect(vm.creditCardPayments[0].activity).toBe(0);
    expect(vm.creditCardPayments[0].available).toBe(0);
  });

  it('empty groups with no categories are excluded from view model', () => {
    const vm = calculateBudget(defaultInput);
    expect(vm.categoryGroups.find((g) => g.id === 'g-empty')).toBeUndefined();
  });

  it('groups are sorted by sortOrder', () => {
    const vm = calculateBudget(defaultInput);
    const groupIds = vm.categoryGroups.map((g) => g.id);
    expect(groupIds[0]).toBe('g-oblig');
    expect(groupIds[1]).toBe('g-reg');
  });

  it('previousMonthState carryover is used when available', () => {
    const input: BudgetInput = {
      ...defaultInput,
      monthState: {
        ...defaultMonthState,
        categoryAssignments: { 'cat-food': 5000 },
        categoryCarryover: { 'cat-food': 0 },
      },
      previousMonthState: {
        month: '2026-05',
        categoryAssignments: {},
        categoryCarryover: { 'cat-food': 30000 },
        toBeBudgeted: 0,
      },
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'X', amount: -8000, categoryId: 'cat-food', accountId: 'a-debit' },
      ],
    };
    const vm = calculateBudget(input);
    const food = vm.categoryGroups[0].categories.find((c) => c.id === 'cat-food')!;
    expect(food.available).toBe(27000);
  });

  it('totalIncome sums positive transactions for current month', () => {
    const input: BudgetInput = {
      ...defaultInput,
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Зарплата', amount: 150000, categoryId: undefined, accountId: 'a-debit' },
        { id: 't2', date: '2026-06-10', description: 'Подработка', amount: 30000, categoryId: undefined, accountId: 'a-debit' },
        { id: 't3', date: '2026-05-28', description: 'Прошлый месяц', amount: 100000, categoryId: undefined, accountId: 'a-debit' },
      ],
    };
    const vm = calculateBudget(input);
    expect(vm.totalIncome).toBe(180000);
  });

  it('credit card payment category is excluded from regular group activity', () => {
    const input: BudgetInput = {
      accounts: [
        { id: 'a-debit', name: 'Осн', type: 'debit', onBudget: true, currentBalance: 100000 },
        { id: 'a-credit', name: 'Карта', type: 'credit', onBudget: true, currentBalance: -10000 },
      ],
      categories: [
        { id: 'cat-food', name: 'Продукты', plan: 60000, groupId: 'g-oblig', sortOrder: 0 },
        { id: 'cc-payment-a-credit', name: 'Оплата: Карта', plan: 0, groupId: 'g-cc', sortOrder: 1 },
      ],
      categoryGroups: [
        { id: 'g-oblig', name: 'Обязательные', sortOrder: 0 },
        { id: 'g-cc', name: 'Credit Card Payments', sortOrder: 10 },
      ],
      transactions: [
        { id: 't1', date: '2026-06-05', description: 'Платёж по карте', amount: -10000, categoryId: 'cc-payment-a-credit', accountId: 'a-debit' },
      ],
      monthState: {
        month: '2026-06',
        categoryAssignments: { 'cat-food': 60000 },
        categoryCarryover: {},
        toBeBudgeted: 40000,
      },
      month: '2026-06',
    };
    const vm = calculateBudget(input);
    const ccGroup = vm.categoryGroups.find((g) => g.id === 'g-cc');
    expect(ccGroup).toBeDefined();
    expect(ccGroup!.totalActivity).toBe(0);
  });
});
