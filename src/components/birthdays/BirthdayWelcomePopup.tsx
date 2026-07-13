"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { initialBirthdays } from "@/data/birthdays";
import { storageKeys } from "@/lib/storageKeys";
import type { BirthdayPerson } from "@/types/birthdays";
import {
  formatBirthdayDate,
  formatHebrewDate,
  getBirthdayDateViewMode,
  type BirthdayDateViewMode,
} from "@/utils/hebrewDate";
import {
  getDaysUntilBirthday,
  normalizeFamilyEvent,
} from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

const dismissedStoragePrefix = "nestly-birthday-popup-dismissed";

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
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

type BirthdayDisplayGroup = {
  id: string;
  name: string;
  relationship: string;
  gregorianDate: string;
  hebrewDate: string;
  age: number;
  daysUntil: number;
  reminders: BirthdayPerson["reminders"];
  members: BirthdayPerson[];
};

function groupUpcomingBirthdays(birthdays: BirthdayPerson[]): BirthdayDisplayGroup[] {
  const groupedBirthdays = birthdays.reduce<Map<string, BirthdayPerson[]>>(
    (groups, birthday) => {
      const group = groups.get(birthday.gregorianDate);

      if (group) {
        group.push(birthday);
      } else {
        groups.set(birthday.gregorianDate, [birthday]);
      }

      return groups;
    },
    new Map()
  );

  return Array.from(groupedBirthdays.entries())
    .map(([date, members]) => {
      const primaryMember = members[0];
      const daysUntil = getDaysUntilBirthday({
        gregorianDate: date,
        calendarType: primaryMember.calendarType ?? "hebrew",
      });
      const names = members.map((member) => member.name);

      return {
        id: `${date}-${names.join("-")}`,
        name: names.length > 1 ? names.join(" ו") : primaryMember.name,
        relationship: primaryMember.relationship,
        gregorianDate: date,
        hebrewDate: primaryMember.hebrewDate,
        age: getNextAge(date, daysUntil),
        daysUntil,
        calendarType: primaryMember.calendarType ?? "hebrew",
        reminders: Array.from(new Set(members.flatMap((member) => member.reminders))),
        members,
      };
    })
    .filter((birthday) => birthday.daysUntil <= 7)
    .sort((first, second) => first.daysUntil - second.daysUntil);
}

function getUpcomingBirthdays(): BirthdayDisplayGroup[] {
  const birthdays = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );

  // הפופאפ חוגג ימי הולדת בלבד — יארצייט או יום נישואין לא שייכים לכאן.
  const birthdayEvents = birthdays.filter(
    (event) => normalizeFamilyEvent(event).eventType === "birthday"
  );

  return groupUpcomingBirthdays(birthdayEvents);
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
  const [dateViewMode] = useState<BirthdayDateViewMode>(() => getBirthdayDateViewMode());
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
              <p className="text-xs font-bold text-slate-500">
                {dateViewMode === "hebrew" ? "תאריך עברי" : "תאריך לועזי"}
              </p>
              <p className="mt-1 font-black text-[#1d1d1f]">
                {formatBirthdayDate(
                  highlightedBirthday.gregorianDate,
                  dateViewMode,
                  dateViewMode === "hebrew" ? "לא הוזן" : "לא הוזן"
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <p className="text-xs font-bold text-slate-500">
                {dateViewMode === "hebrew" ? "תאריך לועזי" : "תאריך עברי"}
              </p>
              <p className="mt-1 font-black text-[#1d1d1f]">
                {dateViewMode === "hebrew"
                  ? new Intl.DateTimeFormat("he-IL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(highlightedBirthday.gregorianDate))
                  : highlightedBirthday.hebrewDate || formatHebrewDate(highlightedBirthday.gregorianDate, "לא הוזן")}
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
