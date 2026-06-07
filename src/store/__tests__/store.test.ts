import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../index';

function resetStore() {
  useStore.setState({
    accounts: [],
    transactions: [],
    categories: [],
    obligations: [],
    allocations: [],
    goals: [],
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
    expect(keys).toContain('obligations');
    expect(keys).toContain('allocations');
    expect(keys).toContain('goals');
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
      categories: [{ id: 'cat-1', name: 'Продукты', plan: 60000, type: 'living' }],
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
      obligations: [],
      allocations: [],
      goals: [],
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
});
