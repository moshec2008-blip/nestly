"use client";

import Link from "next/link";
import ReceiptScanPreview from "@/components/ai/ReceiptScanPreview";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute } from "@/types/navigation";
import type { QuickActionId } from "@/types/personalization";

type QuickAction = {
  id: QuickActionId;
  href: AppRoute;
  icon: AppIconName;
  labels: {
    he: string;
    en: string;
  };
  accentClass: string;
  tileClass: string;
};

const quickActions: QuickAction[] = [
  {
    id: "shopping",
    href: "/shopping",
    icon: "shopping",
    labels: { he: "רשימת קניות", en: "Shopping list" },
    accentClass: "bg-sky-50 text-sky-700 ring-sky-100",
    tileClass: "bg-gradient-to-br from-[#d9eefb] to-[#8fb9d9]",
  },
  {
    id: "tasks",
    href: "/tasks",
    icon: "check",
    labels: { he: "משימות לביצוע", en: "Open tasks" },
    accentClass: "bg-amber-50 text-amber-700 ring-amber-100",
    tileClass: "bg-gradient-to-br from-[#fff8d8] to-[#f6e9ad]",
  },
  {
    id: "finance",
    href: "/finance",
    icon: "finance",
    labels: { he: "תקציב משפחתי", en: "Family budget" },
    accentClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    tileClass: "bg-gradient-to-br from-[#dcf7df] to-[#a8d8b5]",
  },
  {
    id: "events",
    href: "/birthdays",
    icon: "calendar",
    labels: { he: "אירועים", en: "Events" },
    accentClass: "bg-rose-50 text-rose-700 ring-rose-100",
    tileClass: "bg-gradient-to-br from-[#ffe4dd] to-[#ffad9e]",
  },
];

const receiptCopy = {
  he: {
    aria: "פעולות מהירות",
    title: "סריקת קבלה",
    subtitle: "הוסף הוצאה תוך כמה שניות",
  },
  en: {
    aria: "Quick actions",
    title: "Scan receipt",
    subtitle: "Add an expense in seconds",
  },
} as const;

export default function HomeQuickActions() {
  const { language, direction } = useLanguage();
  const personalization = usePersonalization();
  const copy = language === "en" ? receiptCopy.en : receiptCopy.he;
  const labelKey = language === "en" ? "en" : "he";
  const pinnedActions = new Set(
    personalization.quickActions
      .filter((action) => action.pinned)
      .map((action) => action.id)
  );
  const visibleActions = quickActions.filter((action) =>
    pinnedActions.has(action.id)
  );
  const showReceiptScan = pinnedActions.has("scanReceipt");

  return (
    <section aria-label={copy.aria} className="space-y-2.5">
      {visibleActions.length > 0 ? (
        <nav className="grid grid-cols-2 gap-2.5">
          {visibleActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-1.5 rounded-[17px] border border-white/70 px-2.5 py-2 text-center shadow-[0_7px_16px_rgba(33,43,63,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(33,43,63,0.1)] focus:outline-none focus:ring-2 focus:ring-[#eadfcd] ${action.tileClass}`}
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/52 ring-1 ${action.accentClass}`}
            >
              <AppIcon name={action.icon} className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 text-[12px] font-black leading-4 text-[#0f172a]">
              {action.labels[labelKey]}
            </span>
          </Link>
          ))}
        </nav>
      ) : null}

      {showReceiptScan ? (
        <ReceiptScanPreview
        triggerClassName={[
          "flex min-h-[58px] cursor-pointer items-center justify-between gap-3 rounded-[18px] border border-[#eadfcd] bg-gradient-to-l from-[#fbf7ff] via-white to-[#fffdf8] px-3.5 py-2.5 shadow-[0_8px_18px_rgba(33,43,63,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(33,43,63,0.09)] focus-within:ring-2 focus-within:ring-[#eadfcd]",
          direction === "rtl" ? "text-right" : "text-left",
        ].join(" ")}
        triggerContent={
          <>
            <span className="flex items-center gap-2 text-xs font-black text-slate-500">
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-700 ring-1 ring-violet-100">
                AI
              </span>
            </span>
            <span
              className={[
                "flex min-w-0 flex-1 items-center gap-3",
                direction === "rtl" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              <span className={direction === "rtl" ? "text-right" : "text-left"}>
                <span className="block text-sm font-black leading-5 text-[#111827]">
                  {copy.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] font-semibold leading-4 text-slate-600">
                  {copy.subtitle}
                </span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white text-[#7a5212] shadow-sm ring-1 ring-[#eadfcd]">
                <AppIcon name="document" className="h-4 w-4" />
              </span>
            </span>
          </>
        }
        />
      ) : null}
    </section>
  );
}
