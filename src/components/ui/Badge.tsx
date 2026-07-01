import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "rose";
  className?: string;
};

const tones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-[rgba(216,180,112,0.18)] bg-white/[0.07] text-[#d7cfbf]",
  blue: "border-blue-300/20 bg-blue-400/10 text-blue-100",
  green: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  amber: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  rose: "border-rose-300/20 bg-rose-400/10 text-rose-100",
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
