import type { Transaction } from '../../store/types';

export interface ParsedRow {
  values: string[];
}

export interface ColumnMapping {
  dateIndex: number;
  amountIndex: number;
  descriptionIndex: number;
}

export interface DedupResult {
  new: Transaction[];
  duplicates: Transaction[];
}

export interface ImportPreviewStats {
  found: number;
  new: number;
  duplicates: number;
  needsReview: number;
}
