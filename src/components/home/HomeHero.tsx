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
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
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
          : "הכול מסודר להיום. אפשר להתחיל בשקט.";

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
    <section className="relative overflow-hidden rounded-[26px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_42px_rgba(33,43,63,0.085)] ring-1 ring-[#eadfcd]/65 backdrop-blur-xl">
      <span
        className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-sky-100/40 blur-2xl"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -bottom-14 right-1 h-32 w-32 rounded-full bg-emerald-100/36 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative min-w-0 text-right">
        <p className="truncate text-[11px] font-bold text-slate-400">
          {getTodayLabel()}
        </p>
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
          Family Dashboard
        </p>
        <h1 className="mt-1 max-w-[16rem] text-[25px] font-black leading-8 text-[#0f172a]">
          {data?.isDemo ? brand.demoWorkspaceName : brand.workspaceName}
        </h1>
        <p className="mt-1.5 max-w-[20rem] text-[13px] font-semibold leading-5 text-slate-500">
          <span className="font-black text-[#111827]">{getGreeting()}</span>
          <span className="mx-1 text-slate-300">·</span>
          {statusText}
        </p>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <Link
            key={stat.id}
            href={stat.href}
            className="rounded-[18px] bg-[#fafafb]/92 p-2.5 text-center ring-1 ring-[#e6e8ec]/65 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.08)]"
          >
            <span
              className={`mx-auto grid h-8 w-8 place-items-center rounded-2xl ring-1 ${stat.chipClass}`}
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
