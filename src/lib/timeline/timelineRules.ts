import type {
  TimelineEventType,
  TimelineImportance,
  TimelineSourceModule,
} from "@/types/timeline";

export function shouldRecordMeaningfulEvent(eventType: TimelineEventType) {
  const meaningfulEvents: TimelineEventType[] = [
    "task_completed",
    "task_reopened",
    "receipt_confirmed",
    "expense_added",
    "income_added",
    "document_uploaded",
    "document_reviewed",
    "vehicle_service_completed",
    "family_member_added",
    "knowledge_created",
    "knowledge_updated",
    "note_converted",
    "guest_data_imported",
    "family_space_created",
    "custom_timeline_item",
  ];

  return meaningfulEvents.includes(eventType);
}

export function inferTimelineImportance(
  eventType: TimelineEventType,
  sourceModule: TimelineSourceModule
): TimelineImportance {
  if (
    eventType === "payment_marked_handled" ||
    eventType === "vehicle_service_completed"
  ) {
    return "critical";
  }

  if (
    eventType === "task_completed" ||
    eventType === "receipt_confirmed" ||
    eventType === "document_reviewed" ||
    eventType === "knowledge_created" ||
    sourceModule === "finance"
  ) {
    return "important";
  }

  return "normal";
}

export function buildTimelineEventKey(input: {
  eventType: TimelineEventType;
  sourceModule: TimelineSourceModule;
  sourceEntityId: string;
  occurredAt: string;
}) {
  return [
    input.eventType,
    input.sourceModule,
    input.sourceEntityId,
    input.occurredAt.slice(0, 19),
  ].join(":");
}
