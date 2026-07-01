import type { FinanceTab } from "@/components/finance/FinanceTabs";

type FinanceQuickActionsProps = {
  onTabChange: (tab: FinanceTab) => void;
  onResetDemoData: () => void;
};

const actions: { label: string; tab: FinanceTab }[] = [
  { label: "הוסף פעולה", tab: "transactions" },
  { label: "בדוק תקציב", tab: "budget" },
  { label: "פתח דוחות", tab: "reports" },
  { label: "גיבוי ושחזור", tab: "backup" },
];

export default function FinanceQuickActions({
  onTabChange,
  onResetDemoData,
}: FinanceQuickActionsProps) {
  return (
    <section className="mb-5 rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-4 text-right shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={onResetDemoData}
          className="w-fit rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-2.5 text-sm font-bold text-[#d7cfbf] transition hover:bg-white/[0.1]"
        >
          איפוס דמו
        </button>

        <div className="flex flex-wrap justify-end gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onTabChange(action.tab)}
              className="rounded-2xl bg-[#f4e7c8] px-4 py-2.5 text-sm font-black text-[#080b16] shadow-[0_14px_34px_rgba(216,180,112,0.14)] transition hover:-translate-y-0.5 hover:bg-[#fff3d6]"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
