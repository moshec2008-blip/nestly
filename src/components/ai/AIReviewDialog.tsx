"use client";

import { useMemo, useState } from "react";
import AIConfidenceBadge from "@/components/ai/AIConfidenceBadge";
import AIFieldReview from "@/components/ai/AIFieldReview";
import AISuggestedActions from "@/components/ai/AISuggestedActions";
import type { AnyAnalyzeResult } from "@/lib/ai/types";

type ReviewField = {
  key: string;
  label: string;
  value: string;
  confidence?: number;
};

type AIReviewDialogProps = {
  open: boolean;
  title: string;
  result: AnyAnalyzeResult | null;
  fields: ReviewField[];
  onClose: () => void;
  onConfirm: (fields: Record<string, string>) => void;
};

export default function AIReviewDialog({
  open,
  title,
  result,
  fields,
  onClose,
  onConfirm,
}: AIReviewDialogProps) {
  const initialValues = useMemo(
    () =>
      Object.fromEntries(fields.map((field) => [field.key, field.value])) as Record<
        string,
        string
      >,
    [fields]
  );
  const [values, setValues] = useState(initialValues);

  if (!open || !result) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/45 p-3 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-white p-4 text-right shadow-2xl ring-1 ring-white/60">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-xl border border-[#e6e8ec] bg-white px-3 text-sm font-black text-slate-700"
          >
            ביטול
          </button>
          <div>
            <p className="text-xs font-black text-blue-700">בדיקה לפני שמירה</p>
            <h2 className="mt-1 text-xl font-black text-[#111827]">{title}</h2>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <AIConfidenceBadge
            level={result.confidenceLevel}
            confidence={result.confidence}
          />
          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
            לא נשמר אוטומטית
          </span>
        </div>

        {result.warnings.length > 0 && (
          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900 ring-1 ring-amber-100">
            {result.warnings[0]?.message}
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <AIFieldReview
              key={field.key}
              label={field.label}
              value={values[field.key] ?? ""}
              confidence={field.confidence}
              onChange={(nextValue) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  [field.key]: nextValue,
                }))
              }
            />
          ))}
        </div>

        <div className="mt-4">
          <AISuggestedActions actions={result.suggestedActions} />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={() => onConfirm(values)}
            className="min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white"
          >
            אישור ושמירה
          </button>
        </div>
      </div>
    </div>
  );
}
