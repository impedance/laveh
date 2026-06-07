import type { TBankRawRow, TBankParsedRow, TBankStatus } from './types';
import { normalizeDateField } from './excelDate';

export function normalizeTBankRow(row: TBankRawRow): TBankParsedRow {
  return {
    operationDate: normalizeDateField(row.operationDate),
    paymentDate: normalizeDateField(row.paymentDate) || null,
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
