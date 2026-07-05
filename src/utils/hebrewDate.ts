export type BirthdayDateViewMode = "hebrew" | "gregorian";

export const birthdayDateViewModeStorageKey = "nestly-birthday-date-view";

export function formatHebrewDate(dateValue: string | Date | null | undefined, fallback = "") {
  if (!dateValue) {
    return fallback;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatGregorianDate(dateValue: string | Date | null | undefined, fallback = "") {
  if (!dateValue) {
    return fallback;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function getBirthdayDateViewMode(): BirthdayDateViewMode {
  if (typeof window === "undefined") {
    return "hebrew";
  }

  const storedValue = window.localStorage.getItem(birthdayDateViewModeStorageKey);
  return storedValue === "gregorian" ? "gregorian" : "hebrew";
}

export function setBirthdayDateViewMode(viewMode: BirthdayDateViewMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(birthdayDateViewModeStorageKey, viewMode);
}

export function formatBirthdayDate(
  dateValue: string | Date | null | undefined,
  viewMode: BirthdayDateViewMode = "hebrew",
  fallback = ""
) {
  return viewMode === "gregorian"
    ? formatGregorianDate(dateValue, fallback)
    : formatHebrewDate(dateValue, fallback);
}
