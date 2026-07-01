"use client";

import { useEffect, useState } from "react";
import {
  defaultLanguage,
  getDirection,
  isAppLanguage,
  languageChangeEventName,
  languageStorageKey,
  type AppLanguage,
} from "@/i18n/config";

function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const storedLanguage = window.localStorage.getItem(languageStorageKey);

  if (storedLanguage && isAppLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return defaultLanguage;
}

function applyDocumentLanguage(language: AppLanguage) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
}

export function setStoredLanguage(language: AppLanguage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(languageStorageKey, language);
  applyDocumentLanguage(language);
  window.dispatchEvent(
    new CustomEvent(languageChangeEventName, { detail: language })
  );
}

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedLanguage = readStoredLanguage();
      setLanguage(storedLanguage);
      applyDocumentLanguage(storedLanguage);
    }, 0);

    function handleLanguageChange(event: Event) {
      const customEvent = event as CustomEvent<AppLanguage>;
      const nextLanguage = customEvent.detail;

      if (isAppLanguage(nextLanguage)) {
        setLanguage(nextLanguage);
        applyDocumentLanguage(nextLanguage);
      }
    }

    window.addEventListener(languageChangeEventName, handleLanguageChange);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(languageChangeEventName, handleLanguageChange);
    };
  }, []);

  return {
    language,
    direction: getDirection(language),
    setLanguage: setStoredLanguage,
  };
}
