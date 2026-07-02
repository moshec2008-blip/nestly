import type { FinanceTab } from "@/components/finance/FinanceTabs";

type FinanceQuickActionsProps = {
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: () => void;
  onResetDemoData: () => void;
};

const secondaryActions: { label: string; tab: FinanceTab }[] = [
  { label: "בדוק תקציב", tab: "budget" },
  { label: "פתח דוחות", tab: "reports" },
  { label: "גיבוי ושחזור", tab: "backup" },
];

export default function FinanceQuickActions({
  onTabChange,
  onAddTransaction,
  onResetDemoData,
}: FinanceQuickActionsProps) {
  return (
    <section className="mb-2.5 rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={onResetDemoData}
          className="w-fit rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-white hover:text-[#111827]"
        >
          איפוס דמו
        </button>

        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            type="button"
            onClick={onAddTransaction}
            className="min-h-10 rounded-2xl bg-[#111827] px-4 py-2 text-sm font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
          >
            + הוסף פעולה חדשה
          </button>

          {secondaryActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onTabChange(action.tab)}
              className="min-h-10 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3.5 py-2 text-sm font-black text-slate-800 transition hover:-translate-y-0.5 hover:bg-white"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
