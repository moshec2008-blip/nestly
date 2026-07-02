"use client";

import { useEffect, useId, useRef, useState } from "react";

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
};

const defaultInputClass =
  "min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#007aff]/60 focus:ring-4 focus:ring-[#007aff]/10";

const defaultButtonClass =
  "min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 hover:text-[#111827]";

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function toIsoDate(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parseDateInput(rawValue: string) {
  const value = rawValue.trim();

  if (!value) {
    return "";
  }

  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    return isValidDate(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  const localMatch = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);

  if (localMatch) {
    const day = Number(localMatch[1]);
    const month = Number(localMatch[2]);
    let year = Number(localMatch[3]);

    if (year < 100) {
      year += year >= 50 ? 1900 : 2000;
    }

    return isValidDate(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  return null;
}

function formatIsoDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export default function DateInput({
  value,
  onChange,
  required,
  label,
  ariaLabel,
  className = "",
  inputClassName = defaultInputClass,
  buttonClassName = defaultButtonClass,
}: DateInputProps) {
  const generatedId = useId();
  const nativeDateRef = useRef<HTMLInputElement | null>(null);
  const [displayValue, setDisplayValue] = useState(() => formatIsoDate(value));

  useEffect(() => {
    setDisplayValue(formatIsoDate(value));
  }, [value]);

  function commitDate(rawValue: string) {
    const parsedDate = parseDateInput(rawValue);

    if (parsedDate !== null) {
      onChange(parsedDate);
    }
  }

  function openNativePicker() {
    const picker = nativeDateRef.current as
      | (HTMLInputElement & { showPicker?: () => void })
      | null;

    if (!picker) {
      return;
    }

    if (picker.showPicker) {
      picker.showPicker();
      return;
    }

    picker.click();
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={generatedId}
        value={displayValue}
        onChange={(event) => {
          setDisplayValue(event.target.value);
          commitDate(event.target.value);
        }}
        onBlur={() => {
          const parsedDate = parseDateInput(displayValue);

          if (parsedDate === null) {
            setDisplayValue(formatIsoDate(value));
          }
        }}
        required={required}
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        aria-label={ariaLabel ?? label ?? "תאריך"}
        className={inputClassName}
        dir="ltr"
      />
      <button
        type="button"
        onClick={openNativePicker}
        className={buttonClassName}
        aria-label={`בחר ${label ?? "תאריך"} מתוך לוח`}
      >
        לוח
      </button>
      <input
        ref={nativeDateRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
