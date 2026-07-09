export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const buttonBaseClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-bold transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const buttonToneClasses = {
  primary:
    "nestly-primary-action bg-[#111827] text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)] hover:bg-[#1f2937]",
  secondary:
    "border border-[#e3d8c9] bg-white text-[#1d1d1f] shadow-[0_8px_18px_rgba(33,43,63,0.055)] hover:bg-[#fffdf8]",
  ghost:
    "border border-[#eadfcd] bg-[#fff8eb] text-[#7a5212] hover:bg-[#fff2d9] hover:text-[#1d1d1f]",
} as const;

export const cardBaseClass =
  "nestly-card rounded-[20px] text-[#1d1d1f]";
