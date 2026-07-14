"use client";

import { storageKeys } from "@/lib/storageKeys";
import { readStorage } from "@/utils/storage";
import { defaultLanguage, isAppLanguage, type AppLanguage } from "@/i18n/config";

export type AppSettings = {
  language: AppLanguage;
  simpleMode: boolean;
  highContrast: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
};

export const defaultAppSettings: AppSettings = {
  language: defaultLanguage,
  simpleMode: false,
  highContrast: false,
  compactMode: false,
  reducedMotion: false,
};

export const appPreferencesChangeEventName = "nestly-app-preferences-change";

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isAppSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Partial<AppSettings>;

  return (
    typeof settings.language === "string" &&
    isAppLanguage(settings.language) &&
    (settings.simpleMode === undefined || isBoolean(settings.simpleMode)) &&
    (settings.highContrast === undefined || isBoolean(settings.highContrast)) &&
    (settings.compactMode === undefined || isBoolean(settings.compactMode)) &&
    (settings.reducedMotion === undefined || isBoolean(settings.reducedMotion))
  );
}

export function readAppSettings(language = defaultLanguage) {
  return {
    ...defaultAppSettings,
    ...readStorage(storageKeys.appSettings, defaultAppSettings, isAppSettings),
    language,
  };
}

export function applyAppPreferences(
  settings: Pick<
    AppSettings,
    "simpleMode" | "highContrast" | "compactMode" | "reducedMotion"
  >
) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.classList.toggle("nestly-simple-mode", settings.simpleMode);
  root.dataset.simpleMode = settings.simpleMode ? "true" : "false";
  root.classList.toggle("nestly-high-contrast", settings.highContrast);
  root.classList.toggle("nestly-compact", settings.compactMode);
  root.classList.toggle("nestly-reduce-motion", settings.reducedMotion);
}

export function notifyAppPreferencesChanged(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(appPreferencesChangeEventName, { detail: settings })
  );
}
