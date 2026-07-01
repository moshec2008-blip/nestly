"use client";

export type TransactionTypeFilter = "all" | "income" | "expense";
export type TransactionStatusFilter = "all" | "done" | "pending";

type FinanceFiltersProps = {
  searchValue: string;
  typeFilter: TransactionTypeFilter;
  statusFilter: TransactionStatusFilter;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  onStatusFilterChange: (value: TransactionStatusFilter) => void;
  onClearFilters: () => void;
};

export default function FinanceFilters({
  searchValue,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onClearFilters,
}: FinanceFiltersProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-5 text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.1]"
        >
          נקה סינון
        </button>

        <h2 className="text-right text-xl font-black">חיפוש וסינון</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="חיפוש לפי שם, קטגוריה או תאריך"
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-[#8f8879] focus:border-[#d8b470]/50"
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as TransactionTypeFilter)
          }
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none focus:border-[#d8b470]/50"
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
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none focus:border-[#d8b470]/50"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="done">בוצע בלבד</option>
          <option value="pending">ממתין בלבד</option>
        </select>
      </div>
    </section>
  );
}
