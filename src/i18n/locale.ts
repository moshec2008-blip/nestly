import type { AppLanguage } from "@/i18n/config";

// שפות שעדיין לא זמינות למשתמש (fr/ru/yi/it/es) נופלות כרגע לעברית —
// ראו TopNavigation.tsx לדוגמה של מיפוי locale מלא לכל שפה, אם תיפתחנה.
export function getLocale(language: AppLanguage) {
  return language === "en" ? "en-US" : "he-IL";
}
