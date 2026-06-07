import type { Transaction } from '../../store/types';
import type { ParsedRow, ColumnMapping } from './types';
import { generateHash } from './generateHash';

const DEFAULT_MAPPING: ColumnMapping = {
  dateIndex: 0,
  amountIndex: 1,
  descriptionIndex: 2,
};

function parseAmount(val: string): number {
  const cleaned = val.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function mapRowsToTransactions(
  rows: ParsedRow[],
  accountId: string,
  sourceProfile: string,
  mapping: ColumnMapping = DEFAULT_MAPPING,
): Promise<Transaction[]> {
  const results: Transaction[] = [];
  for (const row of rows) {
    const date = row.values[mapping.dateIndex]?.trim() || '';
    const amount = parseAmount(row.values[mapping.amountIndex] || '0');
    const description = row.values[mapping.descriptionIndex]?.trim() || '';
    if (!date || !description) continue;
    const hash = await generateHash(date, amount, description, accountId, sourceProfile);
    results.push({
      id: '',
      date,
      description,
      amount,
      accountId,
      sourceProfile,
      externalHash: hash,
      isReviewed: false,
    });
  }
  return results;
}
