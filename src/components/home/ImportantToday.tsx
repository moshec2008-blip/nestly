"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import type { AppRoute } from "@/types/navigation";
import { readStorageArray } from "@/utils/storage";

type ImportantRow = {
  id: string;
  icon: AppIconName;
  iconClass: string;
  title: string;
  subtitle: string;
  href: AppRoute;
};

type HomeInsight = {
  text: string;
  href: AppRoute;
};

type ImportantData = {
  rows: ImportantRow[];
  insight: HomeInsight | null;
};

function readImportantData(): ImportantData {
  const rows: ImportantRow[] = [];
  let insight: HomeInsight | null = null;

  const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);
  const openTasks = getTaskStats(tasks).openTasks;

  if (openTasks > 0) {
    rows.push({
      id: "tasks",
      icon: "check",
      iconClass: "bg-amber-50 text-amber-600 ring-amber-100",
      title: `${openTasks} משימות חשובות פתוחות`,
      subtitle: tasks.find((task) => task.status === "open")?.title ?? "",
      href: "/tasks",
    });
  }

  const shoppingItems = readStorageArray(
    storageKeys.shopping,
    initialShoppingItems
  ).filter((item) => !item.purchased);

  if (shoppingItems.length > 0) {
    rows.push({
      id: "shopping",
      icon: "shopping",
      iconClass: "bg-sky-50 text-sky-600 ring-sky-100",
      title: `${shoppingItems.length} פריטים לקנייה`,
      subtitle: "הקנייה הבאה מתחילה כאן",
      href: "/shopping",
    });
  }

  const transactions = readStorageArray(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const today = new Date().toISOString().slice(0, 10);
  const overdue = transactions
    .filter((item) => item.status === "pending" && item.date < today)
    .sort((first, second) => first.date.localeCompare(second.date))[0];

  if (overdue) {
    rows.push({
      id: "overdue",
      icon: "finance",
      iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
      title: overdue.title,
      subtitle: `באיחור · ₪${overdue.amount.toLocaleString("he-IL")}`,
      href: "/finance",
    });
    insight = {
      text: `${overdue.title} באיחור · ₪${overdue.amount.toLocaleString("he-IL")} — אפשר לסמן כשולם או לקבוע תזכורת.`,
      href: "/finance",
    };
  } else {
    const stats = getFinanceStats(transactions);
    insight = {
      text:
        openTasks > 0
          ? `נשארו ${openTasks} משימות פתוחות — נתחיל מהחשובה ביותר?`
          : `הכול מעודכן. היתרה החודשית: ₪${stats.balance.toLocaleString("he-IL")}.`,
      href: openTasks > 0 ? "/tasks" : "/finance",
    };
  }

  return { rows, insight };
}

export function NestlyAiInsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <section className="rounded-[22px] border border-violet-100 bg-gradient-to-l from-violet-50/90 to-white p-4 text-right shadow-[0_10px_26px_rgba(76,29,149,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={insight.href}
          className="nestly-primary-action grid min-h-10 shrink-0 place-items-center rounded-2xl px-4 py-2 text-xs font-black transition hover:opacity-90"
        >
          פתח עכשיו
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-black text-violet-900">Nestly AI</h2>
            <p className="mt-0.5 text-sm font-semibold leading-5 text-slate-700">
              {insight.text}
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-violet-100">
            <AppIcon name="spark" className="h-5 w-5" />
          </span>
        </div>
      </div>
    </section>
  );
}

export default function ImportantToday() {
  const [data, setData] = useState<ImportantData | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setData(readImportantData()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <section className="rounded-[22px] border border-[#eadfcd]/80 bg-white/90 p-4 text-right shadow-[0_10px_26px_rgba(33,43,63,0.05)]">
        <h2 className="text-base font-black text-[#111827]">היום חשוב</h2>

        {data === null ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">טוען…</p>
        ) : data.rows.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-slate-600">
            אין משימות דחופות להיום — נהנים מהשקט 🙂
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[#f0ece3]">
            {data.rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="group flex min-h-14 items-center justify-between gap-3 rounded-xl py-2.5 transition hover:bg-[#fffdf8]"
                >
                  <span className="flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-[#dbe3ef] bg-white px-3.5 text-xs font-black text-[#007aff] shadow-sm transition group-hover:border-[#007aff]/40">
                    פתח
                    <span aria-hidden="true">‹</span>
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-3">
                    <span className="min-w-0 text-right">
                      <span className="block truncate text-sm font-black text-[#111827]">
                        {row.title}
                      </span>
                      {row.subtitle && (
                        <span className="block truncate text-xs font-semibold text-slate-600">
                          {row.subtitle}
                        </span>
                      )}
                    </span>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${row.iconClass}`}
                    >
                      <AppIcon name={row.icon} className="h-5 w-5" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data?.insight && <NestlyAiInsightCard insight={data.insight} />}
    </>
  );
}
