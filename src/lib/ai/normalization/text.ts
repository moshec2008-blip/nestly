export function normalizeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-").slice(0, 180);
}

export function normalizeProviderName(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") || undefined;
}

export function normalizeLocale(value: string | null | undefined) {
  return value?.trim() || "he-IL";
}
