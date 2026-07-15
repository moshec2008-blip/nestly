"use client";

import AISuggestionBadge from "@/components/ai/AISuggestionBadge";
import AIWarningList from "@/components/ai/AIWarningList";
import { acceptAISuggestion, rejectAISuggestion } from "@/services/ai/aiOrchestrator";
import type { AISuggestion, AISuggestionValue } from "@/types/aiSuggestions";

type AISuggestionCardProps = {
  suggestion: AISuggestion;
  applyLabel?: string;
  rejectLabel?: string;
  onApply: (suggestion: AISuggestion) => void;
  onReject?: (suggestion: AISuggestion) => void;
};

function stringifyValue(value: AISuggestionValue) {
  if (value === null) return "לא זוהה";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function AISuggestionCard({
  suggestion,
  applyLabel = "החל הצעה",
  rejectLabel = "לא עכשיו",
  onApply,
  onReject,
}: AISuggestionCardProps) {
  return (
    <article
      className="rounded-[22px] border border-[#ebe4d8] bg-gradient-to-l from-[#fff8eb] via-white to-[#eef7ff] p-3 text-right shadow-[0_12px_30px_rgba(33,43,63,0.06)]"
      aria-label={suggestion.title}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <AISuggestionBadge
          level={suggestion.confidenceLevel}
          provider={suggestion.provider}
        />
        <div className="min-w-0">
          <p className="text-sm font-black text-[#111827]">{suggestion.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {suggestion.explanation}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.entries(suggestion.proposedValues).map(([key, value]) => (
          <div
            key={key}
            className="rounded-2xl border border-white/80 bg-white/78 px-3 py-2"
          >
            <dt className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {key}
            </dt>
            <dd className="mt-0.5 text-xs font-black text-slate-800">
              {stringifyValue(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3">
        <AIWarningList
          warnings={suggestion.warnings}
          missingFields={suggestion.missingFields}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            acceptAISuggestion(suggestion.id);
            onApply(suggestion);
          }}
          className="min-h-10 rounded-2xl border border-[#d8caba] bg-white px-4 text-xs font-black text-[#111827] shadow-sm transition hover:bg-[#fff8eb]"
        >
          {applyLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            rejectAISuggestion(suggestion.id);
            onReject?.(suggestion);
          }}
          className="min-h-10 rounded-2xl px-3 text-xs font-black text-slate-500 transition hover:bg-white/80"
        >
          {rejectLabel}
        </button>
      </div>
    </article>
  );
}
