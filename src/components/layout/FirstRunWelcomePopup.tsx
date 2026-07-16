"use client";

import { useEffect, useRef, useState } from "react";
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

const copy = {
  he: {
    close: "סגור חלון פתיחה",
    eyebrow: "ברוכים הבאים ל־Nestly",
    title: "הבית הדיגיטלי של המשפחה",
    intro: "עשר שורות קצרות כדי להבין איך Nestly יכולה לעזור לכם כבר היום.",
    confirm: "הבנתי, בואו נתחיל",
    lines: [
      "Nestly מגיעה מהמילה Nest — קן, בית חם ומוגן למשפחה.",
      "מרכז אחד למשימות, קניות, כספים, מסמכים ותזכורות.",
      "פותחים ורואים מיד מה חשוב למשפחה היום.",
      "מוסיפים משימות וקניות בלי להרגיש שממלאים טפסים.",
      "עוקבים אחרי הוצאות, הכנסות ויתרות בצורה פשוטה.",
      "שומרים מסמכים וקבלות במקום מסודר ונגיש.",
      "מנהלים אירועים, רכבים, בריאות ומידע משפחתי חשוב.",
      "לוכדים רעיון, מסמך או קבלה מכל מקום באפליקציה.",
      "במצב בסיסי המידע נשמר במכשיר הזה בלבד.",
      "המטרה: פחות עומס בראש, יותר סדר ושקט בבית.",
    ],
  },
  en: {
    close: "Close welcome",
    eyebrow: "Welcome to Nestly",
    title: "Your family’s digital home",
    intro: "Ten short lines to understand how Nestly can help your family today.",
    confirm: "Got it, let’s start",
    lines: [
      "Nestly comes from Nest: a warm, protected home for the family.",
      "One place for tasks, shopping, money, documents and reminders.",
      "Open the app and see what matters to the family today.",
      "Add tasks and shopping items without feeling like you are filling forms.",
      "Track expenses, income and balances in a simple way.",
      "Keep documents and receipts organized and easy to find.",
      "Manage events, vehicles, health and important family information.",
      "Capture an idea, document or receipt from anywhere in the app.",
      "In basic mode, data stays on this device only.",
      "The goal: less mental load, more calm at home.",
    ],
  },
} as const;

const storyCopy = {
  he: {
    close: "סגור חלון פתיחה",
    eyebrow: "ברוכים הבאים ל-Nestly",
    title: "הקן הדיגיטלי של המשפחה שלכם",
    intro: "סיפור קצר על המקום שבו המשפחה שומרת סדר, שקט ומה שחשוב באמת.",
    confirm: "הבנתי, בואו נתחיל",
    lines: [
      "Nestly נולדה מהמילה Nest: קן, בית קטן וחם שבו הדברים החשובים נשמרים קרוב.",
      "בכל משפחה יש משימות, קניות, תשלומים, מסמכים ותזכורות שרצים בראש.",
      "המטרה של Nestly היא לא להוסיף עוד ניהול, אלא להוריד עומס.",
      "כאן אפשר לראות מה חשוב היום, מה מחכה להמשך, ומה כבר טופל.",
      "אפשר לרשום קנייה, לסמן משימה, לשמור קבלה או לזכור תאריך חשוב ברגע אחד.",
      "עם הזמן, Nestly לומדת להפוך את המידע המשפחתי למשהו מסודר, נגיש ושקט יותר.",
      "במצב בסיסי, המידע נשמר במכשיר שלכם בלבד. מה שבבית, נשאר בבית.",
      "וכשיהיה חיבור משפחתי מלא, תוכלו לבחור מה לשתף ועם מי.",
      "Nestly כאן כדי להיות המקום שבו המשפחה פחות מחפשת ויותר רגועה.",
      "בואו נתחיל, צעד קטן אחד בכל פעם.",
    ],
  },
  en: {
    close: "Close welcome",
    eyebrow: "Welcome to Nestly",
    title: "Your family's digital nest",
    intro:
      "A short story about the place where family life becomes calmer and easier to hold.",
    confirm: "Got it, let's start",
    lines: [
      "Nestly comes from Nest: a small warm home where important things stay close.",
      "Every family carries tasks, shopping, payments, documents and reminders in their head.",
      "Nestly is not here to add more management. It is here to reduce the load.",
      "Here you can see what matters today, what can wait and what is already done.",
      "You can add a shopping item, complete a task, save a receipt or remember a date in one moment.",
      "Over time, Nestly turns family information into something organized, reachable and calmer.",
      "In basic mode, your information stays on this device only. What belongs at home stays at home.",
      "When shared family accounts are ready, you will choose what to share and with whom.",
      "Nestly is here so the family searches less and feels more settled.",
      "Let's begin, one small step at a time.",
    ],
  },
} as const;

export default function FirstRunWelcomePopup() {
  const { language, direction } = useLanguage();
  const languageKey = language === "en" ? "en" : "he";
  const text = storyCopy[languageKey] ?? copy[languageKey];
  const [isVisible, setIsVisible] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

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

    confirmButtonRef.current?.focus();

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
      className="fixed inset-0 z-[115] flex items-end justify-center bg-slate-950/38 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-[3px] sm:items-center sm:p-6"
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
          "w-full max-w-[31rem] animate-soft-in overflow-hidden rounded-[30px] border border-white/80 bg-[#fffdf8] text-[#1f2937] shadow-[0_30px_90px_rgba(31,41,55,0.22)]",
          direction === "rtl" ? "text-right" : "text-left",
        ].join(" ")}
        role="dialog"
      >
        <div className="bg-[linear-gradient(135deg,rgba(255,247,237,0.95),rgba(239,246,255,0.9),rgba(250,245,255,0.86))] px-5 pb-4 pt-5 sm:px-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={dismissWelcome}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/80 bg-white/75 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9db4d4]"
              aria-label={text.close}
            >
              <AppIcon name="close" className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7a8aa0]">
                {text.eyebrow}
              </p>
              <h2
                id="first-run-welcome-title"
                className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl"
              >
                {text.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {text.intro}
              </p>
            </div>

            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-white/85 text-[#7a5212] shadow-sm">
              <AppIcon name="home" className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3 sm:px-5">
          <div className="grid gap-2.5">
            {text.lines.map((line, index) => (
              <p
                key={line}
                className={[
                  "flex items-start gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold leading-6 text-slate-700 shadow-[0_1px_0_rgba(226,232,240,0.65)]",
                  index === 0
                    ? "bg-[#fff7e8] text-slate-800"
                    : "bg-white/72",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-2 h-2 w-2 shrink-0 rounded-full",
                    index === 0 ? "bg-[#d8a447]" : "bg-[#d8c8ac]",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  {line}
                </span>
              </p>
            ))}
          </div>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={dismissWelcome}
            className="mt-4 min-h-12 w-full rounded-2xl border border-[#dcc9aa] bg-[#fff7e8] px-5 py-3 text-sm font-black text-[#2f2112] shadow-[0_14px_34px_rgba(126,86,28,0.12)] transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9db4d4]"
          >
            {text.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
