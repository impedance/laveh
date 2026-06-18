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
    monthStates: [],
  });
}

describe('Budget mechanics (WAM / coverOverspending)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('coverOverspending transfers exact amount between two categories assignments in the target month', () => {
    useStore.setState({
      monthStates: [
        {
          month: '2026-06',
          categoryAssignments: {
            'cat-source': 10000,
            'cat-target': 2000,
          },
          categoryCarryover: {},
          toBeBudgeted: 5000,
        },
      ],
    });

    useStore.getState().coverOverspending('2026-06', 'cat-source', 'cat-target', 3000);

    const state = useStore.getState();
    const ms = state.monthStates.find((m) => m.month === '2026-06')!;
    expect(ms.categoryAssignments['cat-source']).toBe(7000);
    expect(ms.categoryAssignments['cat-target']).toBe(5000);
  });

  it('coverOverspending does not mutate toBeBudgeted', () => {
    useStore.setState({
      monthStates: [
        {
          month: '2026-06',
          categoryAssignments: {
            'cat-source': 5000,
            'cat-target': 0,
          },
          categoryCarryover: {},
          toBeBudgeted: 1000,
        },
      ],
    });

    useStore.getState().coverOverspending('2026-06', 'cat-source', 'cat-target', 2000);

    const state = useStore.getState();
    const ms = state.monthStates.find((m) => m.month === '2026-06')!;
    expect(ms.toBeBudgeted).toBe(1000);
  });
});
