import type { AIProviderId, ConfidenceLevel } from "@/lib/ai/types";
import type { AppRoute } from "@/types/navigation";

export type AISuggestionSourceModule =
  | "tasks"
  | "shopping"
  | "finance"
  | "documents"
  | "vehicles"
  | "health"
  | "family"
  | "events"
  | "knowledge"
  | "timeline"
  | "command_center"
  | "smart_capture";

export type AISuggestionType =
  | "suggested_title"
  | "suggested_category"
  | "suggested_tags"
  | "suggested_due_date"
  | "suggested_reminder"
  | "suggested_assignee"
  | "suggested_checklist"
  | "suggested_module"
  | "suggested_document_type"
  | "suggested_finance_category"
  | "suggested_vehicle_link"
  | "suggested_family_member_link"
  | "suggested_knowledge_item"
  | "suggested_task"
  | "suggested_shopping_item"
  | "suggested_command_center_priority"
  | "duplicate_record_warning"
  | "related_record_suggestion"
  | "summary"
  | "extracted_fields";

export type AISuggestionStatus =
  | "pending"
  | "accepted"
  | "edited"
  | "rejected"
  | "expired"
  | "superseded";

export type AISuggestionValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, string | number | boolean | null | string[]>;

export type AISuggestion = {
  id: string;
  familySpaceId?: string;
  userId?: string;
  sourceModule: AISuggestionSourceModule;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceUrl?: AppRoute;
  suggestionType: AISuggestionType;
  title: string;
  explanation: string;
  proposedValues: Record<string, AISuggestionValue>;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  fieldConfidence: Record<string, number>;
  warnings: string[];
  missingFields: string[];
  requiresConfirmation: true;
  createdAt: string;
  expiresAt?: string;
  provider: AIProviderId | "local-rules";
  model?: string;
  status: AISuggestionStatus;
  acceptedAt?: string;
  rejectedAt?: string;
  resultingEntityIds: string[];
  metadata: {
    requestId?: string;
    reasonCode?: string;
    sourceRecordIds?: string[];
    safeInputHash?: string;
    locale?: string;
    [key: string]: string | number | boolean | string[] | undefined;
  };
};

export type AISuggestionCreateInput = Omit<
  AISuggestion,
  "id" | "createdAt" | "status" | "requiresConfirmation" | "resultingEntityIds"
> & {
  id?: string;
  status?: AISuggestionStatus;
  resultingEntityIds?: string[];
};

export type AISuggestionAuditRecord = {
  requestId: string;
  feature: string;
  provider: AIProviderId | "local-rules";
  status: "shown" | "accepted" | "edited" | "rejected" | "failed";
  createdAt: string;
  durationMs?: number;
  suggestionId?: string;
  confidenceLevel?: ConfidenceLevel;
  resultingEntityIds: string[];
  errorCode?: string;
};

export type AISuggestionFeedback = {
  suggestionId: string;
  reason: "incorrect" | "irrelevant" | "already_handled" | "do_not_suggest_now";
  createdAt: string;
  sourceModule: AISuggestionSourceModule;
};

export function isAISuggestion(value: unknown): value is AISuggestion {
  if (!value || typeof value !== "object") {
    return false;
  }

  const suggestion = value as Partial<AISuggestion>;

  return (
    typeof suggestion.id === "string" &&
    typeof suggestion.sourceModule === "string" &&
    typeof suggestion.sourceEntityType === "string" &&
    typeof suggestion.sourceEntityId === "string" &&
    typeof suggestion.suggestionType === "string" &&
    typeof suggestion.title === "string" &&
    typeof suggestion.explanation === "string" &&
    typeof suggestion.confidence === "number" &&
    typeof suggestion.confidenceLevel === "string" &&
    typeof suggestion.createdAt === "string" &&
    typeof suggestion.provider === "string" &&
    typeof suggestion.status === "string" &&
    suggestion.requiresConfirmation === true &&
    Array.isArray(suggestion.warnings) &&
    Array.isArray(suggestion.missingFields) &&
    Array.isArray(suggestion.resultingEntityIds)
  );
}

export function isAISuggestionAuditRecord(
  value: unknown
): value is AISuggestionAuditRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<AISuggestionAuditRecord>;
  return (
    typeof record.requestId === "string" &&
    typeof record.feature === "string" &&
    typeof record.provider === "string" &&
    typeof record.status === "string" &&
    typeof record.createdAt === "string" &&
    Array.isArray(record.resultingEntityIds)
  );
}
