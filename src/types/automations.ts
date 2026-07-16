export type AutomationStatus = "active" | "paused" | "error" | "archived";

export type AutomationSource =
  | "user"
  | "template"
  | "system"
  | "ai_suggestion";

export type AutomationVisibility = "family" | "private" | "admins";

export type AutomationSafetyLevel =
  | "system_maintenance"
  | "safe_reversible"
  | "confirmation_required"
  | "never_autonomous";

export type AutomationTriggerType =
  | "task_created"
  | "task_completed"
  | "task_due_soon"
  | "document_uploaded"
  | "document_reviewed"
  | "document_expiring"
  | "receipt_scanned"
  | "receipt_confirmed"
  | "finance_record_created"
  | "vehicle_reminder_due"
  | "shopping_list_completed"
  | "note_created"
  | "note_converted"
  | "family_knowledge_created"
  | "smart_inbox_item_created"
  | "smart_inbox_item_reviewed"
  | "scheduled_daily"
  | "scheduled_weekly"
  | "scheduled_monthly"
  | "manual_trigger";

export type AutomationActionType =
  | "refresh_search_index"
  | "update_derived_summary"
  | "add_timeline_event"
  | "invalidate_ai_suggestion"
  | "refresh_command_center"
  | "archive_completed_item"
  | "prepare_weekly_summary"
  | "notify_in_app"
  | "create_task_draft"
  | "create_reminder_draft"
  | "create_checklist_draft"
  | "suggest_document_link"
  | "suggest_finance_record"
  | "suggest_family_knowledge"
  | "request_user_review"
  | "open_workflow"
  | "create_related_record_draft";

export type AutomationConditionType =
  | "source_module"
  | "document_type"
  | "due_date_exists"
  | "expiration_within_days"
  | "task_assigned_to_current_user"
  | "amount_above"
  | "amount_below"
  | "record_status"
  | "family_member"
  | "vehicle"
  | "visibility"
  | "category"
  | "source_mode"
  | "confirmation_status";

export type AutomationTriggerConfig =
  | { type: "scheduled"; hour: number; dayOfWeek?: number; dayOfMonth?: number }
  | { type: "entity"; sourceModule?: string; sourceEntityType?: string }
  | { type: "manual"; label?: string };

export type AutomationConditionConfig =
  | { type: "equals"; value: string }
  | { type: "number_compare"; value: number }
  | { type: "days"; days: number }
  | { type: "exists" };

export type AutomationActionConfig =
  | { type: "draft"; targetModule: string; title?: string; note?: string }
  | { type: "notification"; title: string; message?: string }
  | { type: "timeline"; title: string; sourceModule?: string }
  | { type: "system"; operation: string };

export type AutomationCondition = {
  id: string;
  type: AutomationConditionType;
  config: AutomationConditionConfig;
};

export type AutomationAction = {
  id: string;
  type: AutomationActionType;
  safetyLevel: AutomationSafetyLevel;
  config: AutomationActionConfig;
};

export type AutomationRule = {
  id: string;
  familySpaceId: string;
  title: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerConfig: AutomationTriggerConfig;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  requiresConfirmation: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  lastEvaluatedAt?: string;
  lastExecutedAt?: string;
  nextEvaluationAt?: string;
  status: AutomationStatus;
  failureCount: number;
  lastErrorCode?: string;
  source: AutomationSource;
  visibility: AutomationVisibility;
  version: number;
};

export type AutomationTriggerEvent = {
  type: AutomationTriggerType;
  familySpaceId: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
  sourceModule?: string;
  sourceVersion?: string;
  occurredAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type AutomationExecutionStatus =
  | "completed"
  | "partial"
  | "queued_for_review"
  | "skipped_duplicate"
  | "failed";

export type AutomationExecutionRecord = {
  id: string;
  automationId: string;
  familySpaceId: string;
  executionKey: string;
  triggerType: AutomationTriggerType;
  sourceEntityId?: string;
  actionsAttempted: AutomationActionType[];
  actionsCompleted: AutomationActionType[];
  actionsFailed: AutomationActionType[];
  status: AutomationExecutionStatus;
  errorCode?: string;
  reviewOutcome?: "approved" | "edited" | "rejected" | "snoozed";
  createdAt: string;
};

export type AutomationReviewItemStatus =
  | "pending"
  | "approved"
  | "edited"
  | "rejected"
  | "dismissed";

export type AutomationReviewItem = {
  id: string;
  automationId: string;
  familySpaceId: string;
  title: string;
  description: string;
  proposedActions: AutomationAction[];
  sourceEvent: AutomationTriggerEvent;
  status: AutomationReviewItemStatus;
  createdAt: string;
  updatedAt: string;
};

export type AutomationValidationIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};
