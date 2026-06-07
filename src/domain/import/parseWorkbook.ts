import * as XLSX from 'xlsx';
import type { ParsedRow } from './types';

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
