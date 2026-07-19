import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

export type HandleDomain =
  | "tasks"
  | "finance"
  | "shopping"
  | "documents"
  | "vehicles"
  | "health"
  | "family"
  | "life"
  | "inbox";

export type HandleUrgency = "overdue" | "today" | "soon" | "review" | "open";

export type HandleQueueItem = {
  id: string;
  domain: HandleDomain;
  title: string;
  description: string;
  reason: string;
  meta: string;
  href: AppRoute;
  icon: AppIconName;
  urgency: HandleUrgency;
  actionLabel: string;
  completeLabel?: string;
  canComplete?: boolean;
  eventName?: string;
  eventDetail?: Record<string, unknown>;
  dueDate?: string;
  owner?: string;
  score: number;
};

export type HandleCompletedItem = {
  id: string;
  domain: HandleDomain;
  title: string;
  meta: string;
  href: AppRoute;
  icon: AppIconName;
  completedAt: string;
};

export type HandleQueueSummary = {
  total: number;
  overdue: number;
  today: number;
  review: number;
  domains: Array<{
    domain: HandleDomain;
    count: number;
  }>;
};

export type HandleQueueState = {
  generatedAt: string;
  items: HandleQueueItem[];
  completedItems: HandleCompletedItem[];
  summary: HandleQueueSummary;
  warnings: string[];
};

export type HandleCompletionUndoToken = {
  itemId: string;
  storageKey: string;
  previousValue: unknown[];
};

export type HandleCompletionResult =
  | {
      ok: true;
      undoToken: HandleCompletionUndoToken;
    }
  | {
      ok: false;
      reason?: string;
    };
