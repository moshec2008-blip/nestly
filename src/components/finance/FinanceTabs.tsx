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
    <section className="mb-2 rounded-[16px] border border-[#eadfcd] bg-white/88 p-1 shadow-[0_8px_20px_rgba(33,43,63,0.045)]">
      <div className="grid grid-cols-[1.15fr_repeat(4,1fr)] gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={onAddTransaction}
          className="nestly-primary-action min-h-10 whitespace-nowrap rounded-[13px] bg-[#111827] px-3 text-xs font-black text-white shadow-[0_10px_22px_rgba(17,24,39,0.14)]"
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
                  ? "min-h-10 whitespace-nowrap rounded-[13px] bg-[#fff8eb] px-3 text-xs font-black text-[#111827] shadow-sm ring-1 ring-[#d8b470]/35"
                  : "min-h-10 whitespace-nowrap rounded-[13px] px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb] hover:text-[#1d1d1f]"
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
