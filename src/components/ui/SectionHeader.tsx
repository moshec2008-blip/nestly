import type { ReactNode } from "react";
import { cn } from "@/components/ui/uiStyles";

type SectionHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  className?: string;
  bordered?: boolean;
};

export default function SectionHeader({
  title,
  subtitle,
  meta,
  className = "",
  bordered = true,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-3 px-1",
        bordered && "border-t border-[#eee8db]/70 pt-3",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-black leading-7 text-[#111827]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}
