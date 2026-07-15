import type { AppRoute } from "@/types/navigation";

export type TimelineEventType =
  | "task_created"
  | "task_assigned"
  | "task_started"
  | "task_completed"
  | "task_reopened"
  | "task_archived"
  | "shopping_list_created"
  | "shopping_item_added"
  | "shopping_list_completed"
  | "receipt_scanned"
  | "receipt_confirmed"
  | "expense_added"
  | "income_added"
  | "receipt_linked"
  | "payment_marked_handled"
  | "finance_record_archived"
  | "document_uploaded"
  | "document_reviewed"
  | "document_classified"
  | "document_linked"
  | "document_archived"
  | "document_expiring_soon"
  | "vehicle_added"
  | "vehicle_service_completed"
  | "vehicle_reminder_created"
  | "vehicle_reminder_completed"
  | "vehicle_document_linked"
  | "appointment_added"
  | "reminder_completed"
  | "follow_up_completed"
  | "checklist_completed"
  | "family_member_added"
  | "family_information_updated"
  | "invitation_created"
  | "invitation_accepted"
  | "note_created"
  | "note_converted"
  | "knowledge_created"
  | "knowledge_updated"
  | "knowledge_linked"
  | "guest_data_imported"
  | "family_space_created"
  | "settings_migration_completed"
  | "custom_timeline_item";

export type TimelineSourceModule =
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
  | "permissions"
  | "system";

export type TimelineImportance = "normal" | "important" | "critical";
export type TimelineVisibility = "private" | "family";
export type TimelineOrigin = "automatic" | "manual" | "imported" | "AI_suggestion";
export type TimelineStatus = "active" | "hidden" | "archived";

export type TimelineMetadata = {
  amount?: number;
  currency?: string;
  category?: string;
  merchant?: string;
  sourceLabel?: string;
  eventKey?: string;
  tags?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
};

export type TimelineItem = {
  id: string;
  familySpaceId?: string;
  eventKey: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  occurredAt: string;
  createdAt: string;
  actorUserId?: string;
  actorMemberId?: string;
  actorDisplayName?: string;
  actorAvatar?: string;
  sourceModule: TimelineSourceModule;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceUrl?: AppRoute;
  relatedEntityIds: string[];
  relatedFamilyMemberIds: string[];
  importance: TimelineImportance;
  visibility: TimelineVisibility;
  origin: TimelineOrigin;
  status: TimelineStatus;
  metadata: TimelineMetadata;
  userConfirmed: boolean;
  undoAvailableUntil?: string;
};

export type TimelineCreateInput = Omit<
  TimelineItem,
  "id" | "createdAt" | "status" | "eventKey"
> & {
  id?: string;
  eventKey?: string;
  status?: TimelineStatus;
};

export type TimelineQuery = {
  search?: string;
  sourceModule?: TimelineSourceModule | "all";
  actor?: string;
  importanceOnly?: boolean;
  includeArchived?: boolean;
  includeHidden?: boolean;
  limit?: number;
  cursor?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type TimelinePage = {
  items: TimelineItem[];
  nextCursor: string | null;
  total: number;
};

export function isTimelineItem(value: unknown): value is TimelineItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<TimelineItem>;

  return (
    typeof item.id === "string" &&
    typeof item.eventKey === "string" &&
    typeof item.eventType === "string" &&
    typeof item.title === "string" &&
    typeof item.occurredAt === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.sourceModule === "string" &&
    typeof item.sourceEntityType === "string" &&
    typeof item.sourceEntityId === "string" &&
    typeof item.importance === "string" &&
    typeof item.visibility === "string" &&
    typeof item.origin === "string" &&
    typeof item.status === "string" &&
    Array.isArray(item.relatedEntityIds) &&
    Array.isArray(item.relatedFamilyMemberIds) &&
    typeof item.userConfirmed === "boolean"
  );
}
