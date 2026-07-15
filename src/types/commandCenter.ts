import type { AppRoute } from "@/types/navigation";

export type CommandCenterModule =
  | "tasks"
  | "shopping"
  | "finance"
  | "documents"
  | "vehicles"
  | "health"
  | "family"
  | "events"
  | "knowledge"
  | "smart_inbox"
  | "permissions";

export type CommandCenterPriority = "critical" | "high" | "normal" | "low";

export type CommandCenterStatus =
  | "open"
  | "waiting"
  | "upcoming"
  | "review"
  | "completed"
  | "blocked";

export type CommandCenterActionType =
  | "open"
  | "review"
  | "complete"
  | "follow_up"
  | "prepare";

export type CommandCenterVisibility = "family" | "private" | "restricted";

export type CommandCenterItem = {
  id: string;
  familySpaceId?: string;
  sourceModule: CommandCenterModule;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceUrl: AppRoute;
  title: string;
  description?: string;
  status: CommandCenterStatus;
  priority: CommandCenterPriority;
  urgencyScore: number;
  importanceScore: number;
  dueAt?: string;
  startsAt?: string;
  completedAt?: string;
  assignedToMemberId?: string;
  assignedToName?: string;
  createdByMemberId?: string;
  category: string;
  actionType: CommandCenterActionType;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  isOverdue: boolean;
  requiresReview: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  visibility: CommandCenterVisibility;
  metadata: Record<string, string | number | boolean | undefined>;
  generatedAt: string;
  reason: string;
};

export type CommandCenterPreference = {
  itemKey: string;
  userId?: string;
  familySpaceId?: string;
  dismissedAt?: string;
  snoozedUntil?: string;
  dismissReason?: string;
};

export type CommandCenterContext = {
  now?: Date;
  currentMemberName?: string;
  includeCompleted?: boolean;
};

export type CommandCenterSections = {
  dailyFocus: CommandCenterItem | null;
  urgent: CommandCenterItem[];
  today: CommandCenterItem[];
  waiting: CommandCenterItem[];
  upcoming: CommandCenterItem[];
  recentlyCompleted: CommandCenterItem[];
  all: CommandCenterItem[];
};

export type CommandCenterRecommendation = {
  item: CommandCenterItem | null;
  reason: string;
};

export type CommandCenterRecommendationProvider = {
  recommendNextAction(
    context: CommandCenterContext,
    items: CommandCenterItem[]
  ): Promise<CommandCenterRecommendation>;
};
