"use client";

import type { CategoryReportItem } from "@/data/finance";
import EmptyState from "@/components/ui/EmptyState";
import { formatIlsCurrency } from "@/utils/formatters";

type CategoryReportProps = {
  items: CategoryReportItem[];
};

export default function CategoryReport({ items }: CategoryReportProps) {
  return (
    <section className="nestly-card rounded-[20px] p-3 text-right text-[#1d1d1f]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">{items.length} קטגוריות הוצאה</p>

        <h2 className="text-right text-lg font-bold text-[#111827]">
          דוח קטגוריות
        </h2>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="₪"
          title="אין עדיין הוצאות בדוח"
          description="כשתוסיפו הוצאות, נראה כאן לאן הכסף הולך ונעזור לזהות קטגוריות משמעותיות."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.category}
              className="rounded-2xl border border-[#e3d8c9]/80 bg-white p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-base font-bold text-[#111827]">
                    {formatIlsCurrency(item.total)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {item.percentage}% מכלל ההוצאות
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-bold text-[#111827]">
                    {item.category}
                  </p>
                  <p className="text-sm text-slate-600">{item.count} פעולות</p>
                </div>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-[#f4efe7]">
                <div
                  className="h-full rounded-full bg-[#d8b470]"
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
