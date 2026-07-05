import type { FinanceTab } from "@/components/finance/FinanceTabs";

type FinanceQuickActionsProps = {
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: () => void;
  onResetDemoData: () => void;
};

const quickActions: Array<{ label: string; tab?: FinanceTab; accent?: string }> = [
  { label: "הוסף", tab: undefined, accent: "bg-[#111827] text-white" },
  { label: "תקציב", tab: "budget" },
  { label: "דוחות", tab: "reports" },
  { label: "גיבוי", tab: "backup" },
];

export default function FinanceQuickActions({
  onTabChange,
  onAddTransaction,
  onResetDemoData,
}: FinanceQuickActionsProps) {
  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white/95 p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                if (action.tab) {
                  onTabChange(action.tab);
                  return;
                }

                onAddTransaction();
              }}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-full px-3.5 py-2 text-sm font-black transition ${
                action.accent ?? "border border-[#e6e8ec] bg-[#fafafb] text-slate-700"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onResetDemoData}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#e6e8ec] bg-white px-3.5 py-2 text-sm font-black text-slate-700"
        >
          איפוס דמו
        </button>
      </div>
    </section>
  );
}
