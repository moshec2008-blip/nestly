"use client";

import AIConfidenceBadge from "@/components/ai/AIConfidenceBadge";
import { getConfidenceLevel } from "@/lib/ai/validation/ai-response.validation";

type AIFieldReviewProps = {
  label: string;
  value: string;
  confidence?: number;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "search" | "email" | "url";
  helperText?: string;
  errorText?: string;
  onChange?: (value: string) => void;
};

export default function AIFieldReview({
  label,
  value,
  confidence,
  type = "text",
  inputMode,
  helperText,
  errorText,
  onChange,
}: AIFieldReviewProps) {
  return (
    <label className="grid gap-1.5 text-right">
      <span className="flex flex-wrap items-center justify-between gap-2">
        {confidence !== undefined && (
          <AIConfidenceBadge
            level={getConfidenceLevel(confidence)}
            confidence={confidence}
          />
        )}
        <span className="text-xs font-black text-slate-600">{label}</span>
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!onChange}
        aria-invalid={Boolean(errorText)}
        className={[
          "min-h-11 rounded-2xl border bg-[#fffdf8] px-3 text-right text-sm font-bold text-[#111827] outline-none focus:ring-2 read-only:bg-slate-50",
          errorText
            ? "border-rose-300 focus:border-rose-300 focus:ring-rose-100"
            : "border-[#e6e8ec] focus:border-blue-300 focus:ring-blue-100",
        ].join(" ")}
      />
      {(helperText || errorText) && (
        <span
          className={[
            "text-xs font-semibold leading-5",
            errorText ? "text-rose-700" : "text-slate-500",
          ].join(" ")}
        >
          {errorText || helperText}
        </span>
      )}
    </label>
  );
}
