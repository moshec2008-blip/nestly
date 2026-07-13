export function normalizeDate(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);

  if (!slashMatch) {
    return undefined;
  }

  const day = Number(slashMatch[1]);
  const month = Number(slashMatch[2]);
  const rawYear = Number(slashMatch[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return undefined;
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function addDaysIso(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}
