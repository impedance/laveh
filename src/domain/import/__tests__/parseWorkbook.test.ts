import { describe, it, expect } from 'vitest';
import { parseWorkbook } from '../parseWorkbook';
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
