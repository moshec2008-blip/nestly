"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import {
  acquireInterruption,
  releaseInterruption,
} from "@/lib/interruptions";
import { storageKeys } from "@/lib/storageKeys";
import {
  getDailyFocus,
  type DailyFocus,
  type IntelligenceTone,
} from "@/services/familyIntelligence";

const nudgeDelayMs = 4500;
const nudgeInterruptionId = "smart-nudge";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function toneClassName(tone: IntelligenceTone) {
  if (tone === "danger") {
    return "bg-rose-50 text-rose-700";
  }

  if (tone === "warning") {
    return "bg-amber-50 text-amber-700";
  }

  if (tone === "good") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-sky-50 text-sky-700";
}

const copy = {
  he: {
    close: "סגור המלצה",
    notNow: "לא עכשיו",
  },
  en: {
    close: "Close suggestion",
    notNow: "Not now",
  },
} as const;

export default function SmartNudgePopup() {
  const { language, direction } = useLanguage();
  const languageKey = language === "en" ? "en" : "he";
  const text = copy[languageKey];
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const nudge = useMemo<DailyFocus | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getDailyFocus(language);
  }, [language]);

  useEffect(() => {
    if (!nudge || typeof window === "undefined" || nudge.href === "/") {
      return;
    }

    const nudgeId = `${nudge.href}-${getTodayKey()}`;
    const storedValue = window.localStorage.getItem(storageKeys.smartNudge);

    if (storedValue === nudgeId) {
      return;
    }

    const openTimeoutId = window.setTimeout(() => {
      if (!acquireInterruption(nudgeInterruptionId)) {
        return;
      }

      setIsVisible(true);
      window.localStorage.setItem(storageKeys.smartNudge, nudgeId);
    }, nudgeDelayMs);

    return () => {
      window.clearTimeout(openTimeoutId);
      releaseInterruption(nudgeInterruptionId);
    };
  }, [nudge]);

  function dismissNudge() {
    setIsDismissed(true);
    setIsVisible(false);
    releaseInterruption(nudgeInterruptionId);
  }

  if (!nudge || !isVisible || isDismissed || nudge.href === "/") {
    return null;
  }

  return (
    <aside
      className={[
        "nestly-floating-nudge fixed left-4 z-50 w-[min(22rem,calc(100vw-2rem))] animate-soft-in rounded-[24px] border border-white/80 bg-white/94 p-3 shadow-[0_24px_70px_rgba(33,43,63,0.18)] backdrop-blur-xl",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={dismissNudge}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] text-slate-600 transition hover:bg-white"
          aria-label={text.close}
        >
          <AppIcon name="close" className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-start justify-end gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">{nudge.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
              {nudge.description}
            </p>
          </div>
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${toneClassName(
              nudge.tone
            )}`}
          >
            <AppIcon name={nudge.icon} className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={dismissNudge}
          className="min-h-10 rounded-2xl px-3 text-xs font-black text-slate-500 transition hover:bg-[#fff8eb]"
        >
          {text.notNow}
        </button>
        <Link
          href={nudge.href}
          onClick={dismissNudge}
          className="min-h-10 rounded-2xl border border-[#eadfcd] bg-[#fffdf8] px-4 py-2.5 text-xs font-black text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
        >
          {nudge.actionLabel}
        </Link>
      </div>
    </aside>
  );
}
