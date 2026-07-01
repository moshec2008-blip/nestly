import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "rose";
  className?: string;
};

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
};

export default function Badge({
  children,
  tone = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
