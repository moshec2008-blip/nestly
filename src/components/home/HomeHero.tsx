"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";
import { isDemoModeActive } from "@/lib/demoMode";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray } from "@/utils/storage";

type HeroData = {
  balance: number;
  openTasks: number;
  itemsToBuy: number;
  overdueAmount: number;
  isDemo: boolean;
};

const copyByLanguage = {
  he: {
    updatedAt: "נכון ל-",
    checking: "רגע, בודקים מה קורה בבית...",
    overdue: (amount: string) => `תשלום באיחור של ${amount} מחכה לטיפול`,
    openTasks: (count: number) => `${count} משימות פתוחות מחכות להיום`,
    calm: "הכול מסודר. אפשר להתחיל רגוע.",
    subtitle: "הנה מה שמחכה לך היום",
    balance: "יתרה",
    tasks: "משימות",
    shopping: "קניות",
    open: "פתוחות",
    toBuy: "לקנייה",
    greetings: {
      morning: "בוקר טוב",
      noon: "צהריים טובים",
      evening: "ערב טוב",
      night: "לילה טוב",
    },
  },
  en: {
    updatedAt: "Updated ",
    checking: "One moment, checking what matters at home...",
    overdue: (amount: string) => `${amount} overdue payment needs attention`,
    openTasks: (count: number) =>
      `${count} open ${count === 1 ? "task" : "tasks"} for today`,
    calm: "Everything looks calm. You can start easy.",
    subtitle: "Here is what is waiting for you today",
    balance: "Balance",
    tasks: "Tasks",
    shopping: "Shopping",
    open: "open",
    toBuy: "to buy",
    greetings: {
      morning: "Good morning",
      noon: "Good afternoon",
      evening: "Good evening",
      night: "Good night",
    },
  },
} as const;

function getCopy(language: AppLanguage) {
  return language === "en" ? copyByLanguage.en : copyByLanguage.he;
}

function getLocale(language: AppLanguage) {
  return language === "en" ? "en-US" : "he-IL";
}

function formatCurrency(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function readHeroData(): HeroData {
  const transactions = readStorageArray(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const today = new Date().toISOString().slice(0, 10);
  const overdueAmount = transactions
    .filter((item) => item.status === "pending" && item.date < today)
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    balance: getFinanceStats(transactions).balance,
    openTasks: getTaskStats(
      readStorageArray(storageKeys.tasks, initialFamilyTasks)
    ).openTasks,
    itemsToBuy: readStorageArray(
      storageKeys.shopping,
      initialShoppingItems
    ).filter((item) => !item.purchased).length,
    overdueAmount,
    isDemo: isDemoModeActive(),
  };
}

function getGreeting(language: AppLanguage) {
  const copy = getCopy(language);
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return copy.greetings.morning;
  if (hour >= 12 && hour < 17) return copy.greetings.noon;
  if (hour >= 17 && hour < 22) return copy.greetings.evening;
  return copy.greetings.night;
}

function getTodayLabel(language: AppLanguage) {
  return new Intl.DateTimeFormat(getLocale(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function getTimeLabel(language: AppLanguage) {
  return new Intl.DateTimeFormat(getLocale(language), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export default function HomeHero() {
  const { language, direction } = useLanguage();
  const copy = getCopy(language);
  const [data, setData] = useState<HeroData | null>(null);
  const [timeLabel, setTimeLabel] = useState("--:--");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setData(readHeroData()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const updateTimeLabel = () => setTimeLabel(getTimeLabel(language));
    const timeoutId = window.setTimeout(updateTimeLabel, 0);
    const intervalId = window.setInterval(updateTimeLabel, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [language]);

  const statusText =
    data === null
      ? copy.checking
      : data.overdueAmount > 0
        ? copy.overdue(formatCurrency(data.overdueAmount, language))
        : data.openTasks > 0
          ? copy.openTasks(data.openTasks)
          : copy.calm;

  const stats = [
    {
      id: "balance",
      href: "/finance" as const,
      icon: "finance" as const,
      label: copy.balance,
      value: formatCurrency(data?.balance ?? 0, language),
      chipClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      valueClass: "text-emerald-800",
    },
    {
      id: "tasks",
      href: "/tasks" as const,
      icon: "check" as const,
      label: copy.tasks,
      value: `${data?.openTasks ?? 0} ${copy.open}`,
      chipClass: "bg-amber-50 text-amber-700 ring-amber-100",
      valueClass: "text-[#111827]",
    },
    {
      id: "shopping",
      href: "/shopping" as const,
      icon: "shopping" as const,
      label: copy.shopping,
      value: `${data?.itemsToBuy ?? 0} ${copy.toBuy}`,
      chipClass: "bg-sky-50 text-sky-700 ring-sky-100",
      valueClass: "text-[#111827]",
    },
  ];

  return (
    <section className="relative w-full max-w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-white/96 via-[#fff8eb]/88 to-[#eef7ff]/76 p-5 shadow-[0_18px_46px_rgba(33,43,63,0.075)] backdrop-blur-xl sm:p-6">
      <span
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-[#d8b470]/50 to-transparent"
        aria-hidden="true"
      />
      <div
        className={[
          "relative min-w-0",
          direction === "rtl" ? "text-right" : "text-left",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-8 shrink-0 items-center rounded-2xl bg-white/62 px-3 text-[11px] font-black tabular-nums text-slate-600 shadow-[0_8px_18px_rgba(33,43,63,0.045)]">
            {copy.updatedAt}
            {timeLabel}
          </span>
          <p className="min-w-0 truncate text-[11px] font-bold text-slate-400">
            {getTodayLabel(language)}
          </p>
        </div>
        <h1 className="mt-2 text-[27px] font-black leading-8 text-[#0f172a]">
          {getGreeting(language)}
        </h1>
        <p className="mt-1 max-w-[20rem] text-sm font-black leading-5 text-[#111827]">
          {copy.subtitle}
        </p>
        <p className="mt-1.5 max-w-[21rem] text-[13px] font-semibold leading-5 text-slate-500">
          {statusText}
        </p>
        <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">
          {data?.isDemo ? brand.demoWorkspaceName : brand.workspaceName}
        </p>
      </div>

      <div className="relative mt-5 grid min-w-0 grid-cols-3 gap-2">
        {stats.map((stat) => (
          <Link
            key={stat.id}
            href={stat.href}
            className="min-w-0 rounded-[18px] bg-white/56 px-2 py-2.5 text-center shadow-[0_8px_18px_rgba(33,43,63,0.035)] transition duration-200 hover:bg-white/82 active:scale-[0.99]"
          >
            <span
              className={`mx-auto grid h-7 w-7 place-items-center rounded-xl ${stat.chipClass}`}
            >
              <AppIcon name={stat.icon} className="h-4 w-4" />
            </span>
            <span className="mt-1.5 block text-[10px] font-bold text-slate-400">
              {stat.label}
            </span>
            <span
              className={`mt-0.5 block truncate text-[13px] font-black tabular-nums ${stat.valueClass}`}
            >
              {stat.value}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
