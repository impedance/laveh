import type { TBankRawRow, TBankParsedRow, TBankStatus } from './types';

/**
 * Normalise a raw string TBankRawRow into a typed TBankParsedRow.
 *
 * Contract:
 *  - String → number conversion uses parseFloat after stripping whitespace/non‑numeric.
 *  - Empty cashback, bonuses, rounding → 0.
 *  - Empty MCC, paymentDate → null.
 *  - Status defaults to "OK" when empty.
 *  - operationDate is expected in "YYYY-MM-DD HH:mm:ss" format; preserved as‑is.
 *  - Amount sign preserved (bank uses "-" for expense).
 *
 * Edge cases:
 *  - "N/A", "-", or other non‑numeric strings in amount fields → 0.
 *  - operationDate with no time component → still valid ISO.
 *  - Decimal separator: always "." in T‑Bank export.
 *  - Thousand separators: none expected; if present parseFloat stops at first non‑digit.
 */
export function normalizeTBankRow(row: TBankRawRow): TBankParsedRow {
  return {
    operationDate: row.operationDate,
    paymentDate: row.paymentDate || null,
    cardNumber: row.cardNumber,
    status: (row.status || 'OK') as TBankStatus,
    operationAmount: parseAmount(row.operationAmount),
    operationCurrency: row.operationCurrency || 'RUB',
    paymentAmount: parseAmount(row.paymentAmount),
    paymentCurrency: row.paymentCurrency || 'RUB',
    cashback: parseAmount(row.cashback),
    bankCategory: row.bankCategory || '',
    mcc: row.mcc || null,
    description: row.description || '',
    bonuses: parseAmount(row.bonuses),
    rounding: parseAmount(row.rounding),
    amountWithRounding: parseAmount(row.amountWithRounding),
  };
}

function parseAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}
