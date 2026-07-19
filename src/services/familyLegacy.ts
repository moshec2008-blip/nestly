import { initialDocumentRecords, initialVehicleRecords } from "@/data/modules";
import { initialFinanceTransactions } from "@/data/finance";
import { initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import { readKnowledgeItems } from "@/services/familyKnowledge";
import { getTimelineItems } from "@/services/timelineService";
import type { FinanceTransaction } from "@/data/finance";
import type { ModuleRecord } from "@/types/modules";
import type { FamilyTask } from "@/data/tasks";
import type {
  LegacyArchiveRecord,
  LegacyCategory,
  LegacyCollection,
  LegacyHistoryItem,
  LegacySourceType,
  SmartConnectionReview,
} from "@/types/legacy";
import type { TimelineItem } from "@/types/timeline";
import { readStorageArray, writeStorage } from "@/utils/storage";
import { createUuid } from "@/utils/ids";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${createUuid()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function yearFromDate(value: string) {
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function isCollection(value: unknown): value is LegacyCollection {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LegacyCollection>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.category === "string" &&
    Array.isArray(item.tags) &&
    Array.isArray(item.linkedRecordIds) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" &&
    typeof item.archived === "boolean"
  );
}

function isArchiveRecord(value: unknown): value is LegacyArchiveRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LegacyArchiveRecord>;

  return (
    typeof item.id === "string" &&
    typeof item.sourceEntityId === "string" &&
    typeof item.sourceModule === "string" &&
    typeof item.sourceType === "string" &&
    typeof item.archivedAt === "string"
  );
}

function readArchiveRecords() {
  return readStorageArray<LegacyArchiveRecord>(
    storageKeys.familyLegacyArchive,
    [],
    isArchiveRecord
  );
}

function isArchived(sourceEntityId: string, sourceType: LegacySourceType) {
  return readArchiveRecords().some(
    (record) =>
      record.sourceEntityId === sourceEntityId && record.sourceType === sourceType
  );
}

function mapTimelineCategory(item: TimelineItem): LegacyCategory {
  const byModule: Partial<Record<TimelineItem["sourceModule"], LegacyCategory>> = {
    documents: "documents",
    finance: "finance",
    vehicles: "vehicles",
    health: "health",
    family: "family",
    events: "events",
    knowledge: "knowledge",
    shopping: "shopping",
    tasks: "tasks",
  };

  return byModule[item.sourceModule] ?? "custom";
}

function mapKnowledgeCategory(linkedModule?: string): LegacyCategory {
  const byModule: Record<string, LegacyCategory> = {
    home: "home",
    family: "family",
    documents: "documents",
    finance: "finance",
    vehicles: "vehicles",
    health: "health",
    shopping: "shopping",
    tasks: "tasks",
    events: "events",
    birthdays: "events",
    knowledge: "knowledge",
  };

  return linkedModule ? byModule[linkedModule] ?? "knowledge" : "knowledge";
}

function isMilestoneTimelineItem(item: TimelineItem) {
  return (
    item.importance !== "normal" ||
    [
      "vehicle_added",
      "vehicle_service_completed",
      "document_uploaded",
      "document_reviewed",
      "receipt_confirmed",
      "expense_added",
      "income_added",
      "family_member_added",
      "knowledge_created",
      "custom_timeline_item",
    ].includes(item.eventType)
  );
}

function timelineToHistoryItem(item: TimelineItem): LegacyHistoryItem {
  return {
    id: `timeline:${item.id}`,
    title: item.title,
    description: item.description,
    occurredAt: item.occurredAt,
    year: yearFromDate(item.occurredAt),
    category: mapTimelineCategory(item),
    sourceType: "timeline",
    sourceModule: item.sourceModule,
    sourceEntityId: item.id,
    sourceUrl: item.sourceUrl ?? "/timeline",
    familyMemberIds: item.relatedFamilyMemberIds,
    tags: uniqueTags([item.metadata.category ?? "", ...(item.metadata.tags ?? [])]),
    archived: item.status === "archived" || isArchived(item.id, "timeline"),
    milestone: isMilestoneTimelineItem(item),
  };
}

export function getFamilyHistoryItems(options?: {
  includeArchived?: boolean;
  year?: number;
  category?: LegacyCategory | "all";
  search?: string;
}) {
  const timelineItems = getTimelineItems({
    includeArchived: true,
    includeHidden: false,
    limit: 500,
  }).items.map(timelineToHistoryItem);
  const knowledgeItems = readKnowledgeItems({ includeArchived: true }).map(
    (item): LegacyHistoryItem => ({
      id: `knowledge:${item.id}`,
      title: item.title,
      description: item.content.slice(0, 160),
      occurredAt: item.updatedAt,
      year: yearFromDate(item.updatedAt),
      category: mapKnowledgeCategory(item.linkedModule),
      sourceType: "knowledge",
      sourceModule: item.linkedModule ?? "general",
      sourceEntityId: item.id,
      sourceUrl: "/knowledge",
      familyMemberIds: item.linkedFamilyMemberId ? [item.linkedFamilyMemberId] : [],
      tags: uniqueTags([item.category, ...item.tags]),
      archived: item.archived || isArchived(item.id, "knowledge"),
      milestone: item.favorite || item.pinned,
    })
  );
  const allItems = [...timelineItems, ...knowledgeItems].sort((first, second) =>
    second.occurredAt.localeCompare(first.occurredAt)
  );
  const normalizedSearch = options?.search?.trim().toLowerCase();

  return allItems
    .filter((item) => (options?.includeArchived ? true : !item.archived))
    .filter((item) => (options?.year ? item.year === options.year : true))
    .filter((item) =>
      options?.category && options.category !== "all"
        ? item.category === options.category
        : true
    )
    .filter((item) =>
      normalizedSearch
        ? [item.title, item.description, item.category, ...item.tags]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true
    );
}

export function getLegacyCollections() {
  return readStorageArray<LegacyCollection>(
    storageKeys.familyLegacyCollections,
    [],
    isCollection
  ).filter((collection) => !collection.archived);
}

export function createLegacyCollection(input: {
  title: string;
  description?: string;
  category?: LegacyCategory;
  tags?: string[];
  linkedRecordIds?: string[];
}) {
  const timestamp = nowIso();
  const collection: LegacyCollection = {
    id: createId("legacy_collection"),
    title: input.title.trim() || "אוסף משפחתי",
    description: input.description?.trim() || "אוסף שמחבר פריטים קיימים בזיכרון המשפחתי.",
    category: input.category ?? "family",
    tags: uniqueTags(input.tags ?? []),
    linkedRecordIds: input.linkedRecordIds ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    archived: false,
  };

  writeStorage(storageKeys.familyLegacyCollections, [
    collection,
    ...readStorageArray<LegacyCollection>(
      storageKeys.familyLegacyCollections,
      [],
      isCollection
    ),
  ]);
  return collection;
}

export function archiveLegacyRecord(input: {
  sourceEntityId: string;
  sourceModule: string;
  sourceType: LegacySourceType;
  reason?: string;
}) {
  const existing = readArchiveRecords().filter(
    (record) =>
      !(
        record.sourceEntityId === input.sourceEntityId &&
        record.sourceType === input.sourceType
      )
  );
  const record: LegacyArchiveRecord = {
    id: createId("archive"),
    sourceEntityId: input.sourceEntityId,
    sourceModule: input.sourceModule,
    sourceType: input.sourceType,
    archivedAt: nowIso(),
    reason: input.reason,
  };

  writeStorage(storageKeys.familyLegacyArchive, [record, ...existing]);
  return record;
}

export function restoreLegacyRecord(sourceEntityId: string, sourceType: LegacySourceType) {
  return writeStorage(
    storageKeys.familyLegacyArchive,
    readArchiveRecords().filter(
      (record) =>
        !(record.sourceEntityId === sourceEntityId && record.sourceType === sourceType)
    )
  );
}

export function getSmartConnectionReviews(): SmartConnectionReview[] {
  const knowledgeItems = readKnowledgeItems({ includeArchived: true });
  const timelineItems = getTimelineItems({ includeArchived: true, limit: 500 }).items;
  const suggestions: SmartConnectionReview[] = [];

  knowledgeItems
    .filter((item) => item.sourceDocumentId && !item.linkedEntityId)
    .slice(0, 4)
    .forEach((item) => {
      suggestions.push({
        id: `missing-document-link:${item.id}`,
        title: item.title,
        description: "נראה שיש מקור מסמך, אבל אין קישור רשומה ברור. כדאי לבדוק.",
        sourceEntityId: item.id,
        suggestedAction: "missing_link",
        confidence: "medium",
      });
    });

  const duplicateKeys = new Map<string, number>();
  timelineItems.forEach((item) => {
    const key = `${item.sourceModule}:${item.sourceEntityId}:${item.eventType}`;
    duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  });

  Array.from(duplicateKeys.entries())
    .filter(([, count]) => count > 1)
    .slice(0, 4)
    .forEach(([key, count]) => {
      suggestions.push({
        id: `duplicate:${key}`,
        title: "ייתכן שיש כפילות בציר הזמן",
        description: `${count} אירועים דומים נמצאו לאותו מקור. כדאי לבדוק לפני איחוד.`,
        sourceEntityId: key,
        suggestedAction: "duplicate_link",
        confidence: "low",
      });
    });

  return suggestions.slice(0, 8);
}

export function getYearlyLegacyReview(year = new Date().getFullYear()) {
  const history = getFamilyHistoryItems({ year, includeArchived: false });
  const finance = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  ).filter((item) => yearFromDate(item.date) === year);
  const documents = readStorageArray<ModuleRecord>(
    storageKeys.documents,
    initialDocumentRecords
  ).filter((item) => yearFromDate(item.date) === year);
  const vehicles = readStorageArray<ModuleRecord>(
    storageKeys.vehicles,
    initialVehicleRecords
  ).filter((item) => yearFromDate(item.date) === year);
  const tasks = readStorageArray<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  ).filter((item) => item.status === "done" && yearFromDate(item.dueDate) === year);
  const expenses = finance.filter((item) => item.type === "expense");
  const income = finance.filter((item) => item.type === "income");

  return {
    year,
    milestones: history.filter((item) => item.milestone).slice(0, 12),
    completedProjects: tasks,
    importantDocuments: documents,
    vehicleMoments: vehicles,
    finance: {
      incomeCount: income.length,
      expenseCount: expenses.length,
      recurringCandidates: expenses.filter((item) =>
        ["שכירות", "חשמל", "מים", "ביטוח"].some((word) =>
          `${item.title} ${item.category}`.includes(word)
        )
      ),
    },
  };
}
