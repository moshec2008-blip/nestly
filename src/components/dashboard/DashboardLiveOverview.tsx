"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
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
import { storageKeys } from "@/lib/storageKeys";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import { readStorageArray } from "@/utils/storage";

type OverviewItem = {
  title: string;
  value: string;
  note: string;
  href: string;
  icon: AppIconName;
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
      title: "משימות",
      value: `${taskStats.openTasks} פתוחות`,
      note: `${taskStats.highPriorityTasks} בעדיפות גבוהה`,
      href: "/tasks",
      icon: "check",
      tone: "text-orange-700 bg-orange-50",
    },
    {
      title: "כספים",
      value: `${financeStats.balance.toLocaleString("he-IL")} ₪`,
      note: `${financeStats.pendingPayments} פעולות עתידיות`,
      href: "/finance",
      icon: "finance",
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "קניות",
      value: `${openShoppingItems} לקנות`,
      note: "רשימות פעילות",
      href: "/shopping",
      icon: "shopping",
      tone: "text-cyan-700 bg-cyan-50",
    },
    {
      title: "תזכורות",
      value: `${upcomingHealth + openVehicleItems + upcomingBirthdays}`,
      note: "בריאות, רכבים וימי הולדת",
      href: "/dashboard",
      icon: "bell",
      tone: "text-amber-700 bg-amber-50",
    },
    {
      title: "מסמכים",
      value: `${documentRecords.length}`,
      note: `${attachmentsCount} קבצים מצורפים`,
      href: "/documents",
      icon: "document",
      tone: "text-violet-700 bg-violet-50",
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
    <section className="rounded-[20px] border border-white/80 bg-white/88 p-2.5 text-right shadow-[0_12px_30px_rgba(33,43,63,0.07)] backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800">
          חי עכשיו
        </span>
        <div>
          <p className="text-[11px] font-bold text-slate-600">
            מצב הבית ברגע אחד
          </p>
          <h2 className="text-sm font-black text-[#1d1d1f] sm:text-base">
            היום בקצרה
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-4">
        {primaryOverviewItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group min-h-[64px] rounded-[16px] border border-white/80 bg-[#fffdf8] p-2 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.09)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-xl ${item.tone}`}
              >
                <AppIcon name={item.icon} className="h-4 w-4" />
              </span>
              <p className="truncate text-[11px] font-bold text-slate-600">
                {item.title}
              </p>
            </div>
            <p className="mt-1 truncate text-sm font-black tracking-tight text-[#1d1d1f] sm:text-base">
              {item.value}
            </p>
            <p className="mt-0.5 hidden truncate text-[10px] font-semibold leading-4 text-slate-600 sm:block">
              {item.note}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
