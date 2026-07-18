import type { AppRoute } from "@/types/navigation";

export type EntityRelationType =
  | "task"
  | "shopping_item"
  | "shopping_list"
  | "finance_transaction"
  | "receipt"
  | "document"
  | "vehicle"
  | "vehicle_reminder"
  | "family_member"
  | "family_event"
  | "note"
  | "family_knowledge"
  | "reminder"
  | "smart_capture"
  | "smart_inbox_item"
  | "timeline_item"
  | "life_event"
  | "command_center_item"
  | "custom_record";

export type EntityRelationshipType =
  | "belongs_to"
  | "related_to"
  | "created_from"
  | "converted_to"
  | "supported_by"
  | "linked_document"
  | "linked_receipt"
  | "linked_transaction"
  | "linked_task"
  | "linked_reminder"
  | "linked_vehicle"
  | "linked_family_member"
  | "linked_shopping_list"
  | "follow_up_for"
  | "preparation_for"
  | "result_of"
  | "source_of"
  | "duplicate_of"
  | "replaces"
  | "archived_with"
  | "assigned_to"
  | "paid_by"
  | "created_by"
  | "reviewed_by"
  | "part_of_life_event"
  | "life_event_context";

export type EntityRelationDirection = "one_way" | "bidirectional";
export type EntityRelationSource =
  | "manual"
  | "rule_based"
  | "AI_suggestion"
  | "migration"
  | "system";
export type EntityRelationStatus = "active" | "suggested" | "rejected" | "archived";
export type EntityRelationVisibility = "private" | "family";

export type EntityReference = {
  entityType: EntityRelationType;
  entityId: string;
  familySpaceId?: string;
};

export type EntityRelation = {
  id: string;
  familySpaceId?: string;
  sourceEntityType: EntityRelationType;
  sourceEntityId: string;
  targetEntityType: EntityRelationType;
  targetEntityId: string;
  relationshipType: EntityRelationshipType;
  direction: EntityRelationDirection;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
  source: EntityRelationSource;
  confidence?: number;
  reason?: string;
  status: EntityRelationStatus;
  visibility: EntityRelationVisibility;
  metadata: Record<string, string | number | boolean | string[] | undefined>;
  uniqueKey: string;
};

export type EntityRelationCreateInput = Omit<
  EntityRelation,
  "id" | "createdAt" | "updatedAt" | "uniqueKey" | "status" | "metadata"
> & {
  id?: string;
  status?: EntityRelationStatus;
  metadata?: EntityRelation["metadata"];
};

export type RelatedRecordPreview = {
  id: string;
  entityType: EntityRelationType;
  title: string;
  description?: string;
  moduleLabel: string;
  relationshipLabel: string;
  href?: AppRoute;
  relationId: string;
  status: EntityRelationStatus;
  source: EntityRelationSource;
  confidence?: number;
  reason?: string;
};

export type RelationValidationErrorCode =
  | "same_entity"
  | "unsupported_relation"
  | "duplicate_relation"
  | "cross_family_space"
  | "missing_entity";

export type RelationValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: RelationValidationErrorCode;
      message: string;
    };

export function isEntityRelation(value: unknown): value is EntityRelation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const relation = value as Partial<EntityRelation>;

  return (
    typeof relation.id === "string" &&
    typeof relation.sourceEntityType === "string" &&
    typeof relation.sourceEntityId === "string" &&
    typeof relation.targetEntityType === "string" &&
    typeof relation.targetEntityId === "string" &&
    typeof relation.relationshipType === "string" &&
    typeof relation.direction === "string" &&
    typeof relation.createdAt === "string" &&
    typeof relation.updatedAt === "string" &&
    typeof relation.source === "string" &&
    typeof relation.status === "string" &&
    typeof relation.visibility === "string" &&
    typeof relation.uniqueKey === "string"
  );
}
