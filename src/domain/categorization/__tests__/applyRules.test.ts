import { describe, it, expect } from 'vitest';
import { applyRules } from '../applyRules';
import type { Transaction, CategorizationRule } from '../../../store/types';

function txn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: '2026-06-01',
    description: 'Test',
    amount: -100,
    accountId: 'cash-1',
    isReviewed: false,
    ...overrides,
  };
}

function rule(overrides: Partial<CategorizationRule> = {}): CategorizationRule {
  return {
    id: 'r1',
    pattern: 'пятёрочка',
    categoryId: 'cat-1',
    priority: 10,
    matchType: 'contains',
    matchField: 'description',
    ...overrides,
  };
}

describe('applyRules', () => {
  it('categorizes transaction matching a rule', () => {
    const txns = [txn({ description: 'Пятёрочка' })];
    const rules = [rule()];
    const result = applyRules(txns, rules);
    expect(result[0].categoryId).toBe('cat-1');
    expect(result[0].isReviewed).toBe(true);
  });

  it('does not recategorize already reviewed transaction', () => {
    const txns = [txn({ description: 'Пятёрочка', categoryId: 'cat-2', isReviewed: true })];
    const rules = [rule()];
    const result = applyRules(txns, rules);
    expect(result[0].categoryId).toBe('cat-2');
  });

  it('applies higher priority rule first', () => {
    const txns = [txn({ description: 'Пятёрочка рядом с домом' })];
    const rules = [
      rule({ id: 'r2', pattern: 'рядом', categoryId: 'cat-2', priority: 20 }),
      rule({ id: 'r1', pattern: 'пятёрочка', categoryId: 'cat-1', priority: 10 }),
    ];
    const result = applyRules(txns, rules);
    expect(result[0].categoryId).toBe('cat-2');
  });

  it('leaves transaction uncategorized when no rule matches', () => {
    const txns = [txn({ description: 'Something random' })];
    const result = applyRules(txns, [rule()]);
    expect(result[0].categoryId).toBeUndefined();
    expect(result[0].isReviewed).toBe(false);
  });

  it('handles equals matchType', () => {
    const txns = [txn({ description: 'Пятёрочка' })];
    const rules = [rule({ matchType: 'equals', pattern: 'Пятёрочка' })];
    const result = applyRules(txns, rules);
    expect(result[0].categoryId).toBe('cat-1');
  });

  it('does not match partial with equals', () => {
    const txns = [txn({ description: 'Пятёрочка на Ленина' })];
    const rules = [rule({ matchType: 'equals', pattern: 'Пятёрочка' })];
    const result = applyRules(txns, rules);
    expect(result[0].categoryId).toBeUndefined();
  });
});
