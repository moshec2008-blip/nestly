"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { initialBirthdays } from "@/data/birthdays";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import { useLanguage } from "@/i18n/useLanguage";
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

const copyByLanguage = {
  he: {
    sectionEyebrow: "מה דורש תשומת לב",
    sectionTitle: "חשוב היום",
    loading: "טוען...",
    empty: "אין משימות דחופות להיום - נהנים מהשקט.",
    insightTitle: "המלצה חכמה",
    open: "פתח",
    statuses: {
      today: "היום",
      soon: "בקרוב",
      upcoming: "בהמשך",
      overdue: "באיחור",
    },
    tasksTitle: (count: number) => `${count} משימות חשובות פתוחות`,
    shoppingTitle: (count: number) => `${count} פריטים לקנייה`,
    shoppingSubtitle: "הקנייה הבאה מתחילה כאן",
    eventToday: "היום!",
    eventTomorrow: "מחר",
    eventInDays: (days: number) => `בעוד ${days} ימים`,
    documentTitle: "מסמך ממתין לטיפול",
    documentSubtitle: "תזכורת מסמך הגיעה",
    vehicleTitle: "תזכורת רכב פתוחה",
    vehicleSubtitle: "תזכורת רכב פתוחה",
    moreVehicleSubtitle: (count: number) => `ועוד ${count} תזכורות רכב`,
    overdueSubtitle: (amount: string) => `באיחור · ${amount}`,
    overdueInsight: (title: string, amount: string) =>
      `${title} באיחור · ${amount} - אפשר לסמן כשולם או לקבוע תזכורת.`,
    openTasksInsight: (count: number) =>
      `נשארו ${count} משימות פתוחות - נתחיל מהחשובה ביותר?`,
    calmInsight: (amount: string) => `הכול מעודכן. היתרה החודשית: ${amount}.`,
  },
  en: {
    sectionEyebrow: "Needs attention",
    sectionTitle: "Important today",
    loading: "Loading...",
    empty: "No urgent items for today - enjoy the quiet.",
    insightTitle: "Smart suggestion",
    open: "Open",
    statuses: {
      today: "Today",
      soon: "Soon",
      upcoming: "Upcoming",
      overdue: "Overdue",
    },
    tasksTitle: (count: number) =>
      `${count} important ${count === 1 ? "task" : "tasks"} open`,
    shoppingTitle: (count: number) =>
      `${count} ${count === 1 ? "item" : "items"} to buy`,
    shoppingSubtitle: "Your next shopping trip starts here",
    eventToday: "Today!",
    eventTomorrow: "Tomorrow",
    eventInDays: (days: number) => `In ${days} days`,
    documentTitle: "Document needs attention",
    documentSubtitle: "Document reminder is due",
    vehicleTitle: "Open vehicle reminder",
    vehicleSubtitle: "Vehicle reminder is open",
    moreVehicleSubtitle: (count: number) =>
      `${count} more vehicle ${count === 1 ? "reminder" : "reminders"}`,
    overdueSubtitle: (amount: string) => `Overdue · ${amount}`,
    overdueInsight: (title: string, amount: string) =>
      `${title} is overdue · ${amount} - mark it paid or set a reminder.`,
    openTasksInsight: (count: number) =>
      `${count} open ${count === 1 ? "task" : "tasks"} left - start with the most important one?`,
    calmInsight: (amount: string) => `Everything is up to date. Monthly balance: ${amount}.`,
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

function readImportantData(language: AppLanguage): ImportantData {
  const copy = getCopy(language);
  const rows: ImportantRow[] = [];
  let insight: HomeInsight | null = null;

  const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);
  const openTasks = getTaskStats(tasks).openTasks;

  if (openTasks > 0) {
    rows.push({
      id: "tasks",
      icon: "check",
      iconClass: "bg-amber-50 text-amber-600 ring-amber-100",
      statusLabel: copy.statuses.today,
      statusClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      title: copy.tasksTitle(openTasks),
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
      statusLabel: copy.statuses.soon,
      statusClass: "bg-orange-50 text-orange-700 ring-orange-100",
      title: copy.shoppingTitle(shoppingItems.length),
      subtitle: copy.shoppingSubtitle,
      href: "/shopping",
    });
  }

  const upcomingEvent = readStorageArray(storageKeys.birthdays, initialBirthdays)
    .map(normalizeFamilyEvent)
    .map((event) => ({ event, days: getDaysUntilFamilyEvent(event) }))
    .filter(({ days }) => Number.isFinite(days) && days <= 7)
    .sort((first, second) => first.days - second.days)[0];

  if (upcomingEvent) {
    const timing =
      upcomingEvent.days === 0
        ? copy.eventToday
        : upcomingEvent.days === 1
          ? copy.eventTomorrow
          : copy.eventInDays(upcomingEvent.days);

    rows.push({
      id: "event",
      icon: "calendar",
      iconClass: "bg-pink-50 text-pink-600 ring-pink-100",
      statusLabel:
        upcomingEvent.days === 0 ? copy.statuses.today : copy.statuses.soon,
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
      statusLabel: copy.statuses.today,
      statusClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      title: dueDocument.title || copy.documentTitle,
      subtitle: copy.documentSubtitle,
      href: "/documents",
    });
  }

  const openVehicleRecords = readStorageArray<{
    title?: string;
    status?: string;
  }>(storageKeys.vehicles, []).filter((record) => record.status === "open");

  if (openVehicleRecords.length > 0) {
    rows.push({
      id: "vehicles",
      icon: "car",
      iconClass: "bg-blue-50 text-blue-600 ring-blue-100",
      statusLabel: copy.statuses.upcoming,
      statusClass: "bg-blue-50 text-blue-700 ring-blue-100",
      title: openVehicleRecords[0].title || copy.vehicleTitle,
      subtitle:
        openVehicleRecords.length > 1
          ? copy.moreVehicleSubtitle(openVehicleRecords.length - 1)
          : copy.vehicleSubtitle,
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
    const amount = formatCurrency(overdue.amount, language);
    rows.push({
      id: "overdue",
      icon: "finance",
      iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
      statusLabel: copy.statuses.overdue,
      statusClass: "bg-rose-50 text-rose-700 ring-rose-100",
      title: overdue.title,
      subtitle: copy.overdueSubtitle(amount),
      href: "/finance",
    });
    insight = {
      text: copy.overdueInsight(overdue.title, amount),
      href: "/finance",
    };
  } else {
    const stats = getFinanceStats(transactions);
    insight = {
      text:
        openTasks > 0
          ? copy.openTasksInsight(openTasks)
          : copy.calmInsight(formatCurrency(stats.balance, language)),
      href: openTasks > 0 ? "/tasks" : "/finance",
    };
  }

  return { rows: rows.slice(0, 4), insight };
}

export function NestlyAiInsightCard({ insight }: { insight: HomeInsight }) {
  const { language, direction } = useLanguage();
  const copy = getCopy(language);

  return (
    <div
      className={[
        "rounded-[20px] bg-gradient-to-l from-[#fff6e3] via-[#fffaf1] to-white/88 px-3 py-3 shadow-[0_10px_24px_rgba(126,86,28,0.06)]",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/78 text-[#8a5b16] shadow-sm">
          <AppIcon name="spark" className="h-4.5 w-4.5" />
        </span>

        <div className={["min-w-0", direction === "rtl" ? "text-right" : "text-left"].join(" ")}>
          <h2 className="text-sm font-black text-[#111827]">
            {copy.insightTitle}
          </h2>
          <p className="mt-0.5 truncate text-xs font-semibold leading-5 text-slate-500">
            {insight.text}
          </p>
        </div>

        <Link
          href={insight.href}
          className="grid min-h-10 shrink-0 place-items-center rounded-2xl bg-white/76 px-3 text-xs font-black text-[#111827] shadow-sm transition hover:bg-white"
        >
          {copy.open}
        </Link>
      </div>
    </div>
  );
}

export default function ImportantToday() {
  const { language, direction } = useLanguage();
  const copy = getCopy(language);
  const [data, setData] = useState<ImportantData | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setData(readImportantData(language)),
      0
    );
    return () => window.clearTimeout(timeoutId);
  }, [language]);

  return (
    <section
      className={[
        "w-full max-w-full overflow-hidden rounded-[26px] bg-white/92 p-4 shadow-[0_18px_42px_rgba(33,43,63,0.075)] sm:p-5",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
        <p className="text-[11px] font-black text-[#9a6b17]">
          {copy.sectionEyebrow}
        </p>
        <h2 className="mt-0.5 text-[22px] font-black leading-7 text-[#111827]">
          {copy.sectionTitle}
        </h2>
        </div>
        <span className="h-1.5 w-12 rounded-full bg-gradient-to-l from-[#d8b470] to-[#8fb9d9]" />
      </div>

      {data?.insight && (
        <div className="mt-3">
          <NestlyAiInsightCard insight={data.insight} />
        </div>
      )}

      {data === null ? (
        <p className="mt-4 text-sm font-semibold text-slate-400">
          {copy.loading}
        </p>
      ) : data.rows.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">
          {copy.empty}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {data.rows.map((row, index) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className={[
                  "group flex min-h-[66px] min-w-0 items-center gap-3 rounded-[20px] px-2.5 py-2.5 transition duration-200 active:scale-[0.99]",
                  index === 0
                    ? "bg-[#fff8eb] shadow-[0_10px_24px_rgba(126,86,28,0.055)]"
                    : "bg-[#fafafb]/78 hover:bg-[#fffdf8]",
                ].join(" ")}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${row.iconClass}`}
                >
                  <AppIcon name={row.icon} className="h-4.5 w-4.5" />
                </span>
                <span
                  className={[
                    "min-w-0 flex-1",
                    direction === "rtl" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 flex-wrap items-center justify-between gap-1.5">
                    <span className="min-w-0 flex-1 truncate text-base font-black text-[#0f172a]">
                      {row.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${row.statusClass}`}
                    >
                      {row.statusLabel}
                    </span>
                  </span>
                  {row.subtitle && (
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-400">
                      {row.subtitle}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
