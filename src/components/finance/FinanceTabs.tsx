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
    <section className="mb-2.5 rounded-[18px] border border-[#eadfcd] bg-[#fffdf8]/95 p-1.5 shadow-[0_10px_26px_rgba(33,43,63,0.065)]">
      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center">
        <button
          type="button"
          onClick={onAddTransaction}
          className="nestly-primary-action min-h-11 rounded-[14px] bg-[#111827] px-4 text-sm font-black text-white shadow-[0_12px_26px_rgba(17,24,39,0.18)] sm:min-w-36"
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
                  ? "min-h-11 rounded-[14px] bg-white px-4 text-sm font-black text-[#111827] shadow-[0_8px_20px_rgba(33,43,63,0.08)]"
                  : "min-h-11 rounded-[14px] px-4 text-sm font-black text-slate-700 transition hover:bg-white hover:text-[#1d1d1f]"
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
