export type BirthdayReminder =
  | "week-before"
  | "three-days-before"
  | "day-before"
  | "same-day";
export type BirthdayCalendarType = "hebrew" | "gregorian";
export type FamilyEventType = "birthday" | "anniversary" | "memorial" | "custom";

export type BirthdayGiftPlan = {
  ideas: string;
  budget: string;
  purchased: boolean;
  wrapped: boolean;
  delivered: boolean;
};

export type BirthdayPartyPlan = {
  cake: boolean;
  balloons: boolean;
  invitations: boolean;
  food: boolean;
  decorations: boolean;
};

export type BirthdayPerson = {
  id: string;
  title?: string;
  name: string;
  person?: string;
  relationship: string;
  eventType?: FamilyEventType;
  gregorianDate: string;
  hebrewDate: string;
  calendarType: BirthdayCalendarType;
  recurringAnnually?: boolean;
  reminders: BirthdayReminder[];
  notes: string;
  imageUrl?: string;
  giftPlan?: BirthdayGiftPlan;
  partyPlan?: BirthdayPartyPlan;
};

export type FamilyEvent = BirthdayPerson;

export function isFamilyEvent(value: unknown): value is FamilyEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<FamilyEvent>;

  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    typeof event.name === "string" &&
    typeof event.gregorianDate === "string" &&
    Array.isArray(event.reminders)
  );
}
