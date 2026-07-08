"use client";

import { useEffect, useState } from "react";
import { getModuleLiveStat } from "@/services/moduleLiveStats";
import type { AppRoute } from "@/types/navigation";

export function useModuleLiveStat(href: AppRoute, fallback: string) {
  const [liveStat, setLiveStat] = useState(fallback);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLiveStat(getModuleLiveStat(href, fallback));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [href, fallback]);

  return liveStat;
}
