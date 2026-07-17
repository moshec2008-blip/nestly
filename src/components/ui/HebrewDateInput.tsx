"use client";

import { useEffect, useMemo, useState } from "react";
import { HDate, gematriya } from "hebcal";

// בורר תאריך עברי אמיתי: יום, חודש ושנה עבריים — נשמר כתאריך לועזי (ISO)
// כדי שכל שאר המערכת תמשיך לעבוד כרגיל.

type HebrewDateInputProps = {
  value: string; // ISO גרגוריאני
  onChange: (isoDate: string) => void;
  className?: string;
  autoInitialize?: boolean;
};

// מספור חודשים של hebcal: ניסן=1 ... אלול=6, תשרי=7 ... אדר=12, אדר ב׳=13
const monthOrder = [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6];

const monthLabels: Record<number, string> = {
  7: "תשרי",
  8: "חשוון",
  9: "כסלו",
  10: "טבת",
  11: "שבט",
  12: "אדר",
  13: "אדר ב׳",
  1: "ניסן",
  2: "אייר",
  3: "סיון",
  4: "תמוז",
  5: "אב",
  6: "אלול",
};

const dayGematria = [
  "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", "י׳",
  "י״א", "י״ב", "י״ג", "י״ד", "ט״ו", "ט״ז", "י״ז", "י״ח", "י״ט", "כ׳",
  "כ״א", "כ״ב", "כ״ג", "כ״ד", "כ״ה", "כ״ו", "כ״ז", "כ״ח", "כ״ט", "ל׳",
];

function isHebrewLeapYear(year: number) {
  return ((7 * year + 1) % 19) < 7;
}

function toIsoDate(date: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatHebrewYear(year: number) {
  // שנה עברית בגימטריה — התשפ"ו ולא 5786.
  try {
    return gematriya(year);
  } catch {
    return String(year);
  }
}

function parseValue(value: string) {
  // חשוב: לא new Date("YYYY-MM-DD") — זה מפורש כ-UTC וגולש יום אחורה
  // בשעון ישראל, מה שגרם לקוביות להציג יום עברי שגוי אחרי בחירה.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");

  if (!match) {
    return new HDate(new Date());
  }

  const localDate = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );

  if (Number.isNaN(localDate.getTime())) {
    return new HDate(new Date());
  }

  return new HDate(localDate);
}

export default function HebrewDateInput({
  value,
  onChange,
  className = "",
  autoInitialize = true,
}: HebrewDateInputProps) {
  // הבחירה חיה ב-state מקומי — מה שהמשתמש בחר תמיד מוצג בקוביות,
  // וההמרה ללועזי נשלחת החוצה בלי לחשב את הקוביות מחדש ממנה.
  const [selection, setSelection] = useState(() => {
    const initial = parseValue(value);
    return {
      day: initial.getDate(),
      month: initial.getMonth(),
      year: initial.getFullYear(),
    };
  });

  // אם אין עדיין תאריך בטופס — משדרים את ברירת המחדל (היום) כבר בהתחלה,
  // כדי שהטופס לא יישאר עם תאריך ריק כשלא נוגעים בקוביות.
  useEffect(() => {
    if (autoInitialize && !value) {
      const initial = new HDate(selection.day, selection.month, selection.year);
      onChange(toIsoDate(initial.greg()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentHebrewYear = new HDate(new Date()).getFullYear();
  const selectedYear = selection.year;
  const selectedMonth = selection.month;
  const selectedDay = selection.day;
  const isLeap = isHebrewLeapYear(selectedYear);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    // טווח נדיב: 121 שנים אחורה ושנתיים קדימה (יארצייטים וימי הולדת).
    for (let year = currentHebrewYear + 2; year >= currentHebrewYear - 121; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentHebrewYear]);

  function emit(day: number, month: number, year: number) {
    // אדר ב׳ בשנה לא-מעוברת חוזר לאדר רגיל.
    const safeMonth = month === 13 && !isHebrewLeapYear(year) ? 12 : month;
    let candidate = new HDate(day, safeMonth, year);

    // ל׳ בחודש קצר מתגלגל — נצמד לכ״ט לפי המנהג.
    if (candidate.getMonth() !== safeMonth || candidate.getDate() !== day) {
      candidate = new HDate(29, safeMonth, year);
    }

    setSelection({
      day: candidate.getDate(),
      month: candidate.getMonth(),
      year: candidate.getFullYear(),
    });
    onChange(toIsoDate(candidate.greg()));
  }

  const selectClass =
    "nestly-hebrew-date-select min-h-11 rounded-2xl border border-[#cfc4b5] bg-white px-2 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/60";

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-1.5">
        <label className="text-[11px] font-black text-slate-600">
          יום
          <select
            value={selectedDay}
            onChange={(event) =>
              emit(Number(event.target.value), selectedMonth, selectedYear)
            }
            className={`mt-1 w-full ${selectClass}`}
            aria-label="יום עברי"
          >
            {dayGematria.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-[11px] font-black text-slate-600">
          חודש
          <select
            value={selectedMonth}
            onChange={(event) =>
              emit(selectedDay, Number(event.target.value), selectedYear)
            }
            className={`mt-1 w-full ${selectClass}`}
            aria-label="חודש עברי"
          >
            {monthOrder
              .filter((month) => month !== 13 || isLeap)
              .map((month) => (
                <option key={month} value={month}>
                  {month === 12 && isLeap ? "אדר א׳" : monthLabels[month]}
                </option>
              ))}
          </select>
        </label>

        <label className="text-[11px] font-black text-slate-600">
          שנה
          <select
            value={selectedYear}
            onChange={(event) =>
              emit(selectedDay, selectedMonth, Number(event.target.value))
            }
            className={`mt-1 w-full ${selectClass}`}
            aria-label="שנה עברית"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {formatHebrewYear(year)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-1 text-[11px] font-bold text-slate-500">
        לועזי: {value || "—"}
      </p>
    </div>
  );
}
