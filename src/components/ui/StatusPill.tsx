import type { ReactNode } from "react";
import { cn } from "@/components/ui/uiStyles";

type StatusPillTone =
  | "neutral"
  | "warm"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "violet";

type StatusPillProps = {
  children: ReactNode;
  tone?: StatusPillTone;
  size?: "xs" | "sm";
  className?: string;
};

const toneClasses: Record<StatusPillTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  warm: "bg-[#fff8eb] text-[#7a5212] ring-[#eadfcd]",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

export default function StatusPill({
  children,
  tone = "neutral",
  size = "xs",
  className = "",
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-black ring-1",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
