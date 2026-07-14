"use client";

import { useEffect, useState } from "react";
import { getModuleLiveStat } from "@/services/moduleLiveStats";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute } from "@/types/navigation";

export function useModuleLiveStat(href: AppRoute, fallback: string) {
  const { language } = useLanguage();
  const [liveStat, setLiveStat] = useState(fallback);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLiveStat(getModuleLiveStat(href, fallback, language));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [href, fallback, language]);

  return liveStat;
}
