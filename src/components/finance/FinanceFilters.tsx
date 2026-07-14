"use client";

import { useState } from "react";
import DateInput from "@/components/ui/DateInput";

export type TransactionTypeFilter = "all" | "income" | "expense";
export type TransactionStatusFilter = "all" | "done" | "pending";

type FinanceFiltersProps = {
  searchValue: string;
  typeFilter: TransactionTypeFilter;
  statusFilter: TransactionStatusFilter;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  onStatusFilterChange: (value: TransactionStatusFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClearFilters: () => void;
};

const fieldClass =
  "min-h-12 rounded-2xl border border-[#d9dde5]/80 bg-white px-4 text-right text-sm font-semibold text-[#111827] shadow-sm outline-none placeholder:text-slate-400 focus:border-[#007aff]/60 focus:ring-2 focus:ring-blue-100";

export default function FinanceFilters({
  searchValue,
  typeFilter,
  statusFilter,
  dateFrom,
  dateTo,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: FinanceFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <section className="rounded-[22px] bg-white/88 p-4 text-[#111827] shadow-[0_12px_30px_rgba(15,23,42,0.045)] ring-1 ring-[#e6e8ec]/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClearFilters}
          className="min-h-10 rounded-full border border-[#e6e8ec] bg-transparent px-4 text-xs font-black text-slate-500 hover:bg-white hover:text-[#111827]"
        >
          נקה סינון
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setShowAdvancedFilters((currentValue) => !currentValue)
            }
            className="min-h-10 rounded-full border border-[#e6e8ec] bg-white px-4 text-xs font-black text-slate-600 hover:bg-[#fff8eb] hover:text-[#111827]"
            aria-expanded={showAdvancedFilters}
          >
            סינון
          </button>
          <h2 className="text-right text-base font-black text-[#111827]">חיפוש</h2>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="חיפוש לפי שם, קטגוריה או תאריך"
          className={fieldClass}
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as TransactionTypeFilter)
          }
          className={fieldClass}
        >
          <option value="all">כל הסוגים</option>
          <option value="income">הכנסות בלבד</option>
          <option value="expense">הוצאות בלבד</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as TransactionStatusFilter)
          }
          className={fieldClass}
        >
          <option value="all">כל הסטטוסים</option>
          <option value="done">בוצע בלבד</option>
          <option value="pending">פעולות עתידיות בלבד</option>
        </select>
      </div>

      {showAdvancedFilters && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-[#fafafb]/90 p-4 md:grid-cols-2">
          <label className="text-xs font-black text-slate-500">
            מתאריך
            <DateInput
              value={dateFrom}
              onChange={onDateFromChange}
              label="מתאריך"
              className="mt-1"
              inputClassName="min-h-11 w-full rounded-2xl border border-[#d9dde5]/80 bg-white px-4 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/60"
              buttonClassName="min-h-11 rounded-2xl border border-[#d9dde5]/80 bg-white px-3 text-xs font-black text-slate-500 transition hover:bg-[#fff8eb] hover:text-[#111827]"
            />
          </label>

          <label className="text-xs font-black text-slate-500">
            עד תאריך
            <DateInput
              value={dateTo}
              onChange={onDateToChange}
              label="עד תאריך"
              className="mt-1"
              inputClassName="min-h-11 w-full rounded-2xl border border-[#d9dde5]/80 bg-white px-4 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/60"
              buttonClassName="min-h-11 rounded-2xl border border-[#d9dde5]/80 bg-white px-3 text-xs font-black text-slate-500 transition hover:bg-[#fff8eb] hover:text-[#111827]"
            />
          </label>
        </div>
      )}
    </section>
  );
}
