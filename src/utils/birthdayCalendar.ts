import { HDate } from "hebcal";
import type {
  BirthdayCalendarType,
  BirthdayPerson,
  FamilyEventType,
} from "@/types/birthdays";

export type { BirthdayCalendarType, FamilyEventType };

export function normalizeBirthdayCalendarType(
  value: unknown
): BirthdayCalendarType {
  return value === "gregorian" ? "gregorian" : "hebrew";
}

export function normalizeFamilyEventType(value: unknown): FamilyEventType {
  if (
    value === "anniversary" ||
    value === "memorial" ||
    value === "custom"
  ) {
    return value;
  }

  return "birthday";
}

export function getDefaultCalendarTypeForEvent(
  eventType: FamilyEventType
): BirthdayCalendarType {
  return eventType === "birthday" || eventType === "memorial"
    ? "hebrew"
    : "gregorian";
}

export function getDefaultFamilyEventTitle(
  eventType: FamilyEventType,
  person = ""
) {
  if (eventType === "anniversary") {
    return person ? `יום נישואין של ${person}` : "יום נישואין";
  }

  if (eventType === "memorial") {
    return person ? `יארצייט של ${person}` : "יום זיכרון";
  }

  if (eventType === "custom") {
    return person || "אירוע משפחתי";
  }

  return person ? `יום הולדת של ${person}` : "יום הולדת";
}

export function normalizeBirthdayPerson(
  event: BirthdayPerson
): BirthdayPerson {
  const eventType = normalizeFamilyEventType(event.eventType);
  const name = event.name || event.person || event.title || "";
  const calendarType =
    event.calendarType ?? getDefaultCalendarTypeForEvent(eventType);

  return {
    ...event,
    name,
    person: event.person ?? name,
    title: event.title || getDefaultFamilyEventTitle(eventType, name),
    eventType,
    calendarType: normalizeBirthdayCalendarType(calendarType),
    recurringAnnually: event.recurringAnnually ?? true,
    reminders: event.reminders?.length ? event.reminders : ["week-before"],
    hebrewDate: event.hebrewDate || "",
    giftPlan: {
      ideas: event.giftPlan?.ideas ?? "",
      budget: event.giftPlan?.budget ?? "",
      purchased: Boolean(event.giftPlan?.purchased),
      wrapped: Boolean(event.giftPlan?.wrapped),
      delivered: Boolean(event.giftPlan?.delivered),
    },
    partyPlan: {
      cake: Boolean(event.partyPlan?.cake),
      balloons: Boolean(event.partyPlan?.balloons),
      invitations: Boolean(event.partyPlan?.invitations),
      food: Boolean(event.partyPlan?.food),
      decorations: Boolean(event.partyPlan?.decorations),
    },
  };
}

export function normalizeBirthdayPeople(
  birthdays: BirthdayPerson[]
): BirthdayPerson[] {
  return birthdays.map(normalizeBirthdayPerson);
}

export const normalizeFamilyEvent = normalizeBirthdayPerson;

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

function getHebrewEventDetails(
  event: Pick<BirthdayPerson, "gregorianDate">
) {
  const date = toDate(event.gregorianDate);
  if (!date) {
    return null;
  }

  const hebrewDate = new HDate(date);
  return {
    day: hebrewDate.getDate(),
    month: hebrewDate.getMonth(),
    wasLeapYear: hebrewDate.isLeapYear(),
  };
}

function isHebrewLeapYear(year: number) {
  return ((7 * year + 1) % 19) < 7;
}

function getAnniversaryHebrewMonth(
  sourceMonth: number,
  sourceWasLeapYear: boolean,
  targetYear: number
) {
  const adar = 12;
  const adarII = 13;
  const targetIsLeapYear = isHebrewLeapYear(targetYear);

  if (sourceMonth === adarII && !targetIsLeapYear) {
    return adar;
  }

  if (sourceMonth === adar && !sourceWasLeapYear && targetIsLeapYear) {
    return adarII;
  }

  return sourceMonth;
}

export function getNextBirthdayOccurrenceDate(
  event: Pick<BirthdayPerson, "gregorianDate" | "calendarType">,
  referenceDate: Date = new Date()
) {
  const baseDate = toDate(event.gregorianDate);
  if (!baseDate) {
    return null;
  }

  if (event.calendarType === "gregorian") {
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

  const hebrewDetails = getHebrewEventDetails(event);
  if (!hebrewDetails) {
    return null;
  }

  const today = startOfDay(referenceDate);
  const currentHebrewYear = new HDate(today).getFullYear();
  const candidates = [currentHebrewYear, currentHebrewYear + 1]
    .map((year) => {
      const month = getAnniversaryHebrewMonth(
        hebrewDetails.month,
        hebrewDetails.wasLeapYear,
        year
      );
      const candidate = new HDate(hebrewDetails.day, month, year);
      return startOfDay(candidate.greg());
    })
    .filter((candidateDate) => candidateDate >= today)
    .sort((first, second) => first.getTime() - second.getTime());

  return candidates[0] ?? null;
}

export function getDaysUntilBirthday(
  event: Pick<BirthdayPerson, "gregorianDate" | "calendarType">,
  referenceDate: Date = new Date()
) {
  const nextOccurrence = getNextBirthdayOccurrenceDate(event, referenceDate);
  if (!nextOccurrence) {
    return 0;
  }

  const today = startOfDay(referenceDate);
  return Math.round(
    (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function getBirthdayAge(
  event: Pick<BirthdayPerson, "gregorianDate" | "calendarType">,
  referenceDate: Date = new Date()
) {
  const nextOccurrence = getNextBirthdayOccurrenceDate(event, referenceDate);
  const sourceDate = toDate(event.gregorianDate);

  if (!nextOccurrence || !sourceDate) {
    return 0;
  }

  return Math.max(nextOccurrence.getFullYear() - sourceDate.getFullYear(), 0);
}

export function getBirthdayCalendarBadge(calendarType: BirthdayCalendarType) {
  return calendarType === "hebrew" ? "עברי" : "לועזי";
}

export const getNextFamilyEventOccurrenceDate = getNextBirthdayOccurrenceDate;
export const getDaysUntilFamilyEvent = getDaysUntilBirthday;
export const getFamilyEventAnniversaryCount = getBirthdayAge;
