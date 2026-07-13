import type { ConfidenceLevel } from "@/lib/ai/types";

type AIConfidenceBadgeProps = {
  level: ConfidenceLevel;
  confidence: number;
};

const labels: Record<ConfidenceLevel, string> = {
  high: "ביטחון גבוה",
  medium: "כדאי לבדוק",
  low: "ביטחון נמוך",
};

const classes: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  medium: "bg-amber-50 text-amber-800 ring-amber-200",
  low: "bg-rose-50 text-rose-800 ring-rose-200",
};

export default function AIConfidenceBadge({
  level,
  confidence,
}: AIConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-black ring-1 ${classes[level]}`}
      aria-label={`${labels[level]} ${Math.round(confidence * 100)} אחוז`}
    >
      {labels[level]} · {Math.round(confidence * 100)}%
    </span>
  );
}
