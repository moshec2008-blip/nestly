import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

export type AttentionDomain =
  | "tasks"
  | "finance"
  | "documents"
  | "shopping"
  | "vehicles"
  | "family"
  | "life"
  | "inbox"
  | "timeline"
  | "system";

export type AttentionSeverity = "critical" | "high" | "medium" | "low" | "calm";

export type AttentionReason =
  | "overdue"
  | "due_today"
  | "due_soon"
  | "financial_impact"
  | "needs_review"
  | "active_life_event"
  | "user_preference"
  | "recent_activity"
  | "unresolved"
  | "quiet_day";

export type AttentionAction = {
  label: string;
  href?: AppRoute;
  eventName?: string;
  eventDetail?: Record<string, string>;
};

export type AttentionItem = {
  id: string;
  domain: AttentionDomain;
  title: string;
  summary: string;
  reason: string;
  reasonCode: AttentionReason;
  href: AppRoute;
  icon: AppIconName;
  severity: AttentionSeverity;
  score: number;
  confidence: number;
  dueAt?: string;
  relatedLabel?: string;
  action: AttentionAction;
  secondaryAction?: AttentionAction;
  sourceEntityId?: string;
};

export type HomeQuickAction = {
  id: string;
  label: string;
  description: string;
  icon: AppIconName;
  href?: AppRoute;
  eventName?: string;
  eventDetail?: Record<string, string>;
  priority: number;
};

export type HomeAttentionState = {
  generatedAt: string;
  greeting: string;
  contextLabel: string;
  daySummary: string;
  primaryItem: AttentionItem;
  todayItems: AttentionItem[];
  lifeEventItems: AttentionItem[];
  quickActions: HomeQuickAction[];
  quiet: boolean;
};

export type HomeAttentionPreference = {
  dismissed: Record<string, string>;
  snoozedUntil: Record<string, string>;
  priorityOverrides: Record<string, number>;
};
