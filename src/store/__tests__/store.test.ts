import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../index';
import { seedData } from '../seed';

function resetStore() {
  useStore.setState({
    accounts: [],
    transactions: [],
    categories: [],
    categoryGroups: seedData.categoryGroups,
    importBatches: [],
    rules: [],
    nextIncomeDate: '',
    expectedMonthlyIncome: 0,
    todayFlexibleSpent: 0,
  });
}

describe('Zustand store', () => {
  beforeEach(() => {
    resetStore();
  });

  it('initializes with empty state by default (after reset)', () => {
    const s = useStore.getState();
    expect(s.accounts).toEqual([]);
    expect(s.transactions).toEqual([]);
    expect(s.categories).toEqual([]);
  });

  it('has all expected store keys', () => {
    const s = useStore.getState();
    const keys = Object.keys(s);
    expect(keys).toContain('accounts');
    expect(keys).toContain('transactions');
    expect(keys).toContain('categories');
    expect(keys).toContain('importBatches');
    expect(keys).toContain('rules');
    expect(keys).toContain('nextIncomeDate');
    expect(keys).toContain('expectedMonthlyIncome');
    expect(keys).toContain('todayFlexibleSpent');
    expect(keys).toContain('addTransaction');
    expect(keys).toContain('updateCategory');
    expect(keys).toContain('setNextIncomeDate');
    expect(keys).toContain('setExpectedMonthlyIncome');
    expect(keys).toContain('setTodayFlexibleSpent');
    expect(keys).toContain('restoreFromJSON');
    expect(keys).toContain('addAccount');
    expect(keys).toContain('updateAccount');
    expect(keys).toContain('deleteAccount');
  });

  it('returns JSON-serializable state', () => {
    const s = useStore.getState();
    expect(() => JSON.stringify(s)).not.toThrow();
    const json = JSON.parse(JSON.stringify(s));
    expect(json.accounts).toBeInstanceOf(Array);
    expect(json.transactions).toBeInstanceOf(Array);
  });

  it('adds a transaction and reads it back', () => {
    const tx = {
      date: '2026-06-07',
      description: 'Test',
      amount: 500,
      accountId: 'cash-1',
    };

    useStore.getState().addTransaction(tx);
    const s = useStore.getState();
    expect(s.transactions).toHaveLength(1);
    expect(s.transactions[0].description).toBe('Test');
    expect(s.transactions[0].amount).toBe(500);
    expect(s.transactions[0].id).toBeDefined();
  });

  it('adds multiple transactions', () => {
    useStore.getState().addTransaction({ date: '2026-06-01', description: 'A', amount: 100, accountId: 'cash-1' });
    useStore.getState().addTransaction({ date: '2026-06-02', description: 'B', amount: 200, accountId: 'cash-1' });
    expect(useStore.getState().transactions).toHaveLength(2);
  });

  it('updates a category', () => {
    useStore.setState({
      categories: [{ id: 'cat-1', name: 'Продукты', plan: 60000, groupId: 'group-obligatory', sortOrder: 0 }],
    });
    useStore.getState().updateCategory('cat-1', { plan: 999 });
    expect(useStore.getState().categories.find((c) => c.id === 'cat-1')?.plan).toBe(999);
  });

  it('sets nextIncomeDate', () => {
    useStore.getState().setNextIncomeDate('2026-07-01');
    expect(useStore.getState().nextIncomeDate).toBe('2026-07-01');
  });

  it('restores state from JSON', () => {
    const json = JSON.stringify({
      accounts: [{ id: 'a1', name: 'Test', type: 'debit', includeInCashBalance: true, currentBalance: 50000 }],
      transactions: [],
      categories: [],
      importBatches: [],
      rules: [],
      nextIncomeDate: '2026-07-01',
      expectedMonthlyIncome: 100000,
      todayFlexibleSpent: 0,
    });
    useStore.getState().restoreFromJSON(json);
    const s = useStore.getState();
    expect(s.accounts).toHaveLength(1);
    expect(s.accounts[0].currentBalance).toBe(50000);
    expect(s.nextIncomeDate).toBe('2026-07-01');
  });

  it('restore merges with defaults for missing keys', () => {
    useStore.getState().setNextIncomeDate('2026-06-25');
    const json = JSON.stringify({ accounts: [] });
    useStore.getState().restoreFromJSON(json);
    expect(useStore.getState().accounts).toEqual([]);
    expect(useStore.getState().nextIncomeDate).toBe('2026-06-25');
  });

  it('adds an account with creditLimit', () => {
    useStore.getState().addAccount({
      name: 'Credit Card',
      type: 'credit',
      includeInCashBalance: true,
      currentBalance: -5000,
      creditLimit: 500000,
    });
    const s = useStore.getState();
    expect(s.accounts).toHaveLength(1);
    expect(s.accounts[0].name).toBe('Credit Card');
    expect(s.accounts[0].creditLimit).toBe(500000);
    expect(s.accounts[0].id).toBeDefined();
  });

  it('updates an account', () => {
    useStore.setState({
      accounts: [{ id: 'a1', name: 'Old', type: 'credit', includeInCashBalance: true, currentBalance: 1000 }],
    });
    useStore.getState().updateAccount('a1', { currentBalance: 5000, creditLimit: 10000 });
    expect(useStore.getState().accounts[0].currentBalance).toBe(5000);
    expect(useStore.getState().accounts[0].creditLimit).toBe(10000);
  });

  it('deletes an account and its transactions', () => {
    useStore.setState({
      accounts: [{ id: 'a1', name: 'X', type: 'debit', includeInCashBalance: true, currentBalance: 0 }],
      transactions: [
        { id: 'tx1', date: '2026-01-01', description: 'A', amount: 100, accountId: 'a1' },
        { id: 'tx2', date: '2026-01-01', description: 'B', amount: 200, accountId: 'a2' },
      ],
    });
    useStore.getState().deleteAccount('a1');
    expect(useStore.getState().accounts).toHaveLength(0);
    expect(useStore.getState().transactions).toHaveLength(1);
    expect(useStore.getState().transactions[0].id).toBe('tx2');
  });

  it('commitImport generates its own batch id', () => {
    const tx = {
      date: '2026-06-07',
      description: 'Test',
      amount: 500,
      accountId: 'cash-1',
    };
    useStore.getState().commitImport([tx], {
      date: '2026-06-07',
      filename: 'test.xlsx',
      transactionCount: 1,
      status: 'completed',
    });
    const s = useStore.getState();
    expect(s.transactions).toHaveLength(1);
    expect(s.importBatches).toHaveLength(1);
    expect(s.importBatches[0].id).toBeDefined();
    expect(s.importBatches[0].filename).toBe('test.xlsx');
    expect(s.transactions[0].importBatchId).toBe(s.importBatches[0].id);
  });

  it('upsertGroup creates a new group', () => {
    useStore.getState().upsertGroup({ name: 'Test Group' });
    const groups = useStore.getState().categoryGroups;
    const created = groups.find((g) => g.name === 'Test Group');
    expect(created).toBeDefined();
    expect(created!.id).toBeDefined();
  });

  it('upsertGroup updates an existing group', () => {
    useStore.getState().upsertGroup({ id: 'group-obligatory', name: 'Обязательные изменённые' });
    const g = useStore.getState().categoryGroups.find((g) => g.id === 'group-obligatory');
    expect(g?.name).toBe('Обязательные изменённые');
  });

  it('deleteGroup cascades to categories, transactions, bankMappings, rules', () => {
    useStore.setState({
      categoryGroups: [
        { id: 'g1', name: 'Group 1', sortOrder: 0 },
        { id: 'g2', name: 'Group 2', sortOrder: 1 },
      ],
      categories: [
        { id: 'cat-1', name: 'A', plan: 100, groupId: 'g1', sortOrder: 0 },
        { id: 'cat-2', name: 'B', plan: 200, groupId: 'g2', sortOrder: 0 },
      ],
      transactions: [
        { id: 'tx1', date: '2026-01-01', description: 'T1', amount: 50, accountId: 'a1', categoryId: 'cat-1' },
        { id: 'tx2', date: '2026-01-01', description: 'T2', amount: 50, accountId: 'a1', categoryId: 'cat-2' },
      ],
      bankMappings: [
        { id: 'm1', bankCategory: 'X', categoryId: 'cat-1', hitCount: 2 },
      ],
      rules: [
        { id: 'r1', pattern: 'X', categoryId: 'cat-1', priority: 0, matchType: 'contains', matchField: 'description' },
        { id: 'r2', pattern: 'Y', categoryId: 'cat-2', priority: 1, matchType: 'contains', matchField: 'description' },
      ],
    });
    useStore.getState().deleteGroup('g1');
    const state = useStore.getState();
    expect(state.categoryGroups).toHaveLength(1);
    expect(state.categoryGroups[0].id).toBe('g2');
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].id).toBe('cat-2');
    expect(state.transactions.find((t) => t.id === 'tx1')?.categoryId).toBeUndefined();
    expect(state.transactions.find((t) => t.id === 'tx2')?.categoryId).toBe('cat-2');
    expect(state.bankMappings).toHaveLength(0);
    expect(state.rules).toHaveLength(1);
    expect(state.rules[0].id).toBe('r2');
  });

  it('moveCategoryToGroup changes groupId', () => {
    useStore.setState({
      categories: [{ id: 'cat-1', name: 'X', plan: 100, groupId: 'g1', sortOrder: 0 }],
    });
    useStore.getState().moveCategoryToGroup('cat-1', 'g2');
    expect(useStore.getState().categories[0].groupId).toBe('g2');
  });

  it('restoreFromJSON handles missing categoryGroups', () => {
    useStore.getState().restoreFromJSON(JSON.stringify({ accounts: [] }));
    expect(useStore.getState().categoryGroups).toEqual(seedData.categoryGroups);
  });
});
