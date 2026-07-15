import type { ConfidenceLevel } from "@/lib/ai/types";

type AISuggestionBadgeProps = {
  level: ConfidenceLevel;
  provider: string;
};

const labels: Record<ConfidenceLevel, string> = {
  high: "ביטחון גבוה",
  medium: "כדאי לבדוק",
  low: "לא זוהה בוודאות",
};

const tones: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  medium: "bg-amber-50 text-amber-700 ring-amber-100",
  low: "bg-rose-50 text-rose-700 ring-rose-100",
};

export default function AISuggestionBadge({
  level,
  provider,
}: AISuggestionBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11px] font-black ring-1 ${tones[level]}`}
    >
      {labels[level]} · {provider === "local-rules" ? "חוקים מקומיים" : provider}
    </span>
  );
}
