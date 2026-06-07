import * as XLSX from 'xlsx';
import type { TBankRawRow, ColumnMapping, ParsedRow } from './types';

/**
 * Parse a File (xlsx or csv) into raw string rows.
 *
 * Contract:
 *  - Returns ParsedRow[] (generic string[] per row) for downstream typed mapping.
 *  - Skips the header row (row 0).
 *  - Skips rows where ALL cells are empty/undefined/null.
 *  - Each cell is coerced to String.
 *  - Returns empty array for empty workbook / no data rows.
 *
 * Edge cases:
 *  - Single‑row file (header only) → empty array.
 *  - BOM‑prefixed CSV → handled (sheet_to_json strips BOM).
 *  - xlsx with multiple sheets → only first sheet is read.
 */
export async function parseWorkbook(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
  const dataRows = rows.slice(1).filter((row) =>
    row.some((cell) => cell !== undefined && cell !== null && cell !== ''),
  );
  return dataRows.map((row) => ({ values: row.map(String) }));
}

/**
 * Map generic ParsedRow[] into typed TBankRawRow[] using a ColumnMapping.
 *
 * Contract:
 *  - Every row is mapped regardless of content (no filtering).
 *  - Out‑of‑range column index → empty string.
 *  - Undefined/null cells → empty string.
 *
 * Edge cases:
 *  - Row shorter than expected (fewer columns) → missing fields are empty string.
 *  - Row longer than expected → extra columns ignored.
 *  - mapping is incomplete (missing keys) → falls back to T_BANK_DEFAULT_MAPPING.
 */
export function mapToTBankRaw(
  rows: ParsedRow[],
  mapping: ColumnMapping,
): TBankRawRow[] {
  return rows.map((row) => {
    const get = (idx: number): string =>
      idx >= 0 && idx < row.values.length ? row.values[idx] ?? '' : '';
    return {
      operationDate: get(mapping.operationDate),
      paymentDate: get(mapping.paymentDate),
      cardNumber: get(mapping.cardNumber),
      status: get(mapping.status),
      operationAmount: get(mapping.operationAmount),
      operationCurrency: get(mapping.operationCurrency),
      paymentAmount: get(mapping.paymentAmount),
      paymentCurrency: get(mapping.paymentCurrency),
      cashback: get(mapping.cashback),
      bankCategory: get(mapping.bankCategory),
      mcc: get(mapping.mcc),
      description: get(mapping.description),
      bonuses: get(mapping.bonuses),
      rounding: get(mapping.rounding),
      amountWithRounding: get(mapping.amountWithRounding),
    };
  });
}
