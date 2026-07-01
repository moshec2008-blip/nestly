"use client";

import {
  getLanguageOption,
  languageOptions,
  type AppLanguage,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { useLanguage } from "@/i18n/useLanguage";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = getLanguageOption(language);
  const dictionary = getDictionary(language);

  return (
    <label className="flex h-9 items-center gap-2 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-xs font-bold text-slate-600 transition hover:bg-white">
      <span aria-hidden="true">{dictionary.language}</span>
      <span className="sr-only">{dictionary.language}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
        className="max-w-28 bg-transparent text-xs font-bold text-slate-700 outline-none"
        aria-label={`${dictionary.currentLanguage}: ${currentLanguage.nativeLabel}`}
      >
        {languageOptions.map((option) => (
          <option
            key={option.code}
            value={option.code}
            className="text-slate-950"
            disabled={!option.isReady}
          >
            {option.nativeLabel}
            {option.isReady ? "" : ` · ${dictionary.comingSoon}`}
          </option>
        ))}
      </select>
    </label>
  );
}
