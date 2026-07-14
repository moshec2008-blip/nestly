"use client";

import type { MonthlyCashflowItem } from "@/data/finance";
import EmptyState from "@/components/ui/EmptyState";
import { formatIlsCurrency } from "@/utils/formatters";

type MonthlyCashflowProps = {
  items: MonthlyCashflowItem[];
};

export default function MonthlyCashflow({ items }: MonthlyCashflowProps) {
  const maxValue = Math.max(
    1,
    ...items.map((item) => Math.max(item.income, item.expenses))
  );

  return (
    <section className="nestly-card rounded-[20px] p-3 text-right text-[#1d1d1f]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">{items.length} חודשים</p>

        <h2 className="text-right text-lg font-bold text-[#111827]">
          תזרים חודשי
        </h2>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="↕"
          title="אין עדיין תזרים חודשי"
          description="ברגע שיהיו מספיק פעולות, נראה כאן את היחס בין הכנסות להוצאות לאורך זמן."
        />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-[720px] items-end gap-4 rounded-2xl border border-[#e3d8c9]/80 bg-white p-4">
            {items.map((item) => {
              const incomeHeight = Math.max((item.income / maxValue) * 100, 6);
              const expenseHeight = Math.max(
                (item.expenses / maxValue) * 100,
                6
              );

              return (
                <div key={item.month} className="flex flex-1 flex-col gap-3">
                  <div className="flex h-40 items-end justify-center gap-2">
                    <div
                      title={`הכנסות: ${formatIlsCurrency(item.income)}`}
                      className="w-8 rounded-t-lg bg-emerald-400"
                      style={{ height: `${incomeHeight}%` }}
                    />

                    <div
                      title={`הוצאות: ${formatIlsCurrency(item.expenses)}`}
                      className="w-8 rounded-t-lg bg-rose-400"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </div>

                  <div className="rounded-xl bg-[#fffdf8] p-2.5 text-center ring-1 ring-[#e3d8c9]/70">
                    <p className="text-sm font-bold text-[#111827]">
                      {item.label}
                    </p>

                    <p
                      className={
                        item.balance >= 0
                          ? "mt-1 text-xs font-bold text-emerald-700"
                          : "mt-1 text-xs font-bold text-rose-700"
                      }
                    >
                      {formatIlsCurrency(item.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-slate-600">הכנסות</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="text-slate-600">הוצאות</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
