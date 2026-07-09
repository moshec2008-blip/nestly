type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  description,
  icon = "✨",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/78 p-4 text-center shadow-[0_12px_30px_rgba(15,23,42,0.055)]">
      <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-[#fff8eb] text-xl shadow-sm">
        {icon}
      </div>
      <p className="text-base font-extrabold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 min-h-11 rounded-2xl bg-[#111827] px-4 text-sm font-bold text-white transition active:scale-[0.99]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
