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
    expect(keys).toContain('addGoal');
    expect(keys).toContain('updateGoal');
    expect(keys).toContain('deleteGoal');
    expect(keys).toContain('addAccount');
    expect(keys).toContain('updateAccount');
    expect(keys).toContain('deleteAccount');
    expect(keys).toContain('addAllocation');
    expect(keys).toContain('deleteAllocation');
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

  it('adds a goal and reads it back', () => {
    useStore.getState().addGoal({
      title: 'Test Goal',
      type: 'savings',
      targetAmount: 100000,
      currentAmount: 0,
      isPrimary: false,
    });
    const s = useStore.getState();
    expect(s.goals).toHaveLength(1);
    expect(s.goals[0].title).toBe('Test Goal');
    expect(s.goals[0].id).toBeDefined();
  });

  it('updates a goal', () => {
    useStore.setState({
      goals: [{ id: 'g1', title: 'Old', type: 'savings', targetAmount: 100, currentAmount: 0, isPrimary: false }],
    });
    useStore.getState().updateGoal('g1', { title: 'Updated', targetAmount: 200 });
    const g = useStore.getState().goals[0];
    expect(g.title).toBe('Updated');
    expect(g.targetAmount).toBe(200);
  });

  it('deletes a goal', () => {
    useStore.setState({
      goals: [{ id: 'g1', title: 'X', type: 'savings', targetAmount: 100, currentAmount: 0, isPrimary: false }],
    });
    useStore.getState().deleteGoal('g1');
    expect(useStore.getState().goals).toHaveLength(0);
  });

  it('adds an account', () => {
    useStore.getState().addAccount({
      name: 'Credit Card',
      type: 'credit',
      includeInCashBalance: false,
      currentBalance: -5000,
    });
    const s = useStore.getState();
    expect(s.accounts).toHaveLength(1);
    expect(s.accounts[0].name).toBe('Credit Card');
    expect(s.accounts[0].id).toBeDefined();
  });

  it('updates an account', () => {
    useStore.setState({
      accounts: [{ id: 'a1', name: 'Old', type: 'debit', includeInCashBalance: true, currentBalance: 1000 }],
    });
    useStore.getState().updateAccount('a1', { currentBalance: 5000 });
    expect(useStore.getState().accounts[0].currentBalance).toBe(5000);
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

  it('adds an allocation', () => {
    useStore.getState().addAllocation({
      obligationId: 'obl-1',
      amount: 5000,
      date: '2026-06-07',
    });
    const s = useStore.getState();
    expect(s.allocations).toHaveLength(1);
    expect(s.allocations[0].amount).toBe(5000);
    expect(s.allocations[0].id).toBeDefined();
  });

  it('deletes an allocation', () => {
    useStore.setState({
      allocations: [{ id: 'a1', obligationId: 'obl-1', amount: 100, date: '2026-01-01' }],
    });
    useStore.getState().deleteAllocation('a1');
    expect(useStore.getState().allocations).toHaveLength(0);
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
});
