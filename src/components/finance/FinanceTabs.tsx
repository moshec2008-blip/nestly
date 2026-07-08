"use client";

export type FinanceTab =
  | "overview"
  | "transactions"
  | "budget"
  | "reports"
  | "backup";

type FinanceTabsProps = {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: () => void;
};

const tabs: { id: FinanceTab; label: string }[] = [
  { id: "transactions", label: "פעולות" },
  { id: "budget", label: "תקציב" },
  { id: "reports", label: "דוחות" },
  { id: "backup", label: "גיבוי" },
];

export default function FinanceTabs({
  activeTab,
  onTabChange,
  onAddTransaction,
}: FinanceTabsProps) {
  return (
    <section className="mb-2.5 rounded-[18px] border border-[#e6e8ec] bg-white p-1.5 shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
        <button
          type="button"
          onClick={onAddTransaction}
          className="nestly-primary-action min-h-11 rounded-[14px] bg-[#111827] px-4 text-sm font-black text-white shadow-sm sm:min-w-36"
        >
          + הוסף פעולה
        </button>

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-pressed={isActive}
              className={
                isActive
                  ? "min-h-11 rounded-[14px] bg-[#111827] px-4 text-sm font-black text-white shadow-sm"
                  : "min-h-11 rounded-[14px] px-4 text-sm font-black text-slate-700 transition hover:bg-[#fafafb] hover:text-[#1d1d1f]"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
