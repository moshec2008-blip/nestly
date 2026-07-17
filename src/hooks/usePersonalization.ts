"use client";

import { useEffect, useState } from "react";
import {
  personalizationChangedEventName,
  readPersonalizationPreferences,
} from "@/lib/personalization";
import type { PersonalizationPreferences } from "@/types/personalization";

export function usePersonalization() {
  const [preferences, setPreferences] = useState<PersonalizationPreferences>(
    readPersonalizationPreferences
  );

  useEffect(() => {
    function syncPreferences() {
      setPreferences(readPersonalizationPreferences());
    }

    syncPreferences();
    window.addEventListener(personalizationChangedEventName, syncPreferences);

    return () => {
      window.removeEventListener(personalizationChangedEventName, syncPreferences);
    };
  }, []);

  return preferences;
}
