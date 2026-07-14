"use client";

import Link from "next/link";
import ReceiptScanPreview from "@/components/ai/ReceiptScanPreview";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

type QuickAction = {
  href: AppRoute;
  icon: AppIconName;
  label: string;
  accentClass: string;
  tileClass: string;
};

const quickActions: QuickAction[] = [
  {
    href: "/shopping",
    icon: "shopping",
    label: "רשימת קניות",
    accentClass: "bg-sky-50 text-sky-700 ring-sky-100",
    tileClass: "bg-gradient-to-br from-[#d9eefb] to-[#8fb9d9]",
  },
  {
    href: "/tasks",
    icon: "check",
    label: "משימות לביצוע",
    accentClass: "bg-amber-50 text-amber-700 ring-amber-100",
    tileClass: "bg-gradient-to-br from-[#fff8d8] to-[#f6e9ad]",
  },
  {
    href: "/finance",
    icon: "finance",
    label: "תקציב משפחתי",
    accentClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    tileClass: "bg-gradient-to-br from-[#dcf7df] to-[#a8d8b5]",
  },
];

export default function HomeQuickActions() {
  return (
    <nav aria-label="פעולות מהירות" className="grid grid-cols-2 gap-2.5">
      {quickActions.map((action) => (
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
            {action.label}
          </span>
        </Link>
      ))}
      <ReceiptScanPreview
        userMode="demo"
        triggerClassName="flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[17px] border border-white/70 bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] px-2.5 py-2 text-center shadow-[0_7px_16px_rgba(33,43,63,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(33,43,63,0.1)] focus-within:ring-2 focus-within:ring-[#eadfcd]"
      />
    </nav>
  );
}
