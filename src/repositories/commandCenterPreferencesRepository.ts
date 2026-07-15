import { storageKeys } from "@/lib/storageKeys";
import type { CommandCenterPreference } from "@/types/commandCenter";
import { readStorageArray, writeStorage } from "@/utils/storage";

function isCommandCenterPreference(
  value: unknown
): value is CommandCenterPreference {
  if (!value || typeof value !== "object") {
    return false;
  }

  const preference = value as Partial<CommandCenterPreference>;
  return typeof preference.itemKey === "string";
}

export function readCommandCenterPreferences() {
  return readStorageArray<CommandCenterPreference>(
    storageKeys.commandCenterPreferences,
    [],
    isCommandCenterPreference
  );
}

function writeCommandCenterPreferences(preferences: CommandCenterPreference[]) {
  return writeStorage(storageKeys.commandCenterPreferences, preferences);
}

export function upsertCommandCenterPreference(
  itemKey: string,
  patch: Omit<Partial<CommandCenterPreference>, "itemKey">
) {
  const preferences = readCommandCenterPreferences();
  const existing = preferences.find((item) => item.itemKey === itemKey);
  const nextPreference: CommandCenterPreference = {
    itemKey,
    ...existing,
    ...patch,
  };

  writeCommandCenterPreferences([
    nextPreference,
    ...preferences.filter((item) => item.itemKey !== itemKey),
  ]);

  return nextPreference;
}

export function clearCommandCenterPreference(itemKey: string) {
  const preferences = readCommandCenterPreferences();
  return writeCommandCenterPreferences(
    preferences.filter((item) => item.itemKey !== itemKey)
  );
}

export function dismissCommandCenterItem(itemKey: string, reason?: string) {
  return upsertCommandCenterPreference(itemKey, {
    dismissedAt: new Date().toISOString(),
    dismissReason: reason,
  });
}

export function snoozeCommandCenterItem(itemKey: string, snoozedUntil: string) {
  return upsertCommandCenterPreference(itemKey, {
    dismissedAt: undefined,
    snoozedUntil,
  });
}
