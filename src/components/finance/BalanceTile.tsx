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
    <div className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(33,43,63,0.035)] ring-1 ring-[#e3d8c9]/65">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onToggleEdit}
          className="min-h-10 rounded-2xl border border-[#e3d8c9] bg-transparent px-4 text-xs font-bold text-[#7a5212] transition hover:bg-[#fff8eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          aria-expanded={isEditing}
        >
          עדכן
        </button>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className={`mt-1 text-lg font-black ${hasValue ? valueToneClass : "text-slate-500"}`}>
            {hasValue ? formatIlsCurrency(amount) : "לא עודכנה"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {hasValue ? updatedAtLabel : emptyHint}
          </p>
        </div>
      </div>

      {note && (
        <p className="mt-3 text-xs font-bold text-slate-400">{note}</p>
      )}

      {isEditing && (
        <form
          className="mt-4 flex items-center gap-3"
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
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-right text-sm font-bold text-[#111827] placeholder:text-slate-400 focus:border-[#111827] focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f2937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            שמור
          </button>
        </form>
      )}
    </div>
  );
}
