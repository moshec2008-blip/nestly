export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65";

export const buttonSizeClasses = {
  sm: "min-h-10 px-3 py-2 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
} as const;

export const buttonToneClasses = {
  primary:
    "nestly-primary-action border border-[#111827] bg-[#111827] text-white shadow-[0_12px_26px_rgba(17,24,39,0.16)] hover:bg-[#1f2937] hover:border-[#1f2937]",
  secondary:
    "border border-[#e3d8c9] bg-white text-[#1d1d1f] shadow-[0_8px_18px_rgba(33,43,63,0.055)] hover:bg-[#fffdf8]",
  ghost:
    "border border-[#eadfcd] bg-[#fff8eb] text-[#7a5212] hover:bg-[#fff2d9] hover:text-[#1d1d1f]",
  danger:
    "border border-rose-200 bg-rose-50 text-rose-700 shadow-[0_8px_18px_rgba(190,18,60,0.06)] hover:bg-rose-100",
  subtle:
    "border border-transparent bg-transparent text-slate-700 hover:bg-[#fff8eb] hover:text-[#111827]",
} as const;

export const cardBaseClass =
  "nestly-card rounded-[22px] text-[#1d1d1f]";

export const cardToneClasses = {
  default: "",
  strong: "nestly-card-strong",
  quiet: "bg-white/82 shadow-[0_10px_24px_rgba(33,43,63,0.045)] ring-1 ring-[#eadfcd]/60",
  dashed: "border-dashed border-[#d8caba] bg-[#fffdf8]",
} as const;
