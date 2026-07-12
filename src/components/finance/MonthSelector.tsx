"use client";

type MonthSelectorProps = {
  months: string[];
  activeMonth: string;
  onMonthChange: (month: string) => void;
};

function formatMonthLabel(month: string) {
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
    <section className="mb-1 rounded-[16px] border border-[#e6e8ec] bg-white px-2.5 py-2 text-right text-[#1d1d1f] shadow-[0_6px_18px_rgba(15,23,42,0.035)]">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center justify-between gap-2 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1.5 text-xs font-bold text-slate-700 sm:min-w-56">
          <span>חודש פעיל</span>
          <select
            value={activeMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="min-h-9 rounded-xl border border-[#d9dde5] bg-white px-2.5 text-right text-xs font-black text-[#111827] outline-none focus:border-[#007aff]/60"
          >
            <option value="all">כל החודשים</option>

            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-[11px] font-bold text-slate-500">תצוגת נתונים</p>
          <h2 className="text-sm font-black text-[#111827]">
            {formatMonthLabel(activeMonth)}
          </h2>
        </div>
      </div>
    </section>
  );
}
