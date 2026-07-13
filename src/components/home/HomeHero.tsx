"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import { isDemoModeActive } from "@/lib/demoMode";
import { brand } from "@/lib/branding";
import { storageKeys } from "@/lib/storageKeys";
import { formatHebrewDate } from "@/utils/hebrewDate";
import { readStorageArray } from "@/utils/storage";

type HeroData = {
  balance: number;
  openTasks: number;
  itemsToBuy: number;
  overdueAmount: number;
  isDemo: boolean;
};

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

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 17) return "צהריים טובים";
  if (hour >= 17 && hour < 22) return "ערב טוב";
  return "לילה טוב";
}

function getTodayLabel() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const hebrew = formatHebrewDate(now, "");

  return hebrew ? `${weekday} · ${hebrew}` : weekday;
}

export default function HomeHero() {
  const [data, setData] = useState<HeroData | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setData(readHeroData()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const statusText =
    data === null
      ? "רגע, בודקים מה קורה בבית…"
      : data.overdueAmount > 0
        ? `יש תשלום באיחור של ₪${data.overdueAmount.toLocaleString("he-IL")} — שווה להציץ`
        : data.openTasks > 0
          ? `${data.openTasks} משימות פתוחות — נתחיל מהחשובה ביותר?`
          : "הכול מסודר להיום. איזה כיף 🙂";

  const stats = [
    {
      id: "balance",
      href: "/finance" as const,
      icon: "finance" as const,
      label: "יתרה",
      value: `₪${(data?.balance ?? 0).toLocaleString("he-IL")}`,
      chipClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      valueClass: "text-emerald-800",
    },
    {
      id: "tasks",
      href: "/tasks" as const,
      icon: "check" as const,
      label: "משימות",
      value: `${data?.openTasks ?? 0} פתוחות`,
      chipClass: "bg-amber-50 text-amber-700 ring-amber-100",
      valueClass: "text-[#111827]",
    },
    {
      id: "shopping",
      href: "/shopping" as const,
      icon: "shopping" as const,
      label: "קניות",
      value: `${data?.itemsToBuy ?? 0} לקנייה`,
      chipClass: "bg-sky-50 text-sky-700 ring-sky-100",
      valueClass: "text-[#111827]",
    },
  ];

  return (
    <section className="nestly-hero rounded-[24px] p-4 text-right">
      <p className="text-[11px] font-bold text-[#8a5a10]">{getTodayLabel()}</p>
      <h1 className="mt-1 text-2xl font-black leading-8 text-[#111827]">
        {getGreeting()},{" "}
        {data?.isDemo ? brand.demoWorkspaceName : brand.workspaceName}
      </h1>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
        {statusText}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {stats.map((stat) => (
          <Link
            key={stat.id}
            href={stat.href}
            className="rounded-2xl bg-white/85 p-2 text-right shadow-sm ring-1 ring-[#e3d8c9]/60 transition hover:-translate-y-0.5 hover:bg-white"
          >
            <span className="flex items-center justify-end gap-1.5">
              <span className="text-[11px] font-bold text-slate-600">
                {stat.label}
              </span>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 ${stat.chipClass}`}
              >
                <AppIcon name={stat.icon} className="h-3.5 w-3.5" />
              </span>
            </span>
            <span
              className={`mt-1 block truncate text-sm font-extrabold tabular-nums ${stat.valueClass}`}
            >
              {stat.value}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
