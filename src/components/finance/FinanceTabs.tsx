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

const tabs: { id: FinanceTab; label: string; description: string }[] = [
  {
    id: "overview",
    label: "סקירה",
    description: "תמונת מצב",
  },
  {
    id: "transactions",
    label: "פעולות",
    description: "הוספה ועריכה",
  },
  {
    id: "budget",
    label: "תקציב",
    description: "מעקב חריגות",
  },
  {
    id: "reports",
    label: "דוחות",
    description: "ניתוח נתונים",
  },
  {
    id: "backup",
    label: "גיבוי",
    description: "ייבוא וייצוא",
  },
];

export default function FinanceTabs({
  activeTab,
  onTabChange,
}: FinanceTabsProps) {
  return (
    <section className="mb-3 overflow-x-auto rounded-[18px] border border-[#e6e8ec] bg-white p-1.5 shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
      <div className="flex min-w-max gap-2">
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
                  ? "min-w-28 rounded-[16px] bg-[#111827] px-4 py-2.5 text-right text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                  : "min-w-28 rounded-[16px] px-4 py-2.5 text-right text-slate-500 transition hover:bg-[#fafafb] hover:text-[#1d1d1f]"
              }
            >
              <p className="text-sm font-black">{tab.label}</p>
              <p className="mt-0.5 text-[11px] opacity-70">{tab.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
