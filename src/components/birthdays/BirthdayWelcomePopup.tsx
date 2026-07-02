"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { initialBirthdays } from "@/data/birthdays";
import { storageKeys } from "@/lib/storageKeys";
import type { BirthdayPerson } from "@/types/birthdays";
import { readStorageArray } from "@/utils/storage";

type UpcomingBirthday = BirthdayPerson & {
  age: number;
  daysUntil: number;
};

const dismissedStoragePrefix = "nestly-birthday-popup-dismissed";

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function getDaysUntilAnnualDate(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sourceDate = new Date(date);
  const targetDate = new Date(
    today.getFullYear(),
    sourceDate.getMonth(),
    sourceDate.getDate()
  );
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate < today) {
    targetDate.setFullYear(today.getFullYear() + 1);
  }

  return Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getNextAge(date: string, daysUntil: number) {
  const sourceDate = new Date(date);
  const today = new Date();
  const birthdayYear = daysUntil === 0 ? today.getFullYear() : today.getFullYear();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    sourceDate.getMonth(),
    sourceDate.getDate()
  );

  const targetYear =
    birthdayThisYear < new Date(today.getFullYear(), today.getMonth(), today.getDate())
      ? birthdayYear + 1
      : birthdayYear;

  return targetYear - sourceDate.getFullYear();
}

function getUpcomingBirthdays(): UpcomingBirthday[] {
  const birthdays = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );

  return birthdays
    .map((birthday) => {
      const daysUntil = getDaysUntilAnnualDate(birthday.gregorianDate);

      return {
        ...birthday,
        age: getNextAge(birthday.gregorianDate, daysUntil),
        daysUntil,
      };
    })
    .filter((birthday) => birthday.daysUntil <= 7)
    .sort((first, second) => first.daysUntil - second.daysUntil);
}

function getTimingText(daysUntil: number) {
  if (daysUntil === 0) {
    return "היום";
  }

  if (daysUntil === 1) {
    return "מחר";
  }

  return `עוד ${daysUntil} ימים`;
}

export default function BirthdayWelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(), []);
  const highlightedBirthday = upcomingBirthdays[0];

  useEffect(() => {
    if (!highlightedBirthday) {
      return;
    }

    const todayKey = getTodayKey();
    const dismissedKey = `${dismissedStoragePrefix}-${todayKey}`;

    if (window.localStorage.getItem(dismissedKey) === "true") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedBirthday]);

  function closeForNow() {
    setIsVisible(false);
  }

  function closeForToday() {
    window.localStorage.setItem(
      `${dismissedStoragePrefix}-${getTodayKey()}`,
      "true"
    );
    setIsVisible(false);
  }

  if (!highlightedBirthday || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/20 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeForNow();
        }
      }}
    >
      <section
        aria-labelledby="birthday-popup-title"
        aria-modal="true"
        className="w-full max-w-md animate-soft-in rounded-[26px] border border-[#e6e8ec] bg-white p-4 text-right text-[#1d1d1f] shadow-[0_28px_90px_rgba(15,23,42,0.18)]"
        role="dialog"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={closeForNow}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#e6e8ec] bg-[#fafafb] text-sm font-black text-slate-700 transition hover:bg-white"
            aria-label="סגור"
          >
            x
          </button>

          <div>
            <p className="text-xs font-bold text-[#007aff]">
              תזכורת משפחתית
            </p>
            <h2
              id="birthday-popup-title"
              className="mt-1 text-xl font-black text-[#1d1d1f]"
            >
              יום הולדת קרוב
            </h2>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#e6e8ec] bg-[#fafafb] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-[#111827] px-3 py-1.5 text-xs font-black text-white">
              {getTimingText(highlightedBirthday.daysUntil)}
            </span>
            <div>
              <p className="text-2xl font-black text-[#111827]">
                {highlightedBirthday.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {highlightedBirthday.relationship} · גיל {highlightedBirthday.age}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-bold text-slate-500">תאריך עברי</p>
              <p className="mt-1 font-black text-[#1d1d1f]">
                {highlightedBirthday.hebrewDate || "לא הוזן"}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-bold text-slate-500">תאריך לועזי</p>
              <p className="mt-1 font-black text-[#1d1d1f]">
                {new Intl.DateTimeFormat("he-IL", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(highlightedBirthday.gregorianDate))}
              </p>
            </div>
          </div>
        </div>

        {upcomingBirthdays.length > 1 && (
          <p className="mt-3 rounded-2xl bg-[#f6f7f9] px-3 py-2 text-sm font-semibold text-slate-700">
            יש עוד {upcomingBirthdays.length - 1} ימי הולדת קרובים השבוע.
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            href="/birthdays"
            onClick={closeForToday}
            className="flex min-h-11 items-center justify-center rounded-2xl bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1f2937] sm:col-span-2"
          >
            פתח ימי הולדת
          </Link>
          <button
            type="button"
            onClick={closeForToday}
            className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-[#fafafb]"
          >
            סגור להיום
          </button>
        </div>
      </section>
    </div>
  );
}
