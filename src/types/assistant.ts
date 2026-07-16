import type { AppRoute } from "@/types/navigation";

export type AssistantIntent =
  | "daily_brief"
  | "weekly_brief"
  | "find_record"
  | "find_receipt"
  | "vehicle_status"
  | "family_knowledge"
  | "recent_activity"
  | "unsupported";

export type AssistantGeneratedBy = "deterministic" | "ai" | "hybrid";

export type AssistantConfidence = "high" | "medium" | "low";

export type AssistantSourceModule =
  | "command_center"
  | "timeline"
  | "knowledge"
  | "global_search"
  | "tasks"
  | "shopping"
  | "finance"
  | "documents"
  | "vehicles"
  | "health"
  | "family"
  | "events"
  | "permissions"
  | "system";

export type AssistantSourceRecord = {
  id: string;
  title: string;
  excerpt?: string;
  module: AssistantSourceModule;
  route: AppRoute;
  entityType: string;
  entityId: string;
  date?: string;
};

export type AssistantActionType =
  | "open_source"
  | "open_module"
  | "create_task"
  | "review_capture"
  | "add_timeline_update"
  | "search_again";

export type AssistantRelatedAction = {
  id: string;
  type: AssistantActionType;
  label: string;
  description?: string;
  route?: AppRoute;
  sourceRecordIds: string[];
  requiresConfirmation: boolean;
  proposedValues?: Record<string, string | number | boolean | null>;
};

export type AssistantAnswer = {
  id: string;
  query: string;
  intent: AssistantIntent;
  answer: string;
  summaryBullets: string[];
  sourceRecords: AssistantSourceRecord[];
  relatedActions: AssistantRelatedAction[];
  confidence: AssistantConfidence;
  generatedBy: AssistantGeneratedBy;
  warnings: string[];
  missingInformation: string[];
  createdAt: string;
  requiresUserReview: boolean;
};

export type AssistantRequest = {
  query: string;
  language?: "he" | "en";
  now?: Date;
};
