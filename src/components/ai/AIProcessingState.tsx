type AIProcessingStateProps = {
  label?: string;
};

export default function AIProcessingState({
  label = "בודק הצעות...",
}: AIProcessingStateProps) {
  return (
    <div
      className="rounded-2xl border border-[#ebe4d8] bg-white p-3 text-sm font-black text-slate-600"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
