"use client";

import AIConfidenceBadge from "@/components/ai/AIConfidenceBadge";
import { getConfidenceLevel } from "@/lib/ai/validation/ai-response.validation";

type AIFieldReviewProps = {
  label: string;
  value: string;
  confidence?: number;
  onChange?: (value: string) => void;
};

export default function AIFieldReview({
  label,
  value,
  confidence,
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
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!onChange}
        className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-3 text-right text-sm font-bold text-[#111827] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 read-only:bg-slate-50"
      />
    </label>
  );
}
