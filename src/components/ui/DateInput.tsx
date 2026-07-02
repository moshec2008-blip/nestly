"use client";

import { useId, useRef, useState } from "react";

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

function formatDateDraft(rawValue: string) {
  const value = rawValue.trim();
  const parsedDate = parseDateInput(value);

  if (parsedDate && /[./-]/.test(value)) {
    return formatIsoDate(parsedDate);
  }

  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const displayValue = draftValue ?? formatIsoDate(value);

  function commitDate(rawValue: string) {
    const parsedDate = parseDateInput(rawValue);

    if (parsedDate !== null) {
      onChange(parsedDate);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={generatedId}
        value={displayValue}
        onChange={(event) => {
          const nextValue = formatDateDraft(event.target.value);
          setDraftValue(nextValue);
          commitDate(nextValue);
        }}
        onBlur={() => {
          setDraftValue(null);
        }}
        required={required}
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        aria-label={ariaLabel ?? label ?? "תאריך"}
        className={inputClassName}
        dir="ltr"
      />
      <span className="relative inline-flex shrink-0">
        <span
          className={`inline-flex items-center justify-center ${buttonClassName}`}
          aria-hidden="true"
        >
          לוח
        </span>
        <input
          ref={nativeDateRef}
          type="date"
          value={value}
          onChange={(event) => {
            setDraftValue(null);
            onChange(event.target.value);
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={`בחר ${label ?? "תאריך"} מתוך לוח`}
        />
      </span>
    </div>
  );
}
