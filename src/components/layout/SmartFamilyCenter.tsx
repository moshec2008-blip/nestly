"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { initialBirthdays } from "@/data/birthdays";
import {
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import { initialHealthRecords, initialVehicleRecords } from "@/data/modules";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import { getAppNotifications, type AppNotification } from "@/services/notifications";
import { documentAiStatus } from "@/services/documentAi";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray } from "@/utils/storage";

type CenterCard = {
  title: string;
  value: string;
  note: string;
  href: string;
  tone: string;
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

function getCenterCards(): CenterCard[] {
  const tasks = readStorageArray<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  );
  const financeTransactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const healthRecords = readStorageArray<ModuleRecord>(
    storageKeys.health,
    initialHealthRecords
  );
  const vehicleRecords = readStorageArray<ModuleRecord>(
    storageKeys.vehicles,
    initialVehicleRecords
  );
  const birthdays = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(
    (task) => task.status === "open" && task.dueDate <= today
  );
  const pendingPayments = financeTransactions.filter(
    (transaction) => transaction.status === "pending"
  );
  const nextBirthday = [...birthdays].sort(
    (a, b) =>
      getDaysUntilAnnualDate(a.gregorianDate) -
      getDaysUntilAnnualDate(b.gregorianDate)
  )[0];
  const healthReminders = healthRecords.filter(
    (record) => record.status === "open"
  );
  const vehicleReminders = vehicleRecords.filter(
    (record) => record.status === "open"
  );

  return [
    {
      title: "תשלומים קרובים",
      value: `${pendingPayments.length}`,
      note: pendingPayments[0]?.title ?? "אין תשלום ממתין כרגע",
      href: "/finance",
      tone: "from-emerald-400/18 to-emerald-500/5",
    },
    {
      title: "יום הולדת הבא",
      value: nextBirthday?.name ?? "-",
      note: nextBirthday
        ? `עוד ${getDaysUntilAnnualDate(nextBirthday.gregorianDate)} ימים`
        : "אין תאריך קרוב",
      href: "/birthdays",
      tone: "from-pink-400/18 to-pink-500/5",
    },
    {
      title: "בריאות",
      value: `${healthReminders.length}`,
      note: healthReminders[0]?.title ?? "אין תזכורת פתוחה",
      href: "/health",
      tone: "from-rose-400/18 to-rose-500/5",
    },
    {
      title: "רכבים",
      value: `${vehicleReminders.length}`,
      note: vehicleReminders[0]?.title ?? "אין טיפול פתוח",
      href: "/vehicles",
      tone: "from-blue-400/18 to-blue-500/5",
    },
    {
      title: "משימות להיום",
      value: `${todayTasks.length}`,
      note: todayTasks[0]?.title ?? "היום נראה נקי",
      href: "/tasks",
      tone: "from-orange-400/18 to-orange-500/5",
    },
  ];
}

export default function SmartFamilyCenter() {
  const [cards, setCards] = useState<CenterCard[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCards(getCenterCards());
      setNotifications(getAppNotifications());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const visibleCards = useMemo(
    () => (cards.length > 0 ? cards : getCenterCards()),
    [cards]
  );

  const compactCards = visibleCards.slice(0, 4);
  const compactNotifications = notifications.slice(0, 2);

  return (
    <aside className="hidden w-60 shrink-0 self-start rounded-[22px] border border-[#e6e8ec] bg-white p-3 text-right shadow-[0_10px_26px_rgba(15,23,42,0.045)] 2xl:block">
      <div className="mb-3 rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-3 shadow-sm">
        <p className="text-[11px] font-bold text-[#007aff]">תובנות יומיות</p>
        <h2 className="mt-1 text-lg font-black text-[#1d1d1f]">מרכז משפחתי</h2>
      </div>

      <div className="space-y-2">
        {compactCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                פתיחה
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-500">{card.title}</p>
                <p className="mt-1 text-lg font-black text-[#1d1d1f]">
                  {card.value}
                </p>
              </div>
            </div>
            <p className="mt-1 truncate text-[11px] text-slate-500">{card.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-3 rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-3 shadow-sm">
        <div className="mb-3 rounded-2xl border border-[#e6e8ec] bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-amber-700">AI Documents</p>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              {documentAiStatus.mode}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-black text-slate-950">תיוק חכם</h3>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            {notifications.length}
          </span>
          <p className="text-xs font-black text-slate-950">התראות אחרונות</p>
        </div>

        <div className="space-y-2">
          {compactNotifications.map(
            (notification) => (
              <Link
                key={notification.id}
                href={notification.href}
                className="block rounded-2xl bg-slate-50 p-2.5 transition hover:bg-blue-50"
              >
                <p className="truncate text-xs font-bold text-slate-950">
                  {notification.title}
                </p>
                <p className="mt-1 truncate text-[10px] text-slate-500">
                  {notification.description}
                </p>
              </Link>
            )
          )}
          {notifications.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
              אין התראות חדשות כרגע.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
