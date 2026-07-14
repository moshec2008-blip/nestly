"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { initialBirthdays } from "@/data/birthdays";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import type { AppRoute } from "@/types/navigation";
import {
  getDaysUntilFamilyEvent,
  normalizeFamilyEvent,
} from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

type ImportantRow = {
  id: string;
  icon: AppIconName;
  iconClass: string;
  statusLabel: string;
  statusClass: string;
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
      statusLabel: "היום",
      statusClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
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
      statusLabel: "בקרוב",
      statusClass: "bg-orange-50 text-orange-700 ring-orange-100",
      title: `${shoppingItems.length} פריטים לקנייה`,
      subtitle: "הקנייה הבאה מתחילה כאן",
      href: "/shopping",
    });
  }

  // אירוע משפחתי בשבוע הקרוב
  const upcomingEvent = readStorageArray(storageKeys.birthdays, initialBirthdays)
    .map(normalizeFamilyEvent)
    .map((event) => ({ event, days: getDaysUntilFamilyEvent(event) }))
    .filter(({ days }) => Number.isFinite(days) && days <= 7)
    .sort((first, second) => first.days - second.days)[0];

  if (upcomingEvent) {
    const timing =
      upcomingEvent.days === 0
        ? "היום!"
        : upcomingEvent.days === 1
          ? "מחר"
          : `בעוד ${upcomingEvent.days} ימים`;
    rows.push({
      id: "event",
      icon: "calendar",
      iconClass: "bg-pink-50 text-pink-600 ring-pink-100",
      statusLabel: upcomingEvent.days === 0 ? "היום" : "קרוב",
      statusClass:
        upcomingEvent.days === 0
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-blue-50 text-blue-700 ring-blue-100",
      title: upcomingEvent.event.title || upcomingEvent.event.name,
      subtitle: timing,
      href: "/birthdays",
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  // תזכורות מסמכים שהגיע זמנן
  const documentRecords = readStorageArray<{
    title?: string;
    reminderDate?: string;
    status?: string;
  }>(storageKeys.documents, []);
  const dueDocument = documentRecords
    .filter(
      (record) =>
        record.status !== "done" &&
        Boolean(record.reminderDate) &&
        String(record.reminderDate) <= today
    )
    .sort((first, second) =>
      String(first.reminderDate).localeCompare(String(second.reminderDate))
    )[0];

  if (dueDocument) {
    rows.push({
      id: "document",
      icon: "document",
      iconClass: "bg-purple-50 text-purple-600 ring-purple-100",
      statusLabel: "היום",
      statusClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      title: dueDocument.title || "מסמך ממתין לטיפול",
      subtitle: "תזכורת מסמך הגיעה",
      href: "/documents",
    });
  }

  // תזכורות רכב פתוחות
  const openVehicleRecords = readStorageArray<{
    title?: string;
    status?: string;
  }>(storageKeys.vehicles, []).filter((record) => record.status === "open");

  if (openVehicleRecords.length > 0) {
    rows.push({
      id: "vehicles",
      icon: "car",
      iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
      statusLabel: "בהמשך",
      statusClass: "bg-blue-50 text-blue-700 ring-blue-100",
      title: openVehicleRecords[0].title || "תזכורת רכב פתוחה",
      subtitle:
        openVehicleRecords.length > 1
          ? `ועוד ${openVehicleRecords.length - 1} תזכורות רכב`
          : "תזכורת רכב פתוחה",
      href: "/vehicles",
    });
  }

  const transactions = readStorageArray(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const overdue = transactions
    .filter((item) => item.status === "pending" && item.date < today)
    .sort((first, second) => first.date.localeCompare(second.date))[0];

  if (overdue) {
    rows.push({
      id: "overdue",
      icon: "finance",
      iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
      statusLabel: "באיחור",
      statusClass: "bg-rose-50 text-rose-700 ring-rose-100",
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

  // שומרים על רוגע: מציגים עד ארבע שורות, לפי סדר חשיבות.
  return { rows: rows.slice(0, 4), insight };
}

export function NestlyAiInsightCard({ insight }: { insight: HomeInsight }) {
  return (
    <section className="rounded-[22px] border border-white/80 bg-gradient-to-l from-violet-100/70 via-sky-50/88 to-emerald-50/82 p-3 text-right shadow-[0_12px_28px_rgba(76,29,149,0.09)]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/76 text-violet-700 shadow-sm ring-1 ring-violet-100">
          <AppIcon name="spark" className="h-4.5 w-4.5" />
        </span>

        <div className="min-w-0 text-right">
          <h2 className="text-sm font-black text-[#111827]">
            המלצה חכמה
          </h2>
          <p className="mt-0.5 truncate text-xs font-semibold leading-5 text-slate-500">
            {insight.text}
          </p>
        </div>

        <Link
          href={insight.href}
          className="grid min-h-10 shrink-0 place-items-center rounded-2xl border border-white/80 bg-white/72 px-3 text-xs font-black text-[#111827] shadow-sm transition hover:bg-white"
        >
          פתח
        </Link>
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
      <section className="rounded-[26px] border border-white/80 bg-white/96 p-5 text-right shadow-[0_18px_44px_rgba(33,43,63,0.085)] ring-1 ring-[#eadfcd]/65">
        <div>
          <p className="text-[11px] font-black text-slate-400">
            מה דורש תשומת לב
          </p>
          <h2 className="mt-0.5 text-xl font-black leading-7 text-[#111827]">
            חשוב היום
          </h2>
        </div>

        {data?.insight && (
          <div className="mt-3">
            <NestlyAiInsightCard insight={data.insight} />
          </div>
        )}

        {data === null ? (
          <p className="mt-4 text-sm font-semibold text-slate-400">טוען…</p>
        ) : data.rows.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-500">
            אין משימות דחופות להיום — נהנים מהשקט.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#eef0f4]">
            {data.rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="group grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-1 py-3 transition duration-200 hover:bg-[#fffdf8] active:scale-[0.99]"
                >
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${row.statusClass}`}
                  >
                    {row.statusLabel}
                  </span>
                  <span className="min-w-0 text-right">
                    <span className="block truncate text-base font-black text-[#0f172a]">
                      {row.title}
                    </span>
                    {row.subtitle && (
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-400">
                        {row.subtitle}
                      </span>
                    )}
                  </span>
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ring-1 ${row.iconClass}`}
                  >
                    <AppIcon name={row.icon} className="h-4.5 w-4.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
