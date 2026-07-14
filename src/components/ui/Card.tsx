import type { ReactNode } from "react";
import { cardBaseClass, cardToneClasses, cn } from "./uiStyles";

type CardProps = {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  tone?: keyof typeof cardToneClasses;
  padding?: "none" | "sm" | "md" | "lg";
};

export default function Card({
  children,
  className = "",
  compact = false,
  tone = "default",
  padding,
}: CardProps) {
  const paddingClass =
    padding === "none"
      ? ""
      : padding === "sm" || compact
        ? "p-2.5"
        : padding === "lg"
          ? "p-5"
          : "p-3";

  return (
    <section
      className={cn(cardBaseClass, cardToneClasses[tone], paddingClass, className)}
    >
      {children}
    </section>
  );
}
