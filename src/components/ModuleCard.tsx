"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { initialBirthdays } from "@/data/birthdays";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import {
  initialDocumentRecords,
  initialFamilyRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import { useLanguage } from "@/i18n/useLanguage";
import { storageKeys } from "@/lib/storageKeys";
import type { AppRoute, NavigationItem } from "@/types/navigation";
import { getDaysUntilBirthday } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

type ModuleCardProps = {
  title: string;
  description: string;
  href: AppRoute;
  status: NavigationItem["status"];
  priority?: boolean;
};

type ModuleVisual = {
  fallbackStat: string;
  icon: AppIconName;
  iconTone: string;
  surface: string;
};

const moduleVisuals: Record<AppRoute, ModuleVisual> = {
  "/": {
    fallbackStat: "מרכז הבית",
    icon: "home",
    iconTone: "text-indigo-700",
    surface: "from-indigo-50 to-white",
  },
  "/dashboard": {
    fallbackStat: "סקירה חכמה",
    icon: "dashboard",
    iconTone: "text-sky-700",
    surface: "from-sky-50 to-white",
  },
  "/finance": {
    fallbackStat: "תזרים ותקציב",
    icon: "finance",
    iconTone: "text-emerald-700",
    surface: "from-emerald-50 to-white",
  },
  "/tasks": {
    fallbackStat: "משימות פתוחות",
    icon: "check",
    iconTone: "text-orange-700",
    surface: "from-orange-50 to-white",
  },
  "/health": {
    fallbackStat: "תורים ומעקב",
    icon: "health",
    iconTone: "text-rose-700",
    surface: "from-rose-50 to-white",
  },
  "/vehicles": {
    fallbackStat: "טיפולים ורישוי",
    icon: "car",
    iconTone: "text-blue-700",
    surface: "from-blue-50 to-white",
  },
  "/documents": {
    fallbackStat: "קבצים ומסמכים",
    icon: "document",
    iconTone: "text-violet-700",
    surface: "from-violet-50 to-white",
  },
  "/birthdays": {
    fallbackStat: "ימי הולדת קרובים",
    icon: "calendar",
    iconTone: "text-pink-700",
    surface: "from-pink-50 to-white",
  },
  "/shopping": {
    fallbackStat: "רשימות פעילות",
    icon: "shopping",
    iconTone: "text-cyan-700",
    surface: "from-cyan-50 to-white",
  },
  "/family": {
    fallbackStat: "בני משפחה",
    icon: "family",
    iconTone: "text-purple-700",
    surface: "from-purple-50 to-white",
  },
  "/permissions": {
    fallbackStat: "שיתוף והרשאות",
    icon: "lock",
    iconTone: "text-amber-700",
    surface: "from-amber-50 to-white",
  },
  "/settings": {
    fallbackStat: "גיבוי והעדפות",
    icon: "settings",
    iconTone: "text-slate-700",
    surface: "from-slate-100 to-white",
  },
};

function getShortDescription(description: string) {
  const firstPart = description.split(",")[0]?.trim();
  return firstPart || description;
}

function getLiveStat(href: AppRoute, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  if (href === "/finance") {
    const transactions = readStorageArray(
      storageKeys.finance,
      initialFinanceTransactions
    );
    const stats = getFinanceStats(transactions);
    return `${stats.balance.toLocaleString("he-IL")} ₪ יתרה`;
  }

  if (href === "/tasks") {
    const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);
    return `${getTaskStats(tasks).openTasks} פתוחות`;
  }

  if (href === "/health") {
    const records = readStorageArray(storageKeys.health, initialHealthRecords);
    return `${records.filter((record) => record.status === "open").length} פתוחים`;
  }

  if (href === "/vehicles") {
    const records = readStorageArray(
      storageKeys.vehicles,
      initialVehicleRecords
    );
    return `${records.filter((record) => record.status === "open").length} תזכורות`;
  }

  if (href === "/documents") {
    const records = readStorageArray(
      storageKeys.documents,
      initialDocumentRecords
    );
    return `${records.length} מסמכים`;
  }

  if (href === "/birthdays") {
    const birthdays = readStorageArray(storageKeys.birthdays, initialBirthdays);
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

    return nextBirthday
      ? `${nextBirthday.name} בעוד ${getDaysUntilBirthday({
          gregorianDate: nextBirthday.gregorianDate,
          calendarType: nextBirthday.calendarType ?? "hebrew",
        })} ימים`
      : fallback;
  }

  if (href === "/shopping") {
    const items = readStorageArray(storageKeys.shopping, initialShoppingItems);
    return `${items.filter((item) => !item.purchased).length} לקנייה`;
  }

  if (href === "/family") {
    const records = readStorageArray(storageKeys.family, initialFamilyRecords);
    return `${records.length} רשומות`;
  }

  return fallback;
}

export default function ModuleCard({
  title,
  description,
  href,
  status,
  priority = false,
}: ModuleCardProps) {
  const { direction } = useLanguage();
  const visual = moduleVisuals[href];
  const [liveStat, setLiveStat] = useState(visual.fallbackStat);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLiveStat(getLiveStat(href, visual.fallbackStat));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [href, visual.fallbackStat]);

  return (
    <Link
      href={href}
      className={[
        `group relative overflow-hidden rounded-[20px] border border-white/80 bg-gradient-to-br ${visual.surface} text-[#1d1d1f] shadow-[0_12px_30px_rgba(33,43,63,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(33,43,63,0.12)]`,
        priority ? "min-h-[86px] p-2.5" : "min-h-[70px] p-2",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="flex h-full items-start gap-2.5">
        <span
          className={`grid shrink-0 place-items-center rounded-2xl border border-white/90 bg-white/95 shadow-sm ${visual.iconTone} ${
            priority ? "h-8 w-8" : "h-7 w-7"
          }`}
        >
          <AppIcon
            name={visual.icon}
            className={priority ? "h-4 w-4" : "h-3.5 w-3.5"}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
              {status}
            </span>
            <h3 className="truncate text-[13px] font-black leading-5 sm:text-sm">
              {title}
            </h3>
          </div>

          {priority && (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-600">
              {getShortDescription(description)}
            </p>
          )}

          <p className="mt-0.5 truncate text-[11px] font-black text-slate-800">
            {liveStat}
          </p>
        </div>
      </div>
    </Link>
  );
}
