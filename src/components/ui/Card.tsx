import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export default function Card({
  children,
  className = "",
  compact = false,
}: CardProps) {
  return (
    <section
      className={`rounded-[20px] border border-[#e6e8ec] bg-white text-[#1d1d1f] shadow-[0_10px_26px_rgba(15,23,42,0.045)] ${compact ? "p-3" : "p-4"} ${className}`}
    >
      {children}
    </section>
  );
}
