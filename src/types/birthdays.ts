export type BirthdayReminder = "week-before" | "day-before";

export type BirthdayPerson = {
  id: string;
  name: string;
  relationship: string;
  gregorianDate: string;
  hebrewDate: string;
  reminders: BirthdayReminder[];
  notes: string;
};
