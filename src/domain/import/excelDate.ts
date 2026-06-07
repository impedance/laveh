const EXCEL_SERIAL_MIN = 30_000;
const EXCEL_SERIAL_MAX = 100_000;

export function normalizeDateField(raw: string): string {
  if (!raw) return raw;
  const trimmed = raw.trim();
  const num = Number(trimmed);
  if (
    Number.isFinite(num) &&
    num >= EXCEL_SERIAL_MIN &&
    num <= EXCEL_SERIAL_MAX
  ) {
    return excelSerialToDateStr(num);
  }
  return trimmed;
}

export function excelSerialToDateStr(serial: number): string {
  const ms = (serial - 25569) * 86_400_000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}
