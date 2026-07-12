// נרמול קלט תאריך לפורמט ISO ‏(yyyy-mm-dd) — בשימוש בייבוא נתונים,
// שם תאריך לא תקין שנשמר כמו שהוא יכול לקרוס את המסך בכל טעינה.

const isoDatePattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
// פורמט ישראלי: יום/חודש/שנה, גם עם נקודות או מקפים.
const dayFirstPattern = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;

function toValidIsoDate(year: number, month: number, day: number) {
  if (year < 1900 || year > 2200) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");

  return `${year}-${paddedMonth}-${paddedDay}`;
}

export function normalizeDateString(value: string): string | null {
  const cleanValue = value.trim();

  const isoMatch = cleanValue.match(isoDatePattern);

  if (isoMatch) {
    return toValidIsoDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3])
    );
  }

  const dayFirstMatch = cleanValue.match(dayFirstPattern);

  if (dayFirstMatch) {
    return toValidIsoDate(
      Number(dayFirstMatch[3]),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1])
    );
  }

  return null;
}

export function isValidMonthKey(value: string) {
  return /^\d{4}-\d{2}$/.test(value);
}
