type AIAnalysisStatusProps = {
  state: "idle" | "uploading" | "reading" | "extracting" | "review" | "error";
};

const labels: Record<AIAnalysisStatusProps["state"], string> = {
  idle: "מוכן לסריקה",
  uploading: "מעלה את המסמך...",
  reading: "קורא את המסמך...",
  extracting: "מזהה פרטים...",
  review: "מכין הצעה לבדיקה...",
  error: "לא הצלחנו לקרוא את המסמך.",
};

export default function AIAnalysisStatus({ state }: AIAnalysisStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl bg-[#f7fbff] px-4 py-3 text-right text-sm font-bold text-slate-700 ring-1 ring-blue-100"
    >
      {labels[state]}
    </div>
  );
}
