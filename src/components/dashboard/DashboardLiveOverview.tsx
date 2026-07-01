"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { initialBirthdays } from "@/data/birthdays";
import {
  getFinanceStats,
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import {
  initialDocumentRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import {
  getTaskStats,
  initialFamilyTasks,
  type FamilyTask,
} from "@/data/tasks";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray } from "@/utils/storage";

type OverviewItem = {
  title: string;
  value: string;
  note: string;
  href: string;
  tone: string;
};

type DocumentOverviewRecord = ModuleRecord & {
  attachments?: { name: string; size: number; type: string }[];
};

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

function getOverviewItems(useStoredData: boolean): OverviewItem[] {
  const tasks = useStoredData
    ? readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks)
    : initialFamilyTasks;
  const financeTransactions = useStoredData
    ? readStorageArray<FinanceTransaction>(
        storageKeys.finance,
        initialFinanceTransactions
      )
    : initialFinanceTransactions;
  const healthRecords = useStoredData
    ? readStorageArray<ModuleRecord>(storageKeys.health, initialHealthRecords)
    : initialHealthRecords;
  const vehicleRecords = useStoredData
    ? readStorageArray<ModuleRecord>(
        storageKeys.vehicles,
        initialVehicleRecords
      )
    : initialVehicleRecords;
  const documentRecords: DocumentOverviewRecord[] = useStoredData
    ? readStorageArray<DocumentOverviewRecord>(
        storageKeys.documents,
        initialDocumentRecords
      )
    : initialDocumentRecords;
  const birthdays = useStoredData
    ? readStorageArray<BirthdayPerson>(storageKeys.birthdays, initialBirthdays)
    : initialBirthdays;
  const shoppingItems = useStoredData
    ? readStorageArray<ShoppingItem>(
        storageKeys.shopping,
        initialShoppingItems
      )
    : initialShoppingItems;

  const taskStats = getTaskStats(tasks);
  const financeStats = getFinanceStats(financeTransactions);
  const upcomingHealth = healthRecords.filter(
    (record) => record.status === "open"
  ).length;
  const openVehicleItems = vehicleRecords.filter(
    (record) => record.status === "open"
  ).length;
  const attachmentsCount = documentRecords.reduce(
    (sum, record) => sum + (record.attachments?.length ?? 0),
    0
  );
  const upcomingBirthdays = birthdays.filter(
    (birthday) => getDaysUntilAnnualDate(birthday.gregorianDate) <= 45
  ).length;
  const openShoppingItems = shoppingItems.filter(
    (item) => !item.purchased
  ).length;

  return [
    {
      title: "סיכום משימות",
      value: `${taskStats.openTasks} פתוחות`,
      note: `${taskStats.highPriorityTasks} בעדיפות גבוהה`,
      href: "/tasks",
      tone: "from-orange-400/18 to-white/[0.04]",
    },
    {
      title: "סיכום כספים",
      value: `${financeStats.balance.toLocaleString("he-IL")} ₪`,
      note: `${financeStats.pendingPayments} תשלומים ממתינים`,
      href: "/finance",
      tone: "from-emerald-400/18 to-white/[0.04]",
    },
    {
      title: "בריאות",
      value: `${upcomingHealth} פתוחים`,
      note: "תורים, בדיקות ומעקב",
      href: "/health",
      tone: "from-rose-400/18 to-white/[0.04]",
    },
    {
      title: "רכבים",
      value: `${openVehicleItems} פתוחים`,
      note: "טיפולים, ביטוחים וטסטים",
      href: "/vehicles",
      tone: "from-blue-400/18 to-white/[0.04]",
    },
    {
      title: "מסמכים חדשים",
      value: `${documentRecords.length}`,
      note: `${attachmentsCount} קבצים מצורפים`,
      href: "/documents",
      tone: "from-violet-400/18 to-white/[0.04]",
    },
    {
      title: "ימי הולדת",
      value: `${upcomingBirthdays} קרובים`,
      note: "חלון של 45 ימים",
      href: "/birthdays",
      tone: "from-pink-400/18 to-white/[0.04]",
    },
    {
      title: "קניות",
      value: `${openShoppingItems} פתוחים`,
      note: "רשימות משותפות למשפחה",
      href: "/shopping",
      tone: "from-cyan-400/18 to-white/[0.04]",
    },
    {
      title: "התראות ותזכורות",
      value: `${taskStats.openTasks + upcomingHealth + openVehicleItems}`,
      note: "משימות ואירועים שדורשים מעקב",
      href: "/dashboard",
      tone: "from-amber-400/18 to-white/[0.04]",
    },
  ];
}

export default function DashboardLiveOverview() {
  const initialOverviewItems = useMemo(() => getOverviewItems(false), []);
  const [overviewItems, setOverviewItems] =
    useState<OverviewItem[]>(initialOverviewItems);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOverviewItems(getOverviewItems(true));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const primaryOverviewItems = overviewItems.slice(0, 4);

  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-[11px] font-bold text-[#248a3d]">
          חי
        </span>
        <div>
          <p className="text-xs font-bold text-slate-500">
            נתונים חיים מהמודולים
          </p>
          <h2 className="mt-1 text-base font-black text-[#1d1d1f] sm:text-lg">
            פעילות אחרונה
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {primaryOverviewItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-[14px] border border-[#e6e8ec] bg-[#fafafb] p-2.5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.055)]"
          >
            <p className="truncate text-[11px] font-bold text-slate-500 sm:text-xs">{item.title}</p>
            <p className="mt-1 truncate text-base font-black tracking-tight text-[#1d1d1f] sm:text-xl">
              {item.value}
            </p>
            <p className="mt-1.5 line-clamp-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">
              {item.note}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
