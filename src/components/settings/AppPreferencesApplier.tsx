"use client";

import { useEffect } from "react";
import {
  appPreferencesChangeEventName,
  applyAppPreferences,
  readAppSettings,
  type AppSettings,
} from "@/lib/appPreferences";
import { getStorageScopeEventName } from "@/utils/storage";
import { useLanguage } from "@/i18n/useLanguage";

export default function AppPreferencesApplier() {
  const { language } = useLanguage();

  useEffect(() => {
    function applyStoredPreferences() {
      applyAppPreferences(readAppSettings(language));
    }

    function handlePreferenceChange(event: Event) {
      const customEvent = event as CustomEvent<AppSettings>;
      applyAppPreferences(customEvent.detail);
    }

    const timeoutId = window.setTimeout(applyStoredPreferences, 0);

    window.addEventListener(appPreferencesChangeEventName, handlePreferenceChange);
    window.addEventListener(getStorageScopeEventName(), applyStoredPreferences);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        appPreferencesChangeEventName,
        handlePreferenceChange
      );
      window.removeEventListener(getStorageScopeEventName(), applyStoredPreferences);
    };
  }, [language]);

  return null;
}
