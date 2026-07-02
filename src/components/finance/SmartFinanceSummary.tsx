"use client";

import type { SmartFinanceInsight } from "@/data/finance";

type SmartFinanceSummaryProps = {
  insights: SmartFinanceInsight[];
};

function getToneClassName(tone: SmartFinanceInsight["tone"]) {
  if (tone === "danger") {
    return "bg-rose-50 text-rose-800";
  }

  if (tone === "warning") {
    return "bg-amber-50 text-amber-800";
  }

  if (tone === "good") {
    return "bg-emerald-50 text-emerald-800";
  }

  return "bg-sky-50 text-sky-800";
}

function getToneDotClassName(tone: SmartFinanceInsight["tone"]) {
  if (tone === "danger") {
    return "bg-rose-400";
  }

  if (tone === "warning") {
    return "bg-amber-400";
  }

  if (tone === "good") {
    return "bg-emerald-500";
  }

  return "bg-sky-500";
}

export default function SmartFinanceSummary({
  insights,
}: SmartFinanceSummaryProps) {
  const visibleInsights = insights.slice(0, 3);

  return (
    <section className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right text-[#1d1d1f] shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#fff8eb] px-2.5 py-1 text-[11px] font-black text-[#9a6b17]">
          {insights.length} תובנות
        </span>
        <div>
          <p className="text-[11px] font-bold text-slate-500">
            מבוסס על הפעולות שלך
          </p>
          <h2 className="text-sm font-black text-[#111827]">סקירה חכמה</h2>
        </div>
      </div>

      <div className="space-y-1.5">
        {visibleInsights.map((insight) => (
          <article
            key={insight.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-2.5"
          >
            <span
              className={`mt-0.5 h-7 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${getToneClassName(
                insight.tone
              )}`}
            >
              <span
                className={`ml-1 inline-block h-1.5 w-1.5 rounded-full ${getToneDotClassName(
                  insight.tone
                )}`}
              />
              חי
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-slate-950">
                {insight.title}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs font-semibold leading-5 text-slate-600">
                {insight.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
