import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  icon = "+",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "rounded-[22px] border border-dashed border-[#d8caba] bg-[#fffdf8] p-6 text-center text-[#111827]",
        className,
      ].join(" ")}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-[#eadfcd]">
        {icon}
      </div>
      <p className="mt-3 text-sm font-black text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
