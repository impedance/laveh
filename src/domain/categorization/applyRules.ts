import type { Transaction, CategorizationRule } from '../../store/types';

export function applyRules<T extends Partial<Transaction>>(
  transactions: T[],
  rules: CategorizationRule[],
): T[] {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  return transactions.map((txn) => {
    if (txn.isReviewed) return txn;
    const matchField = txn.description?.toLowerCase() || '';
    for (const rule of sorted) {
      const pattern = rule.pattern.toLowerCase();
      const matched =
        rule.matchType === 'equals'
          ? matchField === pattern
          : rule.matchType === 'regex'
            ? new RegExp(pattern, 'i').test(matchField)
            : matchField.includes(pattern);
      if (matched) {
        return { ...txn, categoryId: rule.categoryId, isReviewed: true };
      }
    }
    return txn;
  });
}
