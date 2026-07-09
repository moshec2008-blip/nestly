"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getFamilyTodaySummary,
  type FamilySuggestion,
  type FamilyTodayItem,
} from "@/services/familyToday";

const toneClasses: Record<FamilyTodayItem["tone"], string> = {
  warm: "border-orange-200 bg-orange-50/92 text-orange-950 shadow-[0_12px_30px_rgba(249,115,22,0.13)]",
  blue: "border-sky-200 bg-sky-50/92 text-sky-950 shadow-[0_12px_30px_rgba(14,165,233,0.13)]",
  green:
    "border-emerald-200 bg-emerald-50/92 text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.13)]",
  slate:
    "border-slate-200 bg-slate-100/92 text-slate-950 shadow-[0_12px_30px_rgba(71,85,105,0.11)]",
  purple:
    "border-violet-200 bg-violet-50/92 text-violet-950 shadow-[0_12px_30px_rgba(124,58,237,0.13)]",
};

function Suggestion({ suggestion }: { suggestion: FamilySuggestion }) {
  return (
    <Link
      href={suggestion.href}
      className="nestly-interactive relative flex min-h-[70px] items-center justify-between gap-2.5 overflow-hidden rounded-2xl border border-[#eadfcd] bg-gradient-to-br from-[#fff8eb] to-white px-3 py-2 text-right text-[#24151f] shadow-[0_14px_34px_rgba(154,107,23,0.13)]"
    >
      <span
        className="absolute inset-y-3 right-1 w-1 rounded-full bg-[#d8b470]"
        aria-hidden="true"
      />
      <span className="shrink-0 rounded-full border border-[#eadfcd] bg-white px-2.5 py-1 text-[11px] font-black text-[#7a5212] shadow-sm">
        {suggestion.action}
      </span>
      <p className="min-w-0 flex-1 text-xs font-bold leading-5 text-slate-700">
        {suggestion.text}
      </p>
    </Link>
  );
}

export default function TodayForFamily() {
  const [items, setItems] = useState<FamilyTodayItem[]>([]);
  const [suggestion, setSuggestion] = useState<FamilySuggestion | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const summary = getFamilyTodaySummary();
      setItems(summary.items.slice(0, 5));
      setSuggestion(summary.suggestion);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (items.length === 0 && !suggestion) {
    return null;
  }

  return (
    <section className="nestly-card-strong rounded-[22px] p-2.5 text-right">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="nestly-eyebrow">רגוע וממוקד</span>
        <div>
          <h2 className="text-lg font-black text-[#111827]">
            מה חשוב למשפחה היום
          </h2>
          <p className="text-xs font-bold text-slate-600">
            3-5 דברים שכדאי לראות עכשיו, בלי להציף את המסך.
          </p>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_0.86fr]">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`nestly-interactive min-h-[70px] rounded-2xl border px-3 py-2 ${toneClasses[item.tone]}`}
            >
              <p className="line-clamp-1 text-sm font-black">{item.label}</p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-700">
                {item.detail}
              </p>
            </Link>
          ))}
        </div>

        {suggestion && <Suggestion suggestion={suggestion} />}
      </div>
    </section>
  );
}
