"use client";

import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { initialFinanceTransactions } from "@/data/finance";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray } from "@/utils/storage";

type SummaryData = {
  balance: number;
  overdueAmount: number;
  openTasks: number;
};

function readSummaryData(): SummaryData {
  const transactions = readStorageArray(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  // מאזן החודש הנוכחי בלבד, ורק פעולות שבוצעו — לא תחזיות עתידיות.
  const monthBalance = transactions
    .filter(
      (item) => item.status === "done" && item.date.startsWith(currentMonth)
    )
    .reduce(
      (sum, item) => sum + (item.type === "income" ? item.amount : -item.amount),
      0
    );

  const overdueAmount = transactions
    .filter((item) => item.status === "pending" && item.date < today)
    .reduce((sum, item) => sum + item.amount, 0);
  const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);

  return {
    balance: monthBalance,
    overdueAmount,
    openTasks: getTaskStats(tasks).openTasks,
  };
}

export default function HomeSummaryCard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setSummary(readSummaryData()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const hasAttention =
    (summary?.overdueAmount ?? 0) > 0 || (summary?.openTasks ?? 0) > 0;

  return (
    <section className="rounded-[22px] border border-emerald-100 bg-gradient-to-l from-emerald-50/80 to-white p-4 text-right shadow-[0_10px_26px_rgba(16,88,64,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-left" dir="ltr">
          <p className="text-[11px] font-bold text-slate-500" dir="rtl">
            מאזן החודש
          </p>
          <p className="text-xl font-black tabular-nums text-emerald-800">
            ₪{(summary?.balance ?? 0).toLocaleString("he-IL")}
          </p>
          {summary !== null && summary.overdueAmount > 0 && (
            <p className="text-[11px] font-bold text-amber-700" dir="rtl">
              באיחור · ₪{summary.overdueAmount.toLocaleString("he-IL")}
            </p>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-[#111827]">
              מצב המשפחה
            </h2>
            <p className="truncate text-sm font-semibold text-slate-600">
              {summary === null
                ? "טוען…"
                : hasAttention
                  ? `${summary.openTasks} משימות פתוחות${summary.overdueAmount > 0 ? " · תשלום באיחור" : ""}`
                  : "הכול מסודר להיום"}
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <AppIcon name="home" className="h-5 w-5" />
          </span>
        </div>
      </div>
    </section>
  );
}
