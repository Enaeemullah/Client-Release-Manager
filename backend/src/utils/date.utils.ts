export function formatReleaseDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;

  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  if (typeof date === 'string') {
    return date;
  }

  return undefined;
}
