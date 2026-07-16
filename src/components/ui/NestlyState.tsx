import type { ReactNode } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";

type NestlyStateTone = "calm" | "empty" | "success" | "warning";

type NestlyStateProps = {
  icon?: AppIconName;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: NestlyStateTone;
  compact?: boolean;
};

const toneClasses: Record<NestlyStateTone, string> = {
  calm: "border-[#e7ddcd] bg-[#fffdf8] text-[#7a5212]",
  empty: "border-[#dbe5ef] bg-[#f8fbff] text-sky-700",
  success: "border-emerald-100 bg-emerald-50/80 text-emerald-700",
  warning: "border-amber-100 bg-amber-50/80 text-amber-800",
};

export default function NestlyState({
  icon = "spark",
  title,
  description,
  action,
  tone = "calm",
  compact = false,
}: NestlyStateProps) {
  return (
    <div
      className={[
        "rounded-[24px] border border-dashed text-center shadow-[0_10px_28px_rgba(33,43,63,0.045)]",
        compact ? "p-4" : "p-5",
        toneClasses[tone],
      ].join(" ")}
      role="status"
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/85 shadow-sm">
        <AppIcon name={icon} className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-base font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
