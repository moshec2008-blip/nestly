const steps = [
  "מעלה את המסמך...",
  "קורא את המסמך...",
  "מזהה פרטים...",
  "מכין הצעה לבדיקה...",
];

type AIProcessingStateProps = {
  activeStep?: number;
};

export default function AIProcessingState({
  activeStep = 0,
}: AIProcessingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[20px] bg-white p-4 text-right shadow-sm ring-1 ring-[#e6e8ec]"
    >
      <p className="text-sm font-black text-[#111827]">Nestly AI עובד בזהירות</p>
      <div className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${
              index <= activeStep
                ? "bg-blue-50 text-blue-800"
                : "bg-slate-50 text-slate-500"
            }`}
          >
            <span>{step}</span>
            <span>{index <= activeStep ? "פעיל" : "ממתין"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
