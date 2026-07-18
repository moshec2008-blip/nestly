"use client";

import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import {
  acquireInterruption,
  releaseInterruption,
} from "@/lib/interruptions";
import { storageKeys } from "@/lib/storageKeys";

const welcomeInterruptionId = "first-run-welcome";
const welcomeDelayMs = 700;
const welcomePreviewParam = "welcome";

const welcomeCopy = {
  he: {
    close: "סגור חלון פתיחה",
    title: "הבית שלכם, קצת יותר מסודר",
    body: "Nestly נולדה מתוך החיים עצמם - המשימות, הקניות, התשלומים והדברים הקטנים שקל לשכוח. במקום לפזר הכול בין הודעות, פתקים ואפליקציות, היא מרכזת את מה שחשוב למשפחה במקום אחד פשוט, שקט ונעים.",
    confirm: "הבנתי, בואו נתחיל",
  },
  en: {
    close: "Close welcome",
    title: "Your home, a little more settled",
    body: "Nestly grew out of real family life: the tasks, shopping, payments and small things that are easy to forget. Instead of scattering everything across messages, notes and apps, it keeps what matters in one simple, calm place.",
    confirm: "Got it, let's start",
  },
} as const;

export default function FirstRunWelcomePopup() {
  const { language, direction } = useLanguage();
  const languageKey = language === "en" ? "en" : "he";
  const text = welcomeCopy[languageKey];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const explicitlyPreviewWelcome = params.get(welcomePreviewParam) === "1";
    const isLocalPreview =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalPreview && !explicitlyPreviewWelcome) {
      return;
    }

    if (
      !explicitlyPreviewWelcome &&
      window.localStorage.getItem(storageKeys.firstRunWelcome) === "true"
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!acquireInterruption(welcomeInterruptionId)) {
        return;
      }

      setIsVisible(true);
    }, welcomeDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      releaseInterruption(welcomeInterruptionId);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismissWelcome();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  function dismissWelcome() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKeys.firstRunWelcome, "true");
    }

    setIsVisible(false);
    releaseInterruption(welcomeInterruptionId);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/30 px-4 py-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismissWelcome();
        }
      }}
    >
      <section
        aria-labelledby="first-run-welcome-title"
        aria-modal="true"
        className={[
          "relative w-full max-w-[24.5rem] animate-soft-in overflow-hidden rounded-[26px] border border-white/80 bg-[#fffdf8] px-5 pb-5 pt-4 text-[#1f2937] shadow-[0_24px_70px_rgba(31,41,55,0.2)] sm:max-w-[28rem] sm:px-6 sm:pb-6 sm:pt-5",
          direction === "rtl" ? "text-right" : "text-left",
        ].join(" ")}
        role="dialog"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#d8a447,#9db4d4,#e8d7b8)]"
        />

        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={dismissWelcome}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#efe4d2] bg-white/75 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9db4d4]"
            aria-label={text.close}
          >
            <AppIcon name="close" className="h-5 w-5" />
          </button>

          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fff7e8] text-[#7a5212] shadow-sm">
            <AppIcon name="home" className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-3">
          <h2
            id="first-run-welcome-title"
            className="text-[1.7rem] font-black leading-[1.12] text-slate-950 sm:text-3xl"
          >
            {text.title}
          </h2>
          <p className="mt-3 text-[0.95rem] font-semibold leading-6 text-slate-600">
            {text.body}
          </p>
        </div>

        <button
          type="button"
          onClick={dismissWelcome}
          className="mt-5 min-h-11 w-full rounded-2xl border border-[#dcc9aa] bg-[#fff7e8] px-5 py-2.5 text-sm font-black text-[#2f2112] shadow-[0_12px_28px_rgba(126,86,28,0.12)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9db4d4]"
        >
          {text.confirm}
        </button>
      </section>
    </div>
  );
}
