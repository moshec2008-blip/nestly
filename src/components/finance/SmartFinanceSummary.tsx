"use client";

import type { SmartFinanceInsight } from "@/data/finance";

type SmartFinanceSummaryProps = {
  insights: SmartFinanceInsight[];
};

function getToneClassName(tone: SmartFinanceInsight["tone"]) {
  if (tone === "danger") {
    return "border-[#b86f68]/24 bg-[#b86f68]/12 text-[#f0c6bd]";
  }

  if (tone === "warning") {
    return "border-[#d8b470]/24 bg-[#d8b470]/10 text-[#f4e7c8]";
  }

  if (tone === "good") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  return "border-sky-300/20 bg-sky-400/10 text-sky-100";
}

function getToneIcon(tone: SmartFinanceInsight["tone"]) {
  if (tone === "danger") {
    return "⚠️";
  }

  if (tone === "warning") {
    return "🔔";
  }

  if (tone === "good") {
    return "✅";
  }

  return "💡";
}

export default function SmartFinanceSummary({
  insights,
}: SmartFinanceSummaryProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-5 text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 text-right">
        <p className="mb-2 text-xs font-bold text-[#a9a295]">מבוסס על הפעולות שלך</p>
        <h2 className="text-xl font-black">סיכום חכם</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-2xl border p-4 ${getToneClassName(
              insight.tone
            )}`}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="text-xl">{getToneIcon(insight.tone)}</span>

              <h3 className="text-right text-base font-black">
                {insight.title}
              </h3>
            </div>

            <p className="text-right text-sm leading-6">{insight.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
