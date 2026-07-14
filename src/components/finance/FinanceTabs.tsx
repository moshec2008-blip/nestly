"use client";

import type { ReactNode } from "react";

export type FinanceTab = "transactions" | "budget" | "reports" | "backup";

type FinanceTabsProps = {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  onAddTransaction: () => void;
  scanSlot?: ReactNode;
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
  scanSlot,
}: FinanceTabsProps) {
  return (
    <section className="mb-4 rounded-2xl border border-[#eadfcd]/70 bg-white/82 p-1.5 shadow-[0_12px_30px_rgba(33,43,63,0.055)]">
      <div className="flex items-stretch gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={onAddTransaction}
          className="nestly-primary-action min-h-11 shrink-0 whitespace-nowrap rounded-2xl bg-[#111827] px-4 text-xs font-black text-white shadow-[0_12px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
        >
          + הוסף פעולה
        </button>

        {scanSlot && <div className="flex shrink-0 items-stretch">{scanSlot}</div>}

        <div className="flex flex-1 items-stretch justify-end gap-1.5">
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
                    ? "min-h-11 flex-1 whitespace-nowrap rounded-2xl bg-[#fff8eb] px-4 text-xs font-black text-[#111827] shadow-sm ring-1 ring-[#d8b470]/35 sm:flex-none"
                    : "min-h-11 flex-1 whitespace-nowrap rounded-2xl px-4 text-xs font-bold text-slate-500 transition hover:bg-[#fff8eb] hover:text-[#1d1d1f] sm:flex-none"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
