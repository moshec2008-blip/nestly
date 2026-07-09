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
    <section
      className={cn(cardBaseClass, compact ? "p-2.5" : "p-3", className)}
    >
      {children}
    </section>
  );
}
