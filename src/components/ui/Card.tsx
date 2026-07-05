import type { ReactNode } from "react";
import { cardBaseClass, cn } from "./uiStyles";

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
    <section className={cn(cardBaseClass, compact ? "p-3" : "p-4", className)}>
      {children}
    </section>
  );
}
