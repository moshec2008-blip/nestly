"use client";

import { formatIlsCurrency } from "@/utils/formatters";

type BalanceTileProps = {
  label: string;
  amount: number;
  hasValue: boolean;
  updatedAtLabel: string;
  emptyHint: string;
  valueToneClass: string;
  note?: string;
  isEditing: boolean;
  inputValue: string;
  inputPlaceholder: string;
  onToggleEdit: () => void;
  onInputChange: (value: string) => void;
  onSave: () => void;
};

export default function BalanceTile({
  label,
  amount,
  hasValue,
  updatedAtLabel,
  emptyHint,
  valueToneClass,
  note,
  isEditing,
  inputValue,
  inputPlaceholder,
  onToggleEdit,
  onInputChange,
  onSave,
}: BalanceTileProps) {
  return (
    <div className="rounded-2xl bg-white p-2.5 ring-1 ring-[#e3d8c9]/75">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onToggleEdit}
          className="min-h-9 rounded-2xl border border-[#e3d8c9] bg-[#fff8eb] px-3 text-xs font-bold text-[#7a5212] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          aria-expanded={isEditing}
        >
          עדכן
        </button>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-600">{label}</p>
          <p className={`mt-0.5 text-lg font-extrabold ${hasValue ? valueToneClass : "text-slate-500"}`}>
            {hasValue ? formatIlsCurrency(amount) : "לא עודכנה"}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
            {hasValue ? updatedAtLabel : emptyHint}
          </p>
        </div>
      </div>

      {note && (
        <p className="mt-1.5 text-[11px] font-bold text-slate-600">{note}</p>
      )}

      {isEditing && (
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <input
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            inputMode="decimal"
            aria-label={label}
            placeholder={inputPlaceholder}
            className="min-h-10 min-w-0 flex-1 rounded-2xl border border-[#e3d8c9] bg-white px-3 text-right text-sm font-bold text-[#111827] placeholder:text-slate-500 focus:border-[#111827] focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-10 rounded-2xl bg-[#111827] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f2937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            שמור
          </button>
        </form>
      )}
    </div>
  );
}
