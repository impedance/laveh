export function formatDateShort(isoDate: string): string {
  const datePart = isoDate.slice(0, 10);
  const parts = datePart.split('-');
  if (parts.length < 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}-${m}-${y.slice(2)}`;
}
