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
    <section className="mb-4 rounded-[24px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-4 text-[#fff9ea] shadow-[0_18px_54px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-right">
          <p className="mb-1 text-xs font-bold text-[#a9a295]">
            תצוגת נתונים
          </p>
          <h2 className="text-xl font-black tracking-tight">חודש פעיל</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#a9a295]">
            בחירת חודש מסננת את הכרטיסים, התקציב, הדוחות והפעולות.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-right text-sm font-bold text-[#d7cfbf]">
          <span>בחר חודש</span>
          <select
            value={activeMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-sm font-bold text-[#fff9ea] outline-none focus:border-[#d8b470]/50 md:min-w-64"
          >
            <option value="all">כל החודשים</option>

            {months.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
