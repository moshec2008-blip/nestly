export type BirthdayReminder = "week-before" | "day-before";
export type BirthdayCalendarType = "hebrew" | "gregorian";

export type BirthdayPerson = {
  id: string;
  name: string;
  relationship: string;
  gregorianDate: string;
  hebrewDate: string;
  calendarType?: BirthdayCalendarType;
  reminders: BirthdayReminder[];
  notes: string;
};
