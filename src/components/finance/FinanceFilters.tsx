"use client";

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
  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClearFilters}
          className="min-h-10 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-sm font-bold text-slate-700 hover:bg-white"
        >
          נקה סינון
        </button>

        <h2 className="text-right text-sm font-black">חיפוש וסינון</h2>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="חיפוש לפי שם, קטגוריה או תאריך"
          className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/50"
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as TransactionTypeFilter)
          }
          className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/50"
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
          className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/50"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="done">בוצע בלבד</option>
          <option value="pending">פעולות עתידיות בלבד</option>
        </select>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <label className="text-xs font-black text-slate-600">
          מתאריך
          <DateInput
            value={dateFrom}
            onChange={onDateFromChange}
            label="מתאריך"
            className="mt-1"
            inputClassName="min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/50"
            buttonClassName="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-xs font-black text-slate-700 transition hover:bg-white"
          />
        </label>

        <label className="text-xs font-black text-slate-600">
          עד תאריך
          <DateInput
            value={dateTo}
            onChange={onDateToChange}
            label="עד תאריך"
            className="mt-1"
            inputClassName="min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/50"
            buttonClassName="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-xs font-black text-slate-700 transition hover:bg-white"
          />
        </label>
      </div>
    </section>
  );
}
