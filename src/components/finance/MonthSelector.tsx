"use client";

type MonthSelectorProps = {
  months: string[];
  activeMonth: string;
  onMonthChange: (month: string) => void;
};

export function formatMonthLabel(month: string) {
  if (month === "all") {
    return "כל החודשים";
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function MonthSelector({
  months,
  activeMonth,
  onMonthChange,
}: MonthSelectorProps) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] px-2.5 py-1.5 text-xs font-bold text-slate-700">
      <span className="whitespace-nowrap">חודש פעיל</span>
      <select
        value={activeMonth}
        onChange={(event) => onMonthChange(event.target.value)}
        className="min-h-10 min-w-0 rounded-xl border border-[#e3d8c9] bg-white px-2.5 text-right text-xs font-bold text-[#111827] outline-none focus:border-[#111827]"
      >
        <option value="all">כל החודשים</option>

        {months.map((month) => (
          <option key={month} value={month}>
            {formatMonthLabel(month)}
          </option>
        ))}
      </select>
    </label>
  );
}
