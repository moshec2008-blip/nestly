export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-black transition duration-200 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonToneClasses = {
  primary:
    "nestly-primary-action bg-[#111827] text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)] hover:bg-[#1f2937]",
  secondary:
    "border border-[#e6e8ec] bg-white text-[#1d1d1f] shadow-sm hover:bg-[#fafafb]",
  ghost: "text-slate-600 hover:bg-[#fafafb] hover:text-[#1d1d1f]",
} as const;

export const cardBaseClass =
  "rounded-[20px] border border-[#e6e8ec] bg-white text-[#1d1d1f] shadow-[0_10px_26px_rgba(15,23,42,0.045)]";
