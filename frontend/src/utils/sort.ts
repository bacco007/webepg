// Regex to test if a string contains only digits
const NUMERIC_REGEX = /^\d+$/;

export function compareLCN(a: string, b: string): number {
  const aIsNumeric = NUMERIC_REGEX.test(a);
  const bIsNumeric = NUMERIC_REGEX.test(b);

  if (aIsNumeric && bIsNumeric) {
    return Number.parseInt(a, 10) - Number.parseInt(b, 10);
  }

  if (aIsNumeric) {
    return -1;
  }

  if (bIsNumeric) {
    return 1;
  }

  return a.localeCompare(b);
}
