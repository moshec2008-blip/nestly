import type { AISuggestedAction } from "@/lib/ai/types";

type AISuggestedActionsProps = {
  actions: AISuggestedAction[];
};

export default function AISuggestedActions({ actions }: AISuggestedActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 text-right">
      <p className="text-xs font-black text-slate-600">פעולות מוצעות</p>
      {actions.map((action) => (
        <div
          key={action.id}
          className="rounded-2xl bg-[#f8fafc] p-3 text-sm ring-1 ring-[#e6e8ec]"
        >
          <p className="font-black text-[#111827]">{action.label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {action.description}
          </p>
        </div>
      ))}
      <p className="text-xs font-bold text-slate-500">
        שום פעולה לא תתבצע בלי אישור מפורש שלכם.
      </p>
    </div>
  );
}
