export type AppLanguage =
  | "he"
  | "en"
  | "fr"
  | "ru"
  | "yi"
  | "it"
  | "es";

export type TextDirection = "rtl" | "ltr";

export type LanguageOption = {
  code: AppLanguage;
  label: string;
  nativeLabel: string;
  direction: TextDirection;
  isReady: boolean;
};

export const defaultLanguage: AppLanguage = "he";

export const languageOptions: LanguageOption[] = [
  {
    code: "he",
    label: "Hebrew",
    nativeLabel: "עברית",
    direction: "rtl",
    isReady: true,
  },
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    direction: "ltr",
    isReady: true,
  },
  {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    direction: "ltr",
    isReady: false,
  },
  {
    code: "ru",
    label: "Russian",
    nativeLabel: "Русский",
    direction: "ltr",
    isReady: false,
  },
  {
    code: "yi",
    label: "Yiddish",
    nativeLabel: "יידיש",
    direction: "rtl",
    isReady: false,
  },
  {
    code: "it",
    label: "Italian",
    nativeLabel: "Italiano",
    direction: "ltr",
    isReady: false,
  },
  {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    direction: "ltr",
    isReady: false,
  },
];

export const languageStorageKey = "beit-cohen-shor-language";
export const languageChangeEventName = "beit-cohen-shor-language-change";

export function getLanguageOption(language: AppLanguage) {
  return (
    languageOptions.find((option) => option.code === language) ??
    languageOptions[0]
  );
}

export function isAppLanguage(value: string): value is AppLanguage {
  return languageOptions.some((option) => option.code === value);
}

export function getDirection(language: AppLanguage): TextDirection {
  return getLanguageOption(language).direction;
}
