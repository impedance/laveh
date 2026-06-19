import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../index';

describe('Accounts Reconciliation', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      accounts: [
        { id: 'acc-1', name: 'Cash', type: 'debit', onBudget: true, currentBalance: 1000 },
      ],
      transactions: [],
      monthStates: [],
    });
  });

  it('reconcileAccount with discrepancy generates exactly one adjustment transaction and matches the new balance', () => {
    useStore.getState().reconcileAccount('acc-1', 1200);

    const state = useStore.getState();
    expect(state.accounts[0].currentBalance).toBe(1200);
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0]).toEqual(
      expect.objectContaining({
        accountId: 'acc-1',
        amount: 200,
        description: 'Reconciliation Adjustment',
        isReviewed: true,
      })
    );
  });

  it('reconcileAccount with matching balance generates 0 transactions', () => {
    useStore.getState().reconcileAccount('acc-1', 1000);

    const state = useStore.getState();
    expect(state.accounts[0].currentBalance).toBe(1000);
    expect(state.transactions.length).toBe(0);
  });
});
