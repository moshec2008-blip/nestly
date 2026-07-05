import { HDate } from "hebcal";
import type { BirthdayCalendarType, BirthdayPerson } from "@/types/birthdays";

export type { BirthdayCalendarType };

export function normalizeBirthdayCalendarType(value: unknown): BirthdayCalendarType {
  return value === "gregorian" ? "gregorian" : "hebrew";
}

export function normalizeBirthdayPerson(birthday: BirthdayPerson): BirthdayPerson {
  return {
    ...birthday,
    calendarType: normalizeBirthdayCalendarType(birthday.calendarType),
    hebrewDate: birthday.hebrewDate || "",
  };
}

export function normalizeBirthdayPeople(birthdays: BirthdayPerson[]): BirthdayPerson[] {
  return birthdays.map(normalizeBirthdayPerson);
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getHebrewBirthDetails(birthday: Pick<BirthdayPerson, "gregorianDate">) {
  const birthDate = toDate(birthday.gregorianDate);
  if (!birthDate) {
    return null;
  }

  const hebrewDate = new HDate(birthDate);
  return {
    day: hebrewDate.getDate(),
    month: hebrewDate.getMonth(),
    year: hebrewDate.getFullYear(),
  };
}

export function getNextBirthdayOccurrenceDate(
  birthday: Pick<BirthdayPerson, "gregorianDate" | "calendarType">,
  referenceDate: Date = new Date()
) {
  const baseDate = toDate(birthday.gregorianDate);
  if (!baseDate) {
    return null;
  }

  if (birthday.calendarType === "gregorian") {
    const today = startOfDay(referenceDate);
    const candidate = new Date(
      today.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate()
    );
    candidate.setHours(0, 0, 0, 0);

    if (candidate < today) {
      candidate.setFullYear(today.getFullYear() + 1);
    }

    return candidate;
  }

  const hebrewBirthDetails = getHebrewBirthDetails(birthday);
  if (!hebrewBirthDetails) {
    return null;
  }

  const today = startOfDay(referenceDate);
  const todayHebrew = new HDate(today);
  const currentHebrewYear = todayHebrew.getFullYear();
  const candidateYears = [currentHebrewYear, currentHebrewYear + 1];

  const candidates = candidateYears
    .map((year) => {
      const candidate = new HDate(hebrewBirthDetails.day, hebrewBirthDetails.month, year);
      return startOfDay(candidate.greg());
    })
    .filter((candidateDate) => candidateDate >= today);

  return candidates[0] ?? null;
}

export function getDaysUntilBirthday(
  birthday: Pick<BirthdayPerson, "gregorianDate" | "calendarType">,
  referenceDate: Date = new Date()
) {
  const nextOccurrence = getNextBirthdayOccurrenceDate(birthday, referenceDate);
  if (!nextOccurrence) {
    return 0;
  }

  const today = startOfDay(referenceDate);
  return Math.round(
    (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getBirthdayAge(
  birthday: Pick<BirthdayPerson, "gregorianDate" | "calendarType">,
  referenceDate: Date = new Date()
) {
  const nextOccurrence = getNextBirthdayOccurrenceDate(birthday, referenceDate);
  const birthDate = toDate(birthday.gregorianDate);

  if (!nextOccurrence || !birthDate) {
    return 0;
  }

  return nextOccurrence.getFullYear() - birthDate.getFullYear();
}

export function getBirthdayCalendarBadge(calendarType: BirthdayCalendarType) {
  return calendarType === "hebrew" ? "📅 עברי" : "📅 לועזי";
}
