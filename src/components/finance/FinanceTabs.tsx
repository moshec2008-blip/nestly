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
};

const tabs: { id: FinanceTab; label: string }[] = [
  { id: "transactions", label: "פעולות" },
  { id: "budget", label: "תקציב" },
  { id: "reports", label: "דוחות" },
  { id: "overview", label: "סקירה" },
  { id: "backup", label: "גיבוי" },
];

export default function FinanceTabs({
  activeTab,
  onTabChange,
}: FinanceTabsProps) {
  return (
    <section className="mb-2.5 overflow-x-auto rounded-[16px] border border-[#e6e8ec] bg-white p-1 shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex min-w-max gap-1">
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
                  ? "min-h-9 rounded-[13px] bg-[#111827] px-4 text-sm font-black text-white shadow-sm"
                  : "min-h-9 rounded-[13px] px-4 text-sm font-black text-slate-500 transition hover:bg-[#fafafb] hover:text-[#1d1d1f]"
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
