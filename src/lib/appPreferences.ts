"use client";

import { storageKeys } from "@/lib/storageKeys";
import { readStorage } from "@/utils/storage";
import { defaultLanguage, isAppLanguage, type AppLanguage } from "@/i18n/config";

export type AppSettings = {
  language: AppLanguage;
  highContrast: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
};

export const defaultAppSettings: AppSettings = {
  language: defaultLanguage,
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
    isBoolean(settings.highContrast) &&
    isBoolean(settings.compactMode) &&
    isBoolean(settings.reducedMotion)
  );
}

export function readAppSettings(language = defaultLanguage) {
  return {
    ...defaultAppSettings,
    ...readStorage(storageKeys.appSettings, defaultAppSettings, isAppSettings),
    language,
  };
}

export function applyAppPreferences(settings: Pick<AppSettings, "highContrast" | "compactMode" | "reducedMotion">) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

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
