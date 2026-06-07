import type { Transaction } from '../../store/types';

export interface DedupResult {
  new: Transaction[];
  duplicates: Transaction[];
}

export function deduplicateTransactions(
  newTxns: Transaction[],
  existingTxns: Transaction[],
): DedupResult {
  const existingHashes = new Set(
    existingTxns.map((t) => t.externalHash).filter(Boolean) as string[],
  );
  const newItems: Transaction[] = [];
  const dupItems: Transaction[] = [];
  for (const txn of newTxns) {
    if (txn.externalHash && existingHashes.has(txn.externalHash)) {
      dupItems.push(txn);
    } else {
      newItems.push(txn);
    }
  }
  return { new: newItems, duplicates: dupItems };
}
