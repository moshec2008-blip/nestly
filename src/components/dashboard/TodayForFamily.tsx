"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getFamilyTodaySummary,
  type FamilySuggestion,
  type FamilyTodayItem,
} from "@/services/familyToday";
import { getAiDailyBriefing } from "@/services/aiAssistant";
import type { AiFamilyInsight } from "@/types/aiAssistant";

const toneStyles: Record<
  FamilyTodayItem["tone"],
  { icon: string; accent: string; bg: string }
> = {
  warm: { icon: "🎂", accent: "text-orange-700", bg: "bg-orange-50" },
  blue: { icon: "🛒", accent: "text-sky-700", bg: "bg-sky-50" },
  green: { icon: "₪", accent: "text-emerald-700", bg: "bg-emerald-50" },
  slate: { icon: "✓", accent: "text-slate-700", bg: "bg-slate-100" },
  purple: { icon: "!", accent: "text-violet-700", bg: "bg-violet-50" },
};

const aiToneStyles: Record<AiFamilyInsight["tone"], string> = {
  calm: "border-[#eadfcd] bg-[#fffdf8]",
  good: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  urgent: "border-rose-200 bg-rose-50",
};

function Suggestion({ suggestion }: { suggestion: FamilySuggestion }) {
  return (
    <Link
      href={suggestion.href}
      className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-[#fff8eb] px-3 py-2 text-right transition hover:bg-[#fff3d6]"
    >
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#7a5212] shadow-sm">
        {suggestion.action}
      </span>
      <p className="min-w-0 flex-1 line-clamp-2 text-xs font-bold leading-5 text-slate-700">
        {suggestion.text}
      </p>
    </Link>
  );
}

function AiSuggestion({ insight }: { insight: AiFamilyInsight }) {
  return (
    <Link
      href={insight.targetRoute}
      className={[
        "flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-right transition hover:-translate-y-0.5",
        aiToneStyles[insight.tone],
      ].join(" ")}
    >
      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-[#7a5212] shadow-sm">
        {insight.actionLabel}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-black text-[#9a6b17]">
          Nestly AI
        </span>
        <span className="line-clamp-2 text-xs font-bold leading-5 text-slate-700">
          {insight.message}
        </span>
      </span>
    </Link>
  );
}

function BriefingRow({ item }: { item: FamilyTodayItem }) {
  const style = toneStyles[item.tone];

  return (
    <Link
      href={item.href}
      className="grid min-h-[54px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-[#fafafb]"
    >
      <span
        className={[
          "grid h-10 w-10 place-items-center rounded-2xl text-sm font-black",
          style.bg,
          style.accent,
        ].join(" ")}
      >
        {style.icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-[#111827]">
          {item.label}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-slate-600">
          {item.detail}
        </span>
      </span>
      <span className="text-[11px] font-black text-slate-400">פתח</span>
    </Link>
  );
}

function PrimaryBriefingItem({ item }: { item: FamilyTodayItem }) {
  const style = toneStyles[item.tone];

  return (
    <Link
      href={item.href}
      className={[
        "grid min-h-[78px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[20px] px-3 py-3 text-right shadow-[0_14px_34px_rgba(33,43,63,0.08)] transition hover:-translate-y-0.5",
        style.bg,
      ].join(" ")}
    >
      <span
        className={[
          "grid h-12 w-12 place-items-center rounded-2xl bg-white text-base font-black shadow-sm",
          style.accent,
        ].join(" ")}
      >
        {style.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-black text-slate-500">
          הכי חשוב עכשיו
        </span>
        <span className="mt-0.5 block truncate text-base font-black text-[#111827]">
          {item.label}
        </span>
        <span className="mt-1 block truncate text-sm font-bold text-slate-700">
          {item.detail}
        </span>
      </span>
    </Link>
  );
}

export default function TodayForFamily() {
  const [items, setItems] = useState<FamilyTodayItem[]>([]);
  const [suggestion, setSuggestion] = useState<FamilySuggestion | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiFamilyInsight | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const summary = getFamilyTodaySummary();
      const briefing = getAiDailyBriefing({ maxItems: 4 });
      setItems(summary.items.slice(0, 5));
      setSuggestion(summary.suggestion);
      setAiSuggestion(briefing.suggestion);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (items.length === 0 && !suggestion && !aiSuggestion) {
    return null;
  }

  const [primaryItem, ...secondaryItems] = items;

  return (
    <section className="rounded-[22px] bg-white/92 p-3 text-right shadow-[0_12px_30px_rgba(33,43,63,0.06)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#fff8eb] px-2.5 py-1 text-[11px] font-black text-[#7a5212]">
          רגוע וממוקד
        </span>
        <div>
          <h2 className="text-lg font-black text-[#111827]">
            מה חשוב למשפחה היום
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            קודם הדחוף, אחר כך מה שיכול לחכות.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {primaryItem && <PrimaryBriefingItem item={primaryItem} />}

        {secondaryItems.length > 0 && (
          <div className="divide-y divide-[#eef0f3]">
            {secondaryItems.slice(0, aiSuggestion || suggestion ? 3 : 4).map((item) => (
              <BriefingRow key={item.id} item={item} />
            ))}
          </div>
        )}

        {aiSuggestion ? (
          <AiSuggestion insight={aiSuggestion} />
        ) : (
          suggestion && <Suggestion suggestion={suggestion} />
        )}
      </div>
    </section>
  );
}
