import type { Transaction } from '../../store/types';
import type { TBankParsedRow, ImportConfig } from './types';
import { generateHash } from './generateHash';

/**
 * Map typed T‑Bank rows into canonical Transaction objects,
 * preserving all bank fields.
 *
 * Contract:
 *  - Every input row produces exactly one output transaction (no filtering).
 *  - `id` is left empty — assigned by store on commit.
 *  - `externalHash` is deterministic: date + amount + description + cardNumber + accountId + sourceProfile.
 *  - Empty cardNumber → falls back to defaultAccountId.
 *  - Mapped card suffix → accountId via config.cardMappings.
 *
 * Edge cases handled:
 *  - operationAmount sign preserved as-is (bank uses "-" for expense).
 *  - MCC may be null → stored as undefined.
 *  - paymentDate may be null → stored as undefined.
 *  - cardNumber empty string → stored as undefined.
 *  - cashback/bonuses/rounding default to 0.
 */
export async function mapRowsToTransactions(
  rows: TBankParsedRow[],
  config: ImportConfig,
): Promise<Omit<Transaction, 'id'>[]> {
  const results: Omit<Transaction, 'id'>[] = [];

  for (const row of rows) {
    const accountId = resolveAccountId(row.cardNumber, config);
    const hash = await generateHash(
      row.operationDate,
      row.operationAmount,
      row.description,
      row.cardNumber,
      accountId,
      config.sourceProfile,
    );

    results.push({
      date: row.paymentDate ?? row.operationDate.slice(0, 10),
      description: row.description,
      amount: row.operationAmount,
      accountId,
      sourceProfile: config.sourceProfile,
      externalHash: hash,
      isReviewed: false,

      operationDate: row.operationDate,
      paymentDate: row.paymentDate ?? undefined,
      cardNumber: row.cardNumber || undefined,
      bankCategory: row.bankCategory || undefined,
      mcc: row.mcc ?? undefined,
      cashback: row.cashback || undefined,
      bonuses: row.bonuses || undefined,
      bankStatus: row.status,
      operationCurrency: row.operationCurrency || undefined,
      operationAmount: row.operationAmount || undefined,
    });
  }

  return results;
}

function resolveAccountId(cardNumber: string, config: ImportConfig): string {
  if (!cardNumber) return config.defaultAccountId;
  const mapping = config.cardMappings.find((m) => m.suffix === cardNumber);
  return mapping?.accountId ?? config.defaultAccountId;
}
