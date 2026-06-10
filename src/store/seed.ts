import type { StoreState } from './types';

export const seedData: StoreState = {
  accounts: [
    { id: 'cash-1', name: 'Основной счёт', type: 'debit', onBudget: true, currentBalance: 212000 },
  ],
  transactions: [],
  categories: [
    { id: 'cat-mortgage', name: 'Ипотека', plan: 82000, groupId: 'group-obligatory', sortOrder: 0 },
    { id: 'cat-car', name: 'Автокредит', plan: 34000, groupId: 'group-obligatory', sortOrder: 1 },
    { id: 'cat-1', name: 'Продукты', plan: 60000, groupId: 'group-obligatory', sortOrder: 2 },
    { id: 'cat-2', name: 'Подписки', plan: 5000, groupId: 'group-regular', sortOrder: 0 },
    { id: 'cat-3', name: 'Транспорт', plan: 20000, groupId: 'group-regular', sortOrder: 1 },
  ],
  categoryGroups: [
    { id: 'group-obligatory', name: 'Обязательные', sortOrder: 0 },
    { id: 'group-regular', name: 'Регулярные', sortOrder: 1 },
    { id: 'group-fun', name: 'Отдых', sortOrder: 2 },
    { id: 'group-reserves', name: 'Резервы', sortOrder: 3 },
    { id: 'group-debts', name: 'Долги', sortOrder: 4 },
    { id: 'group-cc-payments', name: 'Оплата карт', sortOrder: 99 },
  ],
  importBatches: [],
  bankMappings: [],
  rules: [
    { id: 'rule-1', pattern: 'Пятёрочка', categoryId: 'cat-1', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-2', pattern: 'Перекрёсток', categoryId: 'cat-1', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-3', pattern: 'Магнит', categoryId: 'cat-1', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-4', pattern: 'Ашан', categoryId: 'cat-1', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-5', pattern: 'Тинькофф', categoryId: 'cat-2', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-6', pattern: 'Яндекс Такси', categoryId: 'cat-3', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-7', pattern: 'Московский транспорт', categoryId: 'cat-3', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-8', pattern: 'Ситидрайв', categoryId: 'cat-3', priority: 10, matchType: 'contains', matchField: 'description' },
    { id: 'rule-9', pattern: 'Яндекс Еда', categoryId: 'cat-1', priority: 10, matchType: 'contains', matchField: 'description' },
  ],
  nextIncomeDate: '2026-06-25',
  expectedMonthlyIncome: 212000,
  todayFlexibleSpent: 1240,
  monthStates: [
    {
      month: '2026-06',
      categoryAssignments: {},
      categoryCarryover: {},
      toBeBudgeted: 0,
    },
  ],
};
