"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { initialBirthdays } from "@/data/birthdays";
import {
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import { initialHealthRecords, initialVehicleRecords } from "@/data/modules";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import { documentAiStatus } from "@/services/documentAi";
import {
  getAppNotifications,
  type AppNotification,
} from "@/services/notifications";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import { getDaysUntilBirthday } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

type CenterCard = {
  title: string;
  value: string;
  note: string;
  href: string;
  icon: AppIconName;
  tone: string;
};

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
      getDaysUntilBirthday({
        gregorianDate: a.gregorianDate,
        calendarType: a.calendarType ?? "hebrew",
      }) -
      getDaysUntilBirthday({
        gregorianDate: b.gregorianDate,
        calendarType: b.calendarType ?? "hebrew",
      })
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
      icon: "finance",
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "יום הולדת הבא",
      value: nextBirthday?.name ?? "-",
      note: nextBirthday
        ? `עוד ${getDaysUntilBirthday({
            gregorianDate: nextBirthday.gregorianDate,
            calendarType: nextBirthday.calendarType ?? "hebrew",
          })} ימים`
        : "אין תאריך קרוב",
      href: "/birthdays",
      icon: "calendar",
      tone: "text-pink-700 bg-pink-50",
    },
    {
      title: "בריאות",
      value: `${healthReminders.length}`,
      note: healthReminders[0]?.title ?? "אין תזכורת פתוחה",
      href: "/health",
      icon: "health",
      tone: "text-rose-700 bg-rose-50",
    },
    {
      title: "רכבים",
      value: `${vehicleReminders.length}`,
      note: vehicleReminders[0]?.title ?? "אין טיפול פתוח",
      href: "/vehicles",
      icon: "car",
      tone: "text-blue-700 bg-blue-50",
    },
    {
      title: "משימות להיום",
      value: `${todayTasks.length}`,
      note: todayTasks[0]?.title ?? "היום נראה נקי",
      href: "/tasks",
      icon: "check",
      tone: "text-orange-700 bg-orange-50",
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
    <aside className="hidden w-56 shrink-0 self-start rounded-[22px] border border-white/80 bg-white/88 p-2.5 text-right shadow-[0_16px_42px_rgba(33,43,63,0.08)] backdrop-blur 2xl:block">
      <div className="mb-2 rounded-[18px] border border-[#ebe4d8] bg-gradient-to-br from-[#fff8eb] to-[#f7f9fd] p-2.5 shadow-sm">
        <p className="text-[11px] font-bold text-[#007aff]">תובנות יומיות</p>
        <h2 className="mt-1 text-base font-extrabold text-[#1d1d1f]">
          מרכז משפחתי
        </h2>
        <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
          הדברים שכדאי לראות לפני שממשיכים.
        </p>
      </div>

      <div className="space-y-2">
        {compactCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="block rounded-[18px] border border-white/80 bg-[#fffdf8] p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.09)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-8 w-8 place-items-center rounded-2xl ${card.tone}`}>
                <AppIcon name={card.icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-600">
                  {card.title}
                </p>
                <p className="mt-0.5 text-base font-extrabold text-[#1d1d1f]">
                  {card.value}
                </p>
              </div>
            </div>
            <p className="mt-1 truncate text-[11px] font-semibold text-slate-600">
              {card.note}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-2 rounded-[18px] border border-white/80 bg-[#fffdf8] p-2.5 shadow-sm">
        <div className="mb-2 rounded-2xl border border-[#ebe4d8] bg-white p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-amber-700">AI Documents</p>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              {documentAiStatus.mode}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-black text-slate-950">תיוק חכם</h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">
            מוכן לסריקה, זיהוי וסידור מסמכים בהמשך.
          </p>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            {notifications.length}
          </span>
          <p className="text-xs font-black text-slate-950">התראות אחרונות</p>
        </div>

        <div className="space-y-2">
          {compactNotifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className="block rounded-2xl bg-white p-2.5 transition hover:bg-[#fff8eb]"
            >
              <p className="truncate text-xs font-bold text-slate-950">
                {notification.title}
              </p>
              <p className="mt-1 truncate text-[10px] text-slate-500">
                {notification.description}
              </p>
            </Link>
          ))}
          {notifications.length === 0 && (
            <p className="rounded-2xl bg-white p-3 text-xs text-slate-500">
              אין התראות חדשות כרגע.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
