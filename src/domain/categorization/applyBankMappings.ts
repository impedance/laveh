import type { Transaction, BankMapping } from '../../store/types';

export function applyBankMappings<T extends Partial<Transaction>>(
  transactions: T[],
  mappings: BankMapping[],
): T[] {
  return transactions.map((txn) => {
    if (txn.isReviewed || !txn.bankCategory) return txn;
    const mapping = mappings.find(
      (m) => m.bankCategory === txn.bankCategory && m.hitCount >= 2,
    );
    if (mapping) {
      return { ...txn, categoryId: mapping.categoryId, isReviewed: true as const };
    }
    return txn;
  });
}
