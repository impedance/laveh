import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../index';

describe('Planner Matrix Target Setting', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      monthStates: [],
    });
  });

  it('setCategoryTarget securely creates a future MonthState if it does not exist, initializing targets correctly', () => {
    useStore.getState().setCategoryTarget('2026-08', 'cat-1', 5000);

    const state = useStore.getState();
    const targetMonth = state.monthStates.find((ms) => ms.month === '2026-08');
    expect(targetMonth).toBeDefined();
    expect(targetMonth?.categoryTargets).toEqual({
      'cat-1': 5000,
    });
  });

  it('setCategoryTarget updates an existing target in an existing MonthState', () => {
    useStore.setState({
      monthStates: [
        {
          month: '2026-08',
          categoryAssignments: {},
          categoryCarryover: {},
          toBeBudgeted: 0,
          categoryTargets: { 'cat-1': 1000 },
        },
      ],
    });

    useStore.getState().setCategoryTarget('2026-08', 'cat-1', 2500);

    const state = useStore.getState();
    const targetMonth = state.monthStates.find((ms) => ms.month === '2026-08');
    expect(targetMonth?.categoryTargets).toEqual({
      'cat-1': 2500,
    });
  });
});
