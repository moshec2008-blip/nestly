import type { MonthlyCashflowItem } from "@/data/finance";
import { formatIlsCurrency } from "@/utils/formatters";

type FinanceChartProps = {
  items: MonthlyCashflowItem[];
};

export default function FinanceChart({ items }: FinanceChartProps) {
  const visibleItems = items.slice(-6);
  const maxValue = Math.max(
    1,
    ...visibleItems.map((item) => Math.max(item.income, item.expenses))
  );

  return (
    <section className="nestly-card rounded-[20px] p-3 text-right text-[#1d1d1f]">
      <div className="mb-3 flex items-end justify-between gap-4">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          6 חודשים
        </span>
        <div>
          <p className="text-xs font-bold text-slate-600">תזרים</p>
          <h2 className="mt-1 text-lg font-bold text-[#111827]">
            מבט חודשי מהיר
          </h2>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e3d8c9] bg-[#fffdf8] p-8 text-center text-slate-600">
          אין עדיין נתונים להצגת גרף.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleItems.map((item) => {
            const incomeWidth = `${Math.max((item.income / maxValue) * 100, 4)}%`;
            const expenseWidth = `${Math.max(
              (item.expenses / maxValue) * 100,
              4
            )}%`;

            return (
              <div
                key={item.month}
                className="rounded-2xl border border-[#e3d8c9]/80 bg-white p-3"
              >
                <div className="mb-2.5 flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-slate-600">
                    {formatIlsCurrency(item.balance)}
                  </span>
                  <span className="text-sm font-bold text-[#111827]">
                    {item.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-[#f4efe7]">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{ width: incomeWidth }}
                    />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f4efe7]">
                    <div
                      className="h-2 rounded-full bg-rose-400"
                      style={{ width: expenseWidth }}
                    />
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
