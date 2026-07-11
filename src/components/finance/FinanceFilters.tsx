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
  "min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] shadow-sm outline-none placeholder:text-slate-600 focus:border-[#007aff]/60 focus:ring-2 focus:ring-blue-100";

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
    <section className="rounded-[18px] bg-white/88 p-2.5 text-[#111827] shadow-[0_8px_20px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onClearFilters}
          className="min-h-9 rounded-full border border-[#e6e8ec] bg-[#fafafb] px-3 text-xs font-black text-slate-700 hover:bg-white"
        >
          נקה סינון
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setShowAdvancedFilters((currentValue) => !currentValue)
            }
            className="min-h-9 rounded-full border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700 hover:bg-[#fff8eb]"
            aria-expanded={showAdvancedFilters}
          >
            סינון
          </button>
          <h2 className="text-right text-sm font-black">חיפוש</h2>
        </div>
      </div>

      <div className="grid gap-1.5 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
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
        <div className="mt-2 grid gap-2 rounded-2xl bg-[#fafafb] p-2 md:grid-cols-2">
          <label className="text-xs font-black text-slate-700">
            מתאריך
            <DateInput
              value={dateFrom}
              onChange={onDateFromChange}
              label="מתאריך"
              className="mt-1"
              inputClassName="min-h-10 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-600 focus:border-[#007aff]/60"
              buttonClassName="min-h-10 rounded-2xl border border-[#d9dde5] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
            />
          </label>

          <label className="text-xs font-black text-slate-700">
            עד תאריך
            <DateInput
              value={dateTo}
              onChange={onDateToChange}
              label="עד תאריך"
              className="mt-1"
              inputClassName="min-h-10 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-600 focus:border-[#007aff]/60"
              buttonClassName="min-h-10 rounded-2xl border border-[#d9dde5] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
            />
          </label>
        </div>
      )}
    </section>
  );
}
