"use client";

import type { MonthlyCashflowItem } from "@/data/finance";

type MonthlyCashflowProps = {
  items: MonthlyCashflowItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MonthlyCashflow({ items }: MonthlyCashflowProps) {
  const maxValue = Math.max(
    1,
    ...items.map((item) => Math.max(item.income, item.expenses))
  );

  return (
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-5 text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-[#a9a295]">{items.length} חודשים</p>

        <h2 className="text-right text-xl font-black">תזרים חודשי</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(216,180,112,0.18)] bg-white/[0.04] p-8 text-center text-[#a9a295]">
          אין נתונים להצגה בתזרים.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex min-w-[720px] items-end gap-4 rounded-[22px] border border-white/10 bg-white/[0.045] p-5">
            {items.map((item) => {
              const incomeHeight = Math.max((item.income / maxValue) * 100, 6);
              const expenseHeight = Math.max(
                (item.expenses / maxValue) * 100,
                6
              );

              return (
                <div key={item.month} className="flex flex-1 flex-col gap-4">
                  <div className="flex h-40 items-end justify-center gap-2">
                    <div
                      title={`הכנסות: ${formatCurrency(item.income)}`}
                      className="w-8 rounded-t-2xl bg-gradient-to-t from-emerald-500/65 to-emerald-200/90"
                      style={{ height: `${incomeHeight}%` }}
                    />

                    <div
                      title={`הוצאות: ${formatCurrency(item.expenses)}`}
                      className="w-8 rounded-t-2xl bg-gradient-to-t from-[#b86f68]/70 to-[#e7b7a8]/90"
                      style={{ height: `${expenseHeight}%` }}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3 text-center">
                    <p className="text-sm font-black text-[#fff9ea]">
                      {item.label}
                    </p>

                    <p
                      className={
                        item.balance >= 0
                          ? "mt-1 text-xs font-bold text-emerald-200"
                          : "mt-1 text-xs font-bold text-[#e7b7a8]"
                      }
                    >
                      {formatCurrency(item.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-300/80" />
              <span className="text-[#d7cfbf]">הכנסות</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#e7b7a8]/80" />
              <span className="text-[#d7cfbf]">הוצאות</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
