import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../store';

describe('Review Queue Logic', () => {
  beforeEach(() => {
    // Reset store to default
    useStore.setState({
      accounts: [],
      transactions: [
        {
          id: 'tx-unreviewed-1',
          date: '2026-06-01',
          description: 'Unreviewed Tx 1',
          amount: -100,
          accountId: 'acc-1',
          isReviewed: false,
        },
        {
          id: 'tx-unreviewed-2',
          date: '2026-06-02',
          description: 'Unreviewed Tx 2',
          amount: -200,
          accountId: 'acc-1',
          // isReviewed is undefined, which should count as unreviewed
        },
        {
          id: 'tx-reviewed-1',
          date: '2026-06-03',
          description: 'Reviewed Tx 1',
          amount: -300,
          accountId: 'acc-1',
          isReviewed: true,
        },
      ],
      categories: [],
      categoryGroups: [],
      rules: [],
      bankMappings: [],
    });
  });

  it('correctly filters unreviewed transactions', () => {
    const state = useStore.getState();
    const unreviewed = state.transactions.filter((t) => !t.isReviewed);
    expect(unreviewed).toHaveLength(2);
    expect(unreviewed.map((t) => t.id)).toContain('tx-unreviewed-1');
    expect(unreviewed.map((t) => t.id)).toContain('tx-unreviewed-2');
  });

  it('updates isReviewed flag when updateTransactionCategory is called', () => {
    // Call updateTransactionCategory
    useStore.getState().updateTransactionCategory('tx-unreviewed-1', 'cat-foo');

    const state = useStore.getState();
    const tx = state.transactions.find((t) => t.id === 'tx-unreviewed-1');
    expect(tx?.isReviewed).toBe(true);
    expect(tx?.categoryId).toBe('cat-foo');

    // Verify it is removed from unreviewed filter
    const unreviewed = state.transactions.filter((t) => !t.isReviewed);
    expect(unreviewed).toHaveLength(1);
    expect(unreviewed[0].id).toBe('tx-unreviewed-2');
  });

  it('updates isReviewed flag when markTransactionReviewed is called', () => {
    // Call markTransactionReviewed
    useStore.getState().markTransactionReviewed('tx-unreviewed-2');

    const state = useStore.getState();
    const tx = state.transactions.find((t) => t.id === 'tx-unreviewed-2');
    expect(tx?.isReviewed).toBe(true);

    // Verify it is removed from unreviewed filter
    const unreviewed = state.transactions.filter((t) => !t.isReviewed);
    expect(unreviewed).toHaveLength(1);
    expect(unreviewed[0].id).toBe('tx-unreviewed-1');
  });
});
