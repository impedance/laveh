import type { Transaction } from '../../store/types';
import type { DedupResult } from './types';

/**
 * Split incoming transactions into new vs duplicates by externalHash.
 *
 * Contract:
 *  - A transaction without externalHash is always considered "new".
 *  - A transaction whose hash matches ANY existing transaction is a duplicate.
 *  - Input order is preserved in both result arrays.
 *
 * Edge cases:
 *  - All new → duplicates empty.
 *  - All duplicates → new empty.
 *  - Empty input → both arrays empty.
 *  - Transactions without hash can't be deduplicated → always new.
 */
export function deduplicateTransactions(
  newTxns: Array<Omit<Transaction, 'id'>>,
  existingTxns: Transaction[],
): DedupResult {
  const existingHashes = new Set(
    existingTxns.map((t) => t.externalHash).filter(Boolean) as string[],
  );
  const newItems: Array<Omit<Transaction, 'id'>> = [];
  const dupItems: Array<Omit<Transaction, 'id'>> = [];
  for (const txn of newTxns) {
    if (txn.externalHash && existingHashes.has(txn.externalHash)) {
      dupItems.push(txn);
    } else {
      newItems.push(txn);
    }
  }
  return { new: newItems, duplicates: dupItems };
}
