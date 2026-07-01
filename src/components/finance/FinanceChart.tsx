import type { MonthlyCashflowItem } from "@/data/finance";

type FinanceChartProps = {
  items: MonthlyCashflowItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FinanceChart({ items }: FinanceChartProps) {
  const visibleItems = items.slice(-6);
  const maxValue = Math.max(
    1,
    ...visibleItems.map((item) => Math.max(item.income, item.expenses))
  );

  return (
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-4 text-right text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">
          6 חודשים
        </span>
        <div>
          <p className="text-xs font-bold text-[#a9a295]">תזרים</p>
          <h2 className="mt-1 text-xl font-black">מבט חודשי מהיר</h2>
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(216,180,112,0.18)] bg-white/[0.04] p-8 text-center text-[#a9a295]">
          אין עדיין נתונים להצגת גרף.
        </div>
      ) : (
        <div className="space-y-2.5">
          {visibleItems.map((item) => {
            const incomeWidth = `${Math.max((item.income / maxValue) * 100, 4)}%`;
            const expenseWidth = `${Math.max(
              (item.expenses / maxValue) * 100,
              4
            )}%`;

            return (
              <div
                key={item.month}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3.5"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-[#d7cfbf]">
                    {formatCurrency(item.balance)}
                  </span>
                  <span className="text-sm font-black text-[#fff9ea]">
                    {item.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-l from-emerald-200/90 to-emerald-400/70"
                      style={{ width: incomeWidth }}
                    />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-l from-[#e7b7a8]/90 to-[#b86f68]/70"
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
