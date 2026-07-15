import { initialFinanceTransactions } from "@/data/finance";
import { initialFamilyTasks } from "@/data/tasks";
import { initialShoppingItems } from "@/data/shopping";
import { initialDocumentRecords, initialVehicleRecords } from "@/data/modules";
import {
  entityTypeLabels,
  entityTypeRoutes,
  relationshipLabels,
} from "@/lib/relations/relationTypes";
import { getDefaultDirection } from "@/lib/relations/relationRegistry";
import {
  buildRelationUniqueKey,
  validateRelationInput,
} from "@/lib/relations/relationValidation";
import { storageKeys } from "@/lib/storageKeys";
import {
  getRelationsForEntity as getStoredRelationsForEntity,
  readEntityRelations,
  updateEntityRelationStatus,
  upsertEntityRelation,
} from "@/repositories/entityRelationsRepository";
import { readKnowledgeItems } from "@/services/familyKnowledge";
import { readTimelineItems } from "@/repositories/timelineRepository";
import type { FinanceTransaction } from "@/data/finance";
import type {
  EntityReference,
  EntityRelation,
  EntityRelationCreateInput,
  EntityRelationType,
  RelatedRecordPreview,
} from "@/types/entityRelations";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import type { FamilyTask } from "@/data/tasks";
import { readStorageArray } from "@/utils/storage";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function notifyRelationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nestly-relations-change"));
  }
}

let didRunLegacyRelationMigration = false;

function routeForEntity(entityType: EntityRelationType) {
  return entityTypeRoutes[entityType];
}

function getRecordPreview(
  entityType: EntityRelationType,
  entityId: string
): Pick<RelatedRecordPreview, "title" | "description" | "href"> {
  if (entityType === "finance_transaction" || entityType === "receipt") {
    const transactions = readStorageArray<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions
    );
    const transaction = transactions.find(
      (item) =>
        item.id === entityId ||
        item.receiptReference === entityId ||
        item.documentReference === entityId
    );

    if (transaction) {
      return {
        title: transaction.title,
        description: `${transaction.category} · ₪${transaction.amount.toLocaleString("he-IL")}`,
        href: "/finance",
      };
    }
  }

  if (entityType === "document" || entityType === "receipt") {
    const documents = readStorageArray<ModuleRecord | Record<string, unknown>>(
      storageKeys.documents,
      initialDocumentRecords
    );
    const documentItem = documents.find((item) => item.id === entityId);

    if (documentItem) {
      return {
        title: String(documentItem.title ?? entityTypeLabels[entityType]),
        description: String(
          documentItem.category ?? documentItem.description ?? entityTypeLabels[entityType]
        ),
        href: "/documents",
      };
    }
  }

  if (entityType === "vehicle" || entityType === "vehicle_reminder") {
    const records = readStorageArray<ModuleRecord>(
      storageKeys.vehicles,
      initialVehicleRecords
    );
    const record = records.find((item) => item.id === entityId);

    if (record) {
      return {
        title: record.title,
        description: `${record.category} · ${record.owner}`,
        href: "/vehicles",
      };
    }
  }

  if (entityType === "task" || entityType === "reminder") {
    const tasks = readStorageArray<FamilyTask>(
      storageKeys.tasks,
      initialFamilyTasks
    );
    const task = tasks.find((item) => item.id === entityId);

    if (task) {
      return {
        title: task.title,
        description: `${task.category} · ${task.owner}`,
        href: "/tasks",
      };
    }
  }

  if (entityType === "shopping_item" || entityType === "shopping_list") {
    const items = readStorageArray<ShoppingItem>(
      storageKeys.shopping,
      initialShoppingItems
    );
    const item = items.find((shoppingItem) => shoppingItem.id === entityId);

    if (item) {
      return {
        title: item.title,
        description: `${item.quantity} · ${item.department || item.listName}`,
        href: "/shopping",
      };
    }
  }

  if (entityType === "family_knowledge") {
    const item = readKnowledgeItems({ includeArchived: true }).find(
      (knowledgeItem) => knowledgeItem.id === entityId
    );

    if (item) {
      return {
        title: item.title,
        description: item.category,
        href: "/knowledge",
      };
    }
  }

  if (entityType === "timeline_item") {
    const item = readTimelineItems({ includeArchived: true }).items.find(
      (timelineItem) => timelineItem.id === entityId
    );

    if (item) {
      return {
        title: item.title,
        description: item.description,
        href: "/timeline",
      };
    }
  }

  return {
    title: entityTypeLabels[entityType],
    description: "הפריט המקורי לא זמין כרגע",
    href: routeForEntity(entityType),
  };
}

function getOtherSide(relation: EntityRelation, entity: EntityReference) {
  const currentIsSource =
    relation.sourceEntityType === entity.entityType &&
    relation.sourceEntityId === entity.entityId;

  return currentIsSource
    ? {
        entityType: relation.targetEntityType,
        entityId: relation.targetEntityId,
      }
    : {
        entityType: relation.sourceEntityType,
        entityId: relation.sourceEntityId,
      };
}

export function createRelation(input: EntityRelationCreateInput) {
  const direction =
    input.direction ||
    getDefaultDirection(
      input.sourceEntityType,
      input.targetEntityType,
      input.relationshipType
    );
  const normalizedInput = { ...input, direction };
  const uniqueKey = buildRelationUniqueKey(normalizedInput);
  const existingRelations = readEntityRelations({ includeArchived: true });
  const existing = existingRelations.find(
    (relation) =>
      relation.uniqueKey === uniqueKey &&
      relation.status !== "archived" &&
      relation.status !== "rejected"
  );

  if (existing) {
    return { ok: true as const, relation: existing, created: false };
  }

  const validation = validateRelationInput(normalizedInput, existingRelations);
  if (!validation.ok) {
    return { ok: false as const, error: validation };
  }

  const timestamp = nowIso();
  const relation: EntityRelation = {
    ...normalizedInput,
    id: input.id ?? createId("relation"),
    createdAt: timestamp,
    updatedAt: timestamp,
    status: input.status ?? "active",
    metadata: input.metadata ?? {},
    uniqueKey,
  };

  upsertEntityRelation(relation);
  notifyRelationsChanged();
  return { ok: true as const, relation, created: true };
}

export function suggestRelation(input: EntityRelationCreateInput) {
  return createRelation({ ...input, status: "suggested" });
}

export function acceptRelationSuggestion(relationId: string) {
  const relation = updateEntityRelationStatus(relationId, "active");
  notifyRelationsChanged();
  return relation;
}

export function rejectRelationSuggestion(relationId: string) {
  const relation = updateEntityRelationStatus(relationId, "rejected");
  notifyRelationsChanged();
  return relation;
}

export function archiveRelation(relationId: string) {
  const relation = updateEntityRelationStatus(relationId, "archived");
  notifyRelationsChanged();
  return relation;
}

export function getRelationsForEntity(entity: EntityReference) {
  return getStoredRelationsForEntity({
    entityType: entity.entityType,
    entityId: entity.entityId,
    includeSuggested: true,
  });
}

export function findConnectedRecords(entity: EntityReference) {
  return getRelationsForEntity(entity).map((relation): RelatedRecordPreview => {
    const target = getOtherSide(relation, entity);
    const preview = getRecordPreview(target.entityType, target.entityId);

    return {
      id: target.entityId,
      entityType: target.entityType,
      title: preview.title,
      description: preview.description,
      moduleLabel: entityTypeLabels[target.entityType],
      relationshipLabel: relationshipLabels[relation.relationshipType],
      href: preview.href,
      relationId: relation.id,
      status: relation.status,
      source: relation.source,
      confidence: relation.confidence,
      reason: relation.reason,
    };
  });
}

export function migrateLegacyEntityRelations(options?: { force?: boolean }) {
  if (didRunLegacyRelationMigration && !options?.force) {
    return 0;
  }

  didRunLegacyRelationMigration = true;

  const documents = readStorageArray<Record<string, unknown>>(
    storageKeys.documents,
    initialDocumentRecords
  );
  const transactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );
  let createdCount = 0;

  documents.forEach((documentItem) => {
    const documentId = typeof documentItem.id === "string" ? documentItem.id : "";
    const linkedTransactionId =
      typeof documentItem.linkedFinanceTransactionId === "string"
        ? documentItem.linkedFinanceTransactionId
        : "";

    if (!documentId || !linkedTransactionId) {
      return;
    }

    const result = createRelation({
      sourceEntityType: "document",
      sourceEntityId: documentId,
      targetEntityType: "finance_transaction",
      targetEntityId: linkedTransactionId,
      relationshipType: "linked_transaction",
      direction: "bidirectional",
      source: "migration",
      reason: "קישור קיים במסמך הועבר לשכבת Smart Connections.",
      visibility: "family",
      metadata: { migratedFrom: "linkedFinanceTransactionId" },
    });

    if (result.ok && result.created) {
      createdCount += 1;
    }
  });

  transactions.forEach((transaction) => {
    if (!transaction.documentReference) {
      return;
    }

    const result = createRelation({
      sourceEntityType: "finance_transaction",
      sourceEntityId: transaction.id,
      targetEntityType: "document",
      targetEntityId: transaction.documentReference,
      relationshipType: "linked_document",
      direction: "bidirectional",
      source: "migration",
      confidence: transaction.aiConfidence,
      reason: "קישור מסמך קיים בפעולה כספית הועבר לשכבת Smart Connections.",
      visibility: "family",
      metadata: { migratedFrom: "documentReference" },
    });

    if (result.ok && result.created) {
      createdCount += 1;
    }
  });

  return createdCount;
}
