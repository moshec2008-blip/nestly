"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { initialBirthdays } from "@/data/birthdays";
import {
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import type { BirthdayPerson } from "@/types/birthdays";
import { getDaysUntilBirthday } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

type SmartNudge = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: AppIconName;
  toneClassName: string;
};

const nudgeDelayMs = 4500;
const nudgeAutoCloseMs = 9000;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getSmartNudge(): SmartNudge | null {
  if (typeof window === "undefined") {
    return null;
  }

  const today = getTodayKey();
  const tasks = readStorageArray<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  );
  const financeTransactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const birthdays = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );

  const urgentTask = [...tasks]
    .filter((task) => task.status === "open" && task.dueDate <= today)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === "high" ? -1 : 1;
      }

      return a.dueDate.localeCompare(b.dueDate);
    })[0];

  if (urgentTask) {
    return {
      id: `task-${urgentTask.id}-${today}`,
      title: "משימה שמחכה לך",
      description: urgentTask.title,
      href: "/tasks",
      actionLabel: "פתח משימות",
      icon: "check",
      toneClassName: "bg-orange-50 text-orange-700",
    };
  }

  const pendingPayment = financeTransactions.find(
    (transaction) => transaction.status === "pending"
  );

  if (pendingPayment) {
    return {
      id: `finance-${pendingPayment.id}-${today}`,
      title: "תשלום דורש תשומת לב",
      description: pendingPayment.title,
      href: "/finance",
      actionLabel: "פתח כספים",
      icon: "finance",
      toneClassName: "bg-emerald-50 text-emerald-700",
    };
  }

  const nextBirthday = [...birthdays].sort(
    (first, second) =>
      getDaysUntilBirthday({
        gregorianDate: first.gregorianDate,
        calendarType: first.calendarType ?? "hebrew",
      }) -
      getDaysUntilBirthday({
        gregorianDate: second.gregorianDate,
        calendarType: second.calendarType ?? "hebrew",
      })
  )[0];

  if (
    nextBirthday &&
    getDaysUntilBirthday({
      gregorianDate: nextBirthday.gregorianDate,
      calendarType: nextBirthday.calendarType ?? "hebrew",
    }) <= 14
  ) {
    return {
      id: `birthday-${nextBirthday.id}-${today}`,
      title: "יום הולדת מתקרב",
      description: `${nextBirthday.name} בעוד ${getDaysUntilBirthday({
        gregorianDate: nextBirthday.gregorianDate,
        calendarType: nextBirthday.calendarType ?? "hebrew",
      })} ימים`,
      href: "/birthdays",
      actionLabel: "פתח ימי הולדת",
      icon: "calendar",
      toneClassName: "bg-pink-50 text-pink-700",
    };
  }

  return {
    id: `documents-tip-${today}`,
    title: "טיפ קטן לסדר בבית",
    description: "אפשר לצרף מסמך, לסרוק מהטלפון ולהכין תיוק חכם.",
    href: "/documents",
    actionLabel: "פתח מסמכים",
    icon: "document",
    toneClassName: "bg-violet-50 text-violet-700",
  };
}

export default function SmartNudgePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const nudge = useMemo(() => getSmartNudge(), []);

  useEffect(() => {
    if (!nudge || typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(storageKeys.smartNudge);

    if (storedValue === nudge.id) {
      return;
    }

    const openTimeoutId = window.setTimeout(() => {
      setIsVisible(true);
      window.localStorage.setItem(storageKeys.smartNudge, nudge.id);
    }, nudgeDelayMs);

    return () => window.clearTimeout(openTimeoutId);
  }, [nudge]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const closeTimeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, nudgeAutoCloseMs);

    return () => window.clearTimeout(closeTimeoutId);
  }, [isVisible]);

  if (!nudge || !isVisible || isDismissed) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 left-4 z-50 w-[min(22rem,calc(100vw-2rem))] animate-soft-in rounded-[24px] border border-white/80 bg-white/94 p-3 text-right shadow-[0_24px_70px_rgba(33,43,63,0.18)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            setIsVisible(false);
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] text-sm font-black text-slate-600 transition hover:bg-white"
          aria-label="סגור המלצה"
        >
          x
        </button>

        <div className="flex min-w-0 flex-1 items-start justify-end gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">{nudge.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
              {nudge.description}
            </p>
          </div>
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${nudge.toneClassName}`}
          >
            <AppIcon name={nudge.icon} className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setIsDismissed(true);
            setIsVisible(false);
          }}
          className="min-h-10 rounded-2xl px-3 text-xs font-black text-slate-500 transition hover:bg-[#fff8eb]"
        >
          לא עכשיו
        </button>
        <Link
          href={nudge.href}
          onClick={() => {
            setIsDismissed(true);
            setIsVisible(false);
          }}
          className="min-h-10 rounded-2xl bg-[#111827] px-4 py-2.5 text-xs font-black text-white shadow-[0_12px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
        >
          {nudge.actionLabel}
        </Link>
      </div>
    </aside>
  );
}
