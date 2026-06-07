import { describe, it, expect } from 'vitest';
import { parseWorkbook, mapToTBankRaw } from '../parseWorkbook';
import { normalizeTBankRow } from '../normalizeTBankRow';
import { T_BANK_DEFAULT_MAPPING } from '../types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function file(name: string): File {
  const buf = readFileSync(resolve(__dirname, '../../../../tests/fixtures', name));
  return new File([buf], name);
}

describe('parseWorkbook', () => {
  it('parses .xlsx file into rows', async () => {
    const rows = await parseWorkbook(file('sample.xlsx'));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].values[0]).toBe('2026-06-01');
  });

  it('parses .csv file into rows', async () => {
    const rows = await parseWorkbook(file('sample.csv'));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].values[2]).toBe('Пятёрочка');
  });

  it('returns empty array for empty file', async () => {
    const buf = new Uint8Array([0xef, 0xbb, 0xbf]); // BOM only
    const f = new File([buf], 'empty.csv');
    const rows = await parseWorkbook(f);
    expect(rows.length).toBe(0);
  });

  it('skips header row', async () => {
    const rows = await parseWorkbook(file('sample.csv'));
    const hasHeader = rows.some((r) => r.values[0] === 'Date');
    expect(hasHeader).toBe(false);
  });
});

describe('mapToTBankRaw + normalizeTBankRow', () => {
  it('maps known columns and normalizes', async () => {
    const rows = await parseWorkbook(file('sample.xlsx'));
    const raw = mapToTBankRaw(rows, T_BANK_DEFAULT_MAPPING);
    const typed = raw.map(normalizeTBankRow);

    expect(typed.length).toBeGreaterThan(0);
    expect(typed[0].operationAmount).toBeTypeOf('number');
    expect(typed[0].status).toBe('OK');
  });

  it('handles rows shorter than 15 columns gracefully', () => {
    // Only 2 values → all mapped fields beyond index 1 get ""
    const shortRows = [{ values: ['2026-01-01', '2026-01-02'] }];
    const raw = mapToTBankRaw(shortRows, T_BANK_DEFAULT_MAPPING);
    const typed = raw.map(normalizeTBankRow);

    expect(typed[0].operationAmount).toBe(0);
    expect(typed[0].description).toBe('');
    // paymentDate mapping (index 1) has value, so it's non-null
    expect(typed[0].paymentDate).toBe('2026-01-02');
    // cardNumber index 2 is out of range → empty string
    expect(typed[0].cardNumber).toBe('');
  });

  it('handles empty cashback as 0', () => {
    const rawRow = {
      operationDate: '2026-01-01', paymentDate: '2026-01-01', cardNumber: '*5343',
      status: 'OK', operationAmount: '-500', operationCurrency: 'RUB',
      paymentAmount: '-500', paymentCurrency: 'RUB', cashback: '',
      bankCategory: 'Супермаркеты', mcc: '5411', description: 'Тест',
      bonuses: '', rounding: '', amountWithRounding: '-500',
    };
    const typed = normalizeTBankRow(rawRow);
    expect(typed.cashback).toBe(0);
    expect(typed.bonuses).toBe(0);
  });
});
