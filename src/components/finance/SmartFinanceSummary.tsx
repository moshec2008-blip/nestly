"use client";

import type { SmartFinanceInsight } from "@/data/finance";

type SmartFinanceSummaryProps = {
  insights: SmartFinanceInsight[];
};

function getToneClassName(tone: SmartFinanceInsight["tone"]) {
  if (tone === "danger") {
    return "border-rose-100 bg-rose-50 text-rose-800";
  }

  if (tone === "warning") {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }

  if (tone === "good") {
    return "border-emerald-100 bg-emerald-50 text-emerald-800";
  }

  return "border-sky-100 bg-sky-50 text-sky-800";
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
  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-3 text-right text-[#1d1d1f] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {insights.length} תובנות
        </span>
        <div>
          <p className="text-[11px] font-bold text-slate-500">
            מבוסס על הפעולות שלך
          </p>
          <h2 className="text-sm font-black text-[#111827]">סיכום חכם</h2>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {insights.slice(0, 4).map((insight) => (
          <article
            key={insight.id}
            className={`rounded-2xl border p-2.5 ${getToneClassName(
              insight.tone
            )}`}
          >
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span
                className={`h-1.5 w-1.5 rounded-full ${getToneDotClassName(
                  insight.tone
                )}`}
              />
              <h3 className="truncate text-sm font-black">{insight.title}</h3>
            </div>

            <p className="line-clamp-2 text-xs font-semibold leading-5">
              {insight.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
