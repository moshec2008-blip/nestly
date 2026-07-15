type AIFallbackStateProps = {
  title?: string;
  description?: string;
};

export default function AIFallbackState({
  title = "ההצעות החכמות לא זמינות כרגע",
  description = "אפשר להמשיך ידנית. שום מידע לא אבד ולא נשמר שינוי אוטומטי.",
}: AIFallbackStateProps) {
  return (
    <div className="rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-3 text-right">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}
