"use client";

import type { BudgetReportItem } from "@/data/finance";

type BudgetOverviewProps = {
  items: BudgetReportItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusText(status: BudgetReportItem["status"]) {
  if (status === "over") {
    return "חריגה";
  }

  if (status === "warning") {
    return "קרוב לגבול";
  }

  return "תקין";
}

function getStatusClassName(status: BudgetReportItem["status"]) {
  if (status === "over") {
    return "border border-[#b86f68]/24 bg-[#b86f68]/12 text-[#f0c6bd]";
  }

  if (status === "warning") {
    return "border border-[#d8b470]/24 bg-[#d8b470]/10 text-[#f4e7c8]";
  }

  return "border border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
}

function getBarClassName(status: BudgetReportItem["status"]) {
  if (status === "over") {
    return "bg-gradient-to-l from-[#e7b7a8] to-[#b86f68]";
  }

  if (status === "warning") {
    return "bg-gradient-to-l from-[#f4e7c8] to-[#d8b470]";
  }

  return "bg-gradient-to-l from-emerald-200 to-emerald-400";
}

export default function BudgetOverview({ items }: BudgetOverviewProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-5 text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-[#a9a295]">
          תקציב לפי הקטגוריות של החודש האחרון
        </p>

        <h2 className="text-right text-xl font-black">מעקב תקציב</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(216,180,112,0.18)] bg-white/[0.04] p-8 text-center text-[#a9a295]">
          אין עדיין תקציבים להצגה.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const barWidth = Math.min(item.percentage, 100);

            return (
              <div key={item.category} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="text-left">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                        item.status
                      )}`}
                    >
                      {getStatusText(item.status)}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-[#fff9ea]">
                      {item.category}
                    </p>
                    <p className="text-sm text-[#a9a295]">
                      נוצל {item.percentage}% מהתקציב
                    </p>
                  </div>
                </div>

                <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={`h-full rounded-full ${getBarClassName(
                      item.status
                    )}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <p className="text-[#a9a295]">תקציב</p>
                    <p className="mt-1 font-black">
                      {item.limit > 0 ? formatCurrency(item.limit) : "לא מוגדר"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <p className="text-[#a9a295]">נוצל</p>
                    <p className="mt-1 font-black">
                      {formatCurrency(item.spent)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                    <p className="text-[#a9a295]">נותר</p>
                    <p
                      className={
                        item.remaining < 0
                          ? "mt-1 font-black text-[#e7b7a8]"
                          : "mt-1 font-black text-emerald-200"
                      }
                    >
                      {item.limit > 0
                        ? formatCurrency(item.remaining)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
