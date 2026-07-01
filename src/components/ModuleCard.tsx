"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { storageKeys } from "@/lib/storageKeys";
import type { AppRoute, NavigationItem } from "@/types/navigation";
import { readStorageArray } from "@/utils/storage";
import { useLanguage } from "@/i18n/useLanguage";

type ModuleCardProps = {
  title: string;
  description: string;
  href: AppRoute;
  status: NavigationItem["status"];
};

type ModuleVisual = {
  icon: string;
  fallbackStat: string;
  accent: string;
  glow: string;
  ring: string;
};

const moduleVisuals: Record<AppRoute, ModuleVisual> = {
  "/": {
    icon: "⌂",
    fallbackStat: "מרכז הבית",
    accent: "from-indigo-400/30 via-indigo-500/12 to-white/[0.04]",
    glow: "bg-indigo-400/30",
    ring: "ring-indigo-300/20",
  },
  "/finance": {
    icon: "₪",
    fallbackStat: "תזרים ותקציב",
    accent: "from-emerald-400/30 via-emerald-500/12 to-white/[0.04]",
    glow: "bg-emerald-400/30",
    ring: "ring-emerald-300/20",
  },
  "/tasks": {
    icon: "✓",
    fallbackStat: "משימות פתוחות",
    accent: "from-orange-400/30 via-orange-500/12 to-white/[0.04]",
    glow: "bg-orange-400/30",
    ring: "ring-orange-300/20",
  },
  "/health": {
    icon: "♥",
    fallbackStat: "תורים ומעקב",
    accent: "from-rose-400/30 via-rose-500/12 to-white/[0.04]",
    glow: "bg-rose-400/30",
    ring: "ring-rose-300/20",
  },
  "/vehicles": {
    icon: "🚗",
    fallbackStat: "טיפולים ורישוי",
    accent: "from-blue-400/30 via-blue-500/12 to-white/[0.04]",
    glow: "bg-blue-400/30",
    ring: "ring-blue-300/20",
  },
  "/documents": {
    icon: "□",
    fallbackStat: "קבצים ומסמכים",
    accent: "from-violet-400/30 via-violet-500/12 to-white/[0.04]",
    glow: "bg-violet-400/30",
    ring: "ring-violet-300/20",
  },
  "/birthdays": {
    icon: "✦",
    fallbackStat: "ימי הולדת קרובים",
    accent: "from-pink-400/30 via-pink-500/12 to-white/[0.04]",
    glow: "bg-pink-400/30",
    ring: "ring-pink-300/20",
  },
  "/shopping": {
    icon: "🛒",
    fallbackStat: "רשימות פעילות",
    accent: "from-cyan-400/30 via-cyan-500/12 to-white/[0.04]",
    glow: "bg-cyan-400/30",
    ring: "ring-cyan-300/20",
  },
  "/family": {
    icon: "👥",
    fallbackStat: "בני משפחה",
    accent: "from-purple-400/30 via-purple-500/12 to-white/[0.04]",
    glow: "bg-purple-400/30",
    ring: "ring-purple-300/20",
  },
  "/permissions": {
    icon: "◈",
    fallbackStat: "שיתוף והרשאות",
    accent: "from-amber-400/30 via-amber-500/12 to-white/[0.04]",
    glow: "bg-amber-400/30",
    ring: "ring-amber-300/20",
  },
  "/dashboard": {
    icon: "⌁",
    fallbackStat: "סקירה חכמה",
    accent: "from-indigo-400/30 via-sky-500/12 to-white/[0.04]",
    glow: "bg-indigo-400/30",
    ring: "ring-sky-300/20",
  },
  "/settings": {
    icon: "⚙",
    fallbackStat: "גיבוי והעדפות",
    accent: "from-slate-300/24 via-slate-400/10 to-white/[0.04]",
    glow: "bg-slate-300/24",
    ring: "ring-slate-200/15",
  },
};

function getShortDescription(description: string) {
  const firstPart = description.split(",")[0]?.trim();
  return firstPart || description;
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
    const tasks = readStorageArray(
      storageKeys.tasks,
      initialFamilyTasks
    );
    return `${getTaskStats(tasks).openTasks} פתוחות`;
  }

  if (href === "/health") {
    const records = readStorageArray(
      storageKeys.health,
      initialHealthRecords
    );
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
    const birthdays = readStorageArray(
      storageKeys.birthdays,
      initialBirthdays
    );
    const nextBirthday = [...birthdays].sort(
      (a, b) =>
        getDaysUntilAnnualDate(a.gregorianDate) -
        getDaysUntilAnnualDate(b.gregorianDate)
    )[0];
    return nextBirthday
      ? `${nextBirthday.name} בעוד ${getDaysUntilAnnualDate(
          nextBirthday.gregorianDate
        )} ימים`
      : fallback;
  }

  if (href === "/shopping") {
    const items = readStorageArray(
      storageKeys.shopping,
      initialShoppingItems
    );
    return `${items.filter((item) => !item.purchased).length} לקנייה`;
  }

  if (href === "/family") {
    const records = readStorageArray(
      storageKeys.family,
      initialFamilyRecords
    );
    return `${records.length} רשומות`;
  }

  return fallback;
}

export default function ModuleCard({
  title,
  description,
  href,
  status,
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
        `group relative min-h-[74px] overflow-hidden rounded-[18px] border border-[#e6e8ec] bg-white p-2 text-[#1d1d1f] shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]`,
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <span
        className={`pointer-events-none absolute -left-10 -top-12 h-20 w-20 rounded-full ${visual.glow} opacity-25 blur-3xl transition duration-500 group-hover:scale-110`}
      />

      <div className="relative flex h-full items-start gap-2">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-[14px] ${visual.glow} text-sm font-black text-[#1d1d1f] transition duration-300 group-hover:scale-105`}
          aria-hidden="true"
        >
          {visual.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {status}
            </span>
            <h3 className="truncate text-[13px] font-black leading-5">{title}</h3>
          </div>

          <p className="hidden line-clamp-1 text-[11px] leading-4 text-slate-500 min-[430px]:block">
            {getShortDescription(description)}
          </p>

          <p
            className={[
              "mt-1 flex items-center gap-2 truncate text-[10px] font-bold text-slate-700 sm:text-[11px]",
              direction === "rtl" ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#007aff]/70" />
            {liveStat}
          </p>
        </div>
      </div>
    </Link>
  );
}
