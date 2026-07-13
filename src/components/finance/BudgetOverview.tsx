"use client";

import type { BudgetReportItem } from "@/data/finance";
import { formatIlsCurrency } from "@/utils/formatters";

type BudgetOverviewProps = {
  items: BudgetReportItem[];
};

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
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "warning") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getBarClassName(status: BudgetReportItem["status"]) {
  if (status === "over") {
    return "bg-rose-400";
  }

  if (status === "warning") {
    return "bg-amber-400";
  }

  return "bg-emerald-400";
}

export default function BudgetOverview({ items }: BudgetOverviewProps) {
  return (
    <section className="nestly-card rounded-[20px] p-3 text-right text-[#1d1d1f]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          תקציב לפי הקטגוריות של החודש האחרון
        </p>

        <h2 className="text-right text-lg font-bold text-[#111827]">מעקב תקציב</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e3d8c9] bg-[#fffdf8] p-8 text-center text-slate-600">
          אין עדיין תקציבים להצגה.
        </div>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {items.map((item) => {
            const barWidth = Math.min(item.percentage, 100);

            return (
              <div
                key={item.category}
                className="rounded-2xl border border-[#e3d8c9]/80 bg-white p-3"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
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
                    <p className="text-base font-bold text-[#111827]">
                      {item.category}
                    </p>
                    <p className="text-sm text-slate-600">
                      נוצל {item.percentage}% מהתקציב
                    </p>
                  </div>
                </div>

                <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-[#f4efe7]">
                  <div
                    className={`h-full rounded-full ${getBarClassName(
                      item.status
                    )}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-xl bg-[#fffdf8] p-2.5 ring-1 ring-[#e3d8c9]/70">
                    <p className="text-xs text-slate-600">תקציב</p>
                    <p className="mt-1 font-bold text-[#111827]">
                      {item.limit > 0 ? formatIlsCurrency(item.limit) : "לא מוגדר"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#fffdf8] p-2.5 ring-1 ring-[#e3d8c9]/70">
                    <p className="text-xs text-slate-600">נוצל</p>
                    <p className="mt-1 font-bold text-[#111827]">
                      {formatIlsCurrency(item.spent)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#fffdf8] p-2.5 ring-1 ring-[#e3d8c9]/70">
                    <p className="text-xs text-slate-600">נותר</p>
                    <p
                      className={
                        item.remaining < 0
                          ? "mt-1 font-bold text-rose-700"
                          : "mt-1 font-bold text-emerald-700"
                      }
                    >
                      {item.limit > 0 ? formatIlsCurrency(item.remaining) : "—"}
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
