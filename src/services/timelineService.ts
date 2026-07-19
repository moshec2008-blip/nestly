import {
  deleteManualTimelineItem,
  findTimelineItemByEventKey,
  readTimelineItems,
  updateTimelineItemStatus,
  upsertTimelineItem,
} from "@/repositories/timelineRepository";
import type {
  TimelineCreateInput,
  TimelineEventType,
  TimelineItem,
  TimelineQuery,
} from "@/types/timeline";
import {
  buildTimelineEventKey,
  inferTimelineImportance,
  shouldRecordMeaningfulEvent,
} from "@/lib/timeline/timelineRules";
import { createUuid } from "@/utils/ids";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return createUuid();
  }

  return `timeline-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function createTimelineItem(input: TimelineCreateInput) {
  const timestamp = nowIso();
  const eventKey =
    input.eventKey ||
    buildTimelineEventKey({
      eventType: input.eventType,
      sourceModule: input.sourceModule,
      sourceEntityId: input.sourceEntityId,
      occurredAt: input.occurredAt,
    });

  const existingItem = findTimelineItemByEventKey(eventKey);

  if (existingItem) {
    return existingItem;
  }

  const item: TimelineItem = {
    ...input,
    id: input.id ?? createId(),
    eventKey,
    createdAt: timestamp,
    status: input.status ?? "active",
    relatedEntityIds: input.relatedEntityIds ?? [],
    relatedFamilyMemberIds: input.relatedFamilyMemberIds ?? [],
    metadata: {
      ...input.metadata,
      eventKey,
    },
  };

  upsertTimelineItem(item);
  return item;
}

export function recordMeaningfulActivity(
  input: Omit<
    TimelineCreateInput,
    "eventKey" | "importance" | "origin" | "visibility" | "userConfirmed"
  > & {
    eventKey?: string;
    eventType: TimelineEventType;
    importance?: TimelineCreateInput["importance"];
    origin?: TimelineCreateInput["origin"];
    visibility?: TimelineCreateInput["visibility"];
    userConfirmed?: boolean;
  }
) {
  if (!shouldRecordMeaningfulEvent(input.eventType)) {
    return null;
  }

  return createTimelineItem({
    ...input,
    eventKey:
      input.eventKey ||
      buildTimelineEventKey({
        eventType: input.eventType,
        sourceModule: input.sourceModule,
        sourceEntityId: input.sourceEntityId,
        occurredAt: input.occurredAt,
      }),
    importance:
      input.importance ??
      inferTimelineImportance(input.eventType, input.sourceModule),
    origin: input.origin ?? "automatic",
    visibility: input.visibility ?? "family",
    userConfirmed: input.userConfirmed ?? false,
  });
}

export function createCustomTimelineItem(input: {
  title: string;
  description?: string;
  occurredAt: string;
  sourceModule?: TimelineCreateInput["sourceModule"];
  relatedFamilyMemberIds?: string[];
  visibility?: TimelineCreateInput["visibility"];
}) {
  return createTimelineItem({
    eventType: "custom_timeline_item",
    title: input.title.trim() || "עדכון משפחתי",
    description: input.description?.trim(),
    occurredAt: input.occurredAt,
    actorDisplayName: "הבית",
    sourceModule: input.sourceModule ?? "system",
    sourceEntityType: "manual_update",
    sourceEntityId: createId(),
    sourceUrl: "/timeline",
    relatedEntityIds: [],
    relatedFamilyMemberIds: input.relatedFamilyMemberIds ?? [],
    importance: "normal",
    visibility: input.visibility ?? "family",
    origin: "manual",
    status: "active",
    metadata: { sourceLabel: "עדכון ידני" },
    userConfirmed: true,
  });
}

export function getTimelineItems(query?: TimelineQuery) {
  return readTimelineItems(query);
}

export function getRecentTimelineItems(limit = 5) {
  return readTimelineItems({ limit }).items;
}

export function getTimelineItemsByModule(
  sourceModule: TimelineCreateInput["sourceModule"],
  limit = 30
) {
  return readTimelineItems({ sourceModule, limit }).items;
}

export function getTimelineItemsByMember(memberIdOrName: string, limit = 30) {
  return readTimelineItems({ actor: memberIdOrName, limit }).items;
}

export function getTimelineItemsByDateRange(
  dateFrom: string,
  dateTo: string,
  limit = 50
) {
  return readTimelineItems({ dateFrom, dateTo, limit }).items;
}

export function hideTimelineItem(id: string) {
  return updateTimelineItemStatus(id, "hidden");
}

export function restoreTimelineItem(id: string) {
  return updateTimelineItemStatus(id, "active");
}

export function archiveTimelineItem(id: string) {
  return updateTimelineItemStatus(id, "archived");
}

export function removeManualTimelineItem(id: string) {
  return deleteManualTimelineItem(id);
}
