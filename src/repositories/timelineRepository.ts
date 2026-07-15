import { storageKeys } from "@/lib/storageKeys";
import type { TimelineItem, TimelinePage, TimelineQuery } from "@/types/timeline";
import { isTimelineItem } from "@/types/timeline";
import { readStorageArray, writeStorage } from "@/utils/storage";

function sortTimelineItems(items: TimelineItem[]) {
  return [...items].sort((first, second) =>
    second.occurredAt.localeCompare(first.occurredAt)
  );
}

function matchesSearch(item: TimelineItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    item.title,
    item.description,
    item.actorDisplayName,
    item.sourceModule,
    item.sourceEntityType,
    item.metadata.category,
    item.metadata.merchant,
    item.metadata.sourceLabel,
    ...(item.metadata.tags ?? []),
  ].some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
}

function filterItems(items: TimelineItem[], query: TimelineQuery) {
  return items
    .filter((item) => (query.includeArchived ? true : item.status !== "archived"))
    .filter((item) => (query.includeHidden ? true : item.status !== "hidden"))
    .filter((item) =>
      query.sourceModule && query.sourceModule !== "all"
        ? item.sourceModule === query.sourceModule
        : true
    )
    .filter((item) =>
      query.actor
        ? item.actorDisplayName === query.actor ||
          item.actorMemberId === query.actor ||
          item.actorUserId === query.actor
        : true
    )
    .filter((item) =>
      query.importanceOnly ? item.importance !== "normal" : true
    )
    .filter((item) => (query.dateFrom ? item.occurredAt >= query.dateFrom : true))
    .filter((item) => (query.dateTo ? item.occurredAt <= query.dateTo : true))
    .filter((item) => (query.search ? matchesSearch(item, query.search) : true));
}

export function readTimelineItems(query: TimelineQuery = {}): TimelinePage {
  const allItems = sortTimelineItems(
    readStorageArray<TimelineItem>(storageKeys.timeline, [], isTimelineItem)
  );
  const filteredItems = filterItems(allItems, query);
  const limit = query.limit ?? 30;
  const startIndex = query.cursor
    ? Math.max(
        0,
        filteredItems.findIndex((item) => item.id === query.cursor) + 1
      )
    : 0;
  const pageItems = filteredItems.slice(startIndex, startIndex + limit);
  const nextItem = filteredItems[startIndex + limit] ?? null;

  return {
    items: pageItems,
    nextCursor: nextItem?.id ?? null,
    total: filteredItems.length,
  };
}

export function readAllTimelineItems() {
  return sortTimelineItems(
    readStorageArray<TimelineItem>(storageKeys.timeline, [], isTimelineItem)
  );
}

export function writeTimelineItems(items: TimelineItem[]) {
  return writeStorage(storageKeys.timeline, sortTimelineItems(items));
}

export function findTimelineItemByEventKey(eventKey: string) {
  return readAllTimelineItems().find((item) => item.eventKey === eventKey) ?? null;
}

export function upsertTimelineItem(item: TimelineItem) {
  const items = readAllTimelineItems();
  const withoutDuplicate = items.filter(
    (candidate) =>
      candidate.id !== item.id && candidate.eventKey !== item.eventKey
  );

  return writeTimelineItems([item, ...withoutDuplicate]);
}

export function updateTimelineItemStatus(
  id: string,
  status: TimelineItem["status"]
) {
  const items = readAllTimelineItems();
  let updatedItem: TimelineItem | null = null;
  const updatedItems = items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    updatedItem = { ...item, status };
    return updatedItem;
  });

  const didWrite = writeTimelineItems(updatedItems);
  return didWrite ? updatedItem : null;
}

export function deleteManualTimelineItem(id: string) {
  const items = readAllTimelineItems();
  const item = items.find((candidate) => candidate.id === id);

  if (!item || item.origin !== "manual") {
    return false;
  }

  return writeTimelineItems(items.filter((candidate) => candidate.id !== id));
}
