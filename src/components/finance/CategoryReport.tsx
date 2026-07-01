"use client";

import type { CategoryReportItem } from "@/data/finance";

type CategoryReportProps = {
  items: CategoryReportItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CategoryReport({ items }: CategoryReportProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-5 text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-[#a9a295]">
          {items.length} קטגוריות הוצאה
        </p>

        <h2 className="text-right text-xl font-black">דוח קטגוריות</h2>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(216,180,112,0.18)] bg-white/[0.04] p-8 text-center text-[#a9a295]">
          אין עדיין הוצאות להצגה בדוח.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.category} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-lg font-black text-[#fff9ea]">
                    {formatCurrency(item.total)}
                  </p>
                  <p className="text-sm text-[#a9a295]">
                    {item.percentage}% מכלל ההוצאות
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-black text-[#fff9ea]">
                    {item.category}
                  </p>
                  <p className="text-sm text-[#a9a295]">
                    {item.count} פעולות
                  </p>
                </div>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#f4e7c8] to-[#d8b470]"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
