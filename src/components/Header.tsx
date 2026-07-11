"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";

const quickActions = [
  { href: "/tasks", label: "+ משימה" },
  { href: "/shopping", label: "+ קנייה" },
  { href: "/finance", label: "+ הוצאה" },
] as const;

export default function Header() {
  const { direction } = useLanguage();

  return (
    <header
      className={[
        "rounded-[20px] bg-gradient-to-br from-[#fff8eb] to-white p-2.5 text-[#1d1d1f] shadow-[0_10px_24px_rgba(33,43,63,0.055)]",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#9a6b17]">
            {brand.workspaceName}
          </p>
          <h1 className="mt-0.5 text-lg font-black tracking-tight text-[#111827] md:text-2xl">
            בוקר טוב, הנה מה שחשוב היום.
          </h1>
          <p className="mt-0.5 line-clamp-1 max-w-xl text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
            סקירה קצרה של הבית, בלי להציף.
          </p>
        </div>

        <div className="shrink-0">
          <p className="mb-1 text-[10px] font-black text-slate-500">
            פעולות מהירות
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="min-h-9 rounded-2xl border border-[#eadfcd] bg-white px-3 py-1.5 text-xs font-black text-[#111827] shadow-sm transition hover:bg-[#fff8eb]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
