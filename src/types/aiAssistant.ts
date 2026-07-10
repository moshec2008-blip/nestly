import type { AppRoute } from "@/types/navigation";

export type AiAssistantDomain =
  | "documents"
  | "finance"
  | "shopping"
  | "tasks"
  | "family-events"
  | "vehicles"
  | "health"
  | "dashboard"
  | "search";

export type AiInsightTone = "calm" | "good" | "warning" | "urgent";

export type AiSuggestedActionType =
  | "navigate"
  | "review"
  | "create-finance-transaction"
  | "create-task"
  | "create-reminder"
  | "attach-document"
  | "mark-recurring"
  | "add-shopping-item";

export type AiSuggestedAction = {
  id: string;
  type: AiSuggestedActionType;
  label: string;
  description: string;
  targetRoute: AppRoute;
  requiresConfirmation: true;
};

export type AiFamilyInsight = {
  id: string;
  domain: AiAssistantDomain;
  title: string;
  message: string;
  tone: AiInsightTone;
  priority: number;
  targetRoute: AppRoute;
  actionLabel: string;
  actions: AiSuggestedAction[];
  createdAt: string;
  expiresAt?: string;
};

export type AiDailyBriefing = {
  greeting: string;
  items: AiFamilyInsight[];
  suggestion: AiFamilyInsight | null;
  mode: "local-rules" | "ai-provider";
  provider: "local" | "openai" | "gemini" | "anthropic";
};

export type AiAssistantCapability = {
  domain: AiAssistantDomain;
  label: string;
  status: "ready-local" | "prepared" | "future";
  description: string;
};

export type AiAssistantContext = {
  now?: Date;
  maxItems?: number;
};
