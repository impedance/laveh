import { describe, it, expect } from 'vitest';
import { deduplicateTransactions } from '../deduplicateTransactions';
import type { Transaction } from '../../../store/types';

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2026-06-01',
    description: 'Test',
    amount: -100,
    accountId: 'cash-1',
    importBatchId: '',
    externalHash: undefined,
    isReviewed: false,
    ...overrides,
  };
}

describe('deduplicateTransactions', () => {
  it('returns all as new when no existing transactions', () => {
    const newTxns = [txn({ externalHash: 'hash1' }), txn({ externalHash: 'hash2' })];
    const result = deduplicateTransactions(newTxns, []);
    expect(result.new).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
  });

  it('detects duplicates by externalHash', () => {
    const existing = [txn({ externalHash: 'hash1' })];
    const newTxns = [txn({ externalHash: 'hash1' }), txn({ externalHash: 'hash2' })];
    const result = deduplicateTransactions(newTxns, existing);
    expect(result.new).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].externalHash).toBe('hash1');
  });

  it('handles all duplicates', () => {
    const existing = [txn({ externalHash: 'hash1' }), txn({ externalHash: 'hash2' })];
    const newTxns = [txn({ externalHash: 'hash1' }), txn({ externalHash: 'hash2' })];
    const result = deduplicateTransactions(newTxns, existing);
    expect(result.new).toHaveLength(0);
    expect(result.duplicates).toHaveLength(2);
  });

  it('handles transactions without hash', () => {
    const existing = [txn({ externalHash: 'hash1' })];
    const newTxns = [txn({ externalHash: undefined })];
    const result = deduplicateTransactions(newTxns, existing);
    expect(result.new).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });
});
