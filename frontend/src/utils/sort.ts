export function compareLCN(a: string, b: string): number {
  const aIsNumeric = /^\d+$/.test(a);
  const bIsNumeric = /^\d+$/.test(b);
  if (aIsNumeric && bIsNumeric) return Number.parseInt(a) - Number.parseInt(b);
  if (aIsNumeric) return -1;
  if (bIsNumeric) return 1;
  return a.localeCompare(b);
}
