import type { Transaction } from '../../store/types';

// AICODE-NOTE: T_BANK_EXPORT_FORMAT 15‑column Excel format:
//   Дата операции | Дата платежа | Номер карты | Статус | Сумма операции | Валюта операции
//   | Сумма платежа | Валюта платежа | Кэшбэк | Категория | MCC | Описание
//   | Бонусы (включая кэшбэк) | Округление на инвесткопилку | Сумма операции с округлением

/* ============================================================
 * 1. RAW ROW — column‑per‑field, all values are optional strings
 *    (Excel cells can be empty, `undefined`, or `null`).
 * ============================================================ */

/** Named fields of a single T‑Bank Excel row (15 columns, 0‑based). */
export interface TBankRawRow {
  /** 0: "Дата операции" — e.g. "2026-05-31 19:42:58" */
  operationDate: string;
  /** 1: "Дата платежа" — may be empty (future‑dated auth) */
  paymentDate: string;
  /** 2: "Номер карты" — masked, e.g. "*5343"; may be empty (internal ops) */
  cardNumber: string;
  /** 3: "Статус" — expected "OK"; future: "HOLD", "DECLINED", "PROCESSING" */
  status: string;
  /** 4: "Сумма операции" — raw string, e.g. "-213" or "503.2" */
  operationAmount: string;
  /** 5: "Валюта операции" — e.g. "RUB" */
  operationCurrency: string;
  /** 6: "Сумма платежа" — settled amount (may differ from op.amount) */
  paymentAmount: string;
  /** 7: "Валюта платежа" */
  paymentCurrency: string;
  /** 8: "Кэшбэк" — may be empty */
  cashback: string;
  /** 9: "Категория" — bank‑assigned category, e.g. "Супермаркеты" */
  bankCategory: string;
  /** 10: "MCC" — merchant category code, may be empty */
  mcc: string;
  /** 11: "Описание" — counterparty / merchant name */
  description: string;
  /** 12: "Бонусы (включая кэшбэк)" */
  bonuses: string;
  /** 13: "Округление на инвесткопилку" */
  rounding: string;
  /** 14: "Сумма операции с округлением" */
  amountWithRounding: string;
}

/* ============================================================
 * 2. NORMALISED ROW — parsed into proper JS types.
 *    This is the "system of record" for one import row after parse.
 * ============================================================ */

export interface TBankParsedRow {
  operationDate: string;       // ISO‑8601 datetime, preserved as string
  paymentDate: string | null;  // null when empty in Excel
  cardNumber: string;          // empty string when not present
  status: TBankStatus;
  /** Always negative for expense, positive for income */
  operationAmount: number;
  operationCurrency: string;
  paymentAmount: number;
  paymentCurrency: string;
  cashback: number;            // 0 when empty
  bankCategory: string;
  mcc: string | null;          // null when empty
  description: string;
  bonuses: number;
  rounding: number;
  amountWithRounding: number;
}

export type TBankStatus = 'OK' | 'HOLD' | 'DECLINED' | 'PROCESSING' | string;

/* ============================================================
 * 3. COLUMN MAPPING — configure which column index maps to which field.
 *    Supports:
 *      - T‑Bank default (the format above)
 *      - future CSV exports with different column order
 * ============================================================ */

export interface ColumnMapping {
  operationDate: number;
  paymentDate: number;
  cardNumber: number;
  status: number;
  operationAmount: number;
  operationCurrency: number;
  paymentAmount: number;
  paymentCurrency: number;
  cashback: number;
  bankCategory: number;
  mcc: number;
  description: number;
  bonuses: number;
  rounding: number;
  amountWithRounding: number;
}

/**
 * Default mapping for T‑Bank Excel export (15 columns, 0‑based):
 *   Date oper | Date pay | Card | Status | Amount op | Curr op | Amount pay | Curr pay
 *   Cashback | Category | MCC | Description | Bonuses | Rounding | Amount w/ round
 */
export const T_BANK_DEFAULT_MAPPING: ColumnMapping = {
  operationDate: 0,
  paymentDate: 1,
  cardNumber: 2,
  status: 3,
  operationAmount: 4,
  operationCurrency: 5,
  paymentAmount: 6,
  paymentCurrency: 7,
  cashback: 8,
  bankCategory: 9,
  mcc: 10,
  description: 11,
  bonuses: 12,
  rounding: 13,
  amountWithRounding: 14,
};

/* ============================================================
 * 4. ROW VALIDATION
 * ============================================================ */

export interface RowValidation {
  rowIndex: number;
  valid: boolean;
  /** Human‑readable reason when invalid */
  reason?: string;
  /** Warnings that don't block import (e.g. empty MCC) */
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  rows: RowValidation[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/* ============================================================
 * 5. CARD → ACCOUNT MAPPING
 *    T‑Bank shows masked card numbers like "*5343".
 *    This maps them to internal account IDs for multi‑card setups.
 * ============================================================ */

export interface CardSuffixMapping {
  /** e.g. "*5343" */
  suffix: string;
  accountId: string;
}

/* ============================================================
 * 6. IMPORT CONFIG — per‑import settings.
 * ============================================================ */

export interface ImportConfig {
  /** Which account to assign transactions to by default */
  defaultAccountId: string;
  /** Optional card‑suffix → accountId overrides */
  cardMappings: CardSuffixMapping[];
  /** Source label, e.g. "tbank" */
  sourceProfile: string;
  /** Column mapping override (defaults to T_BANK_DEFAULT_MAPPING) */
  mapping?: Partial<ColumnMapping>;
  /** If true, skip rows whose status is not OK */
  skipNonOk?: boolean;
}

/* ============================================================
 * 7. PIPELINE STEP RESULT TYPES
 * ============================================================ */

export interface ParseResult {
  rows: TBankParsedRow[];
  validation: ValidationResult;
  /** Header‑row column labels for display/debug */
  headerLabels: string[];
}

export interface MapResult {
  transactions: Omit<Transaction, 'id'>[];
  skipped: number;
  /** Details of skipped rows */
  skippedReasons: Array<{ rowIndex: number; reason: string }>;
}

export interface DedupResult {
  new: Omit<Transaction, 'id'>[];
  duplicates: Omit<Transaction, 'id'>[];
}

export interface ImportPreviewStats {
  filename: string;
  found: number;
  newCount: number;
  duplicates: number;
  skipped: number;
  needsReview: number;
  /** New transactions before categorization */
  newBeforeCategorization: number;
  statsByCard: Record<string, { found: number; newCount: number }>;
}

/* ============================================================
 * 8. PARSED ROW (legacy compat)
 *    Used by generic parseWorkbook before column‑specific map.
 * ============================================================ */

export interface ParsedRow {
  values: string[];
}
