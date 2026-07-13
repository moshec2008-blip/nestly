"use client";

import { useEffect, useMemo, useState } from "react";

// בורר תאריך לועזי בקוביות: יום → חודש → שנה, משמאל לימין,
// במקום שדה התאריך של הדפדפן שסדר התצוגה שלו תלוי-מכשיר.

type GregorianDateInputProps = {
  value: string; // ISO
  onChange: (isoDate: string) => void;
  className?: string;
};

const monthNames = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function toIso(day: number, month: number, year: number) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");

  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
}

export default function GregorianDateInput({
  value,
  onChange,
  className = "",
}: GregorianDateInputProps) {
  const [selection, setSelection] = useState(() => parseValue(value));

  // טופס שנפתח בלי תאריך מקבל את היום הנוכחי כבר בהתחלה.
  useEffect(() => {
    if (!value) {
      onChange(toIso(selection.day, selection.month, selection.year));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let year = currentYear + 2; year >= currentYear - 121; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  function emit(day: number, month: number, year: number) {
    const safeDay = Math.min(day, daysInMonth(month, year));
    setSelection({ day: safeDay, month, year });
    onChange(toIso(safeDay, month, year));
  }

  const selectClass =
    "nestly-hebrew-date-select min-h-11 w-full rounded-2xl border border-[#cfc4b5] bg-white px-2 text-center text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/60";

  return (
    <div className={className}>
      {/* dir=ltr קובע: יום שמאלי, שנה ימנית — בכל מכשיר */}
      <div dir="ltr" className="grid grid-cols-3 gap-1.5">
        <label className="text-center text-[11px] font-black text-slate-600">
          יום
          <select
            value={selection.day}
            onChange={(event) =>
              emit(Number(event.target.value), selection.month, selection.year)
            }
            className={`mt-1 ${selectClass}`}
            aria-label="יום"
          >
            {Array.from(
              { length: daysInMonth(selection.month, selection.year) },
              (_, index) => index + 1
            ).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <label className="text-center text-[11px] font-black text-slate-600">
          חודש
          <select
            value={selection.month}
            onChange={(event) =>
              emit(selection.day, Number(event.target.value), selection.year)
            }
            className={`mt-1 ${selectClass}`}
            aria-label="חודש"
          >
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-center text-[11px] font-black text-slate-600">
          שנה
          <select
            value={selection.year}
            onChange={(event) =>
              emit(selection.day, selection.month, Number(event.target.value))
            }
            className={`mt-1 ${selectClass}`}
            aria-label="שנה"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
