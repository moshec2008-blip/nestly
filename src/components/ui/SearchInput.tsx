import type { InputHTMLAttributes } from "react";

type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function SearchInput({
  label,
  className = "",
  ...props
}: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        className={`h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-right text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300/60 focus:bg-white/[0.08] ${className}`}
        {...props}
      />
    </label>
  );
}
