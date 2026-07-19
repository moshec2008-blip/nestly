import type {
  EntityRelationDirection,
  EntityRelationType,
  EntityRelationshipType,
} from "@/types/entityRelations";

export type RelationRegistryEntry = {
  sourceType: EntityRelationType;
  targetType: EntityRelationType;
  relationshipTypes: EntityRelationshipType[];
  bidirectional: boolean;
  confirmationRequired: boolean;
};

export const relationRegistry: RelationRegistryEntry[] = [
  {
    sourceType: "life_event",
    targetType: "vehicle",
    relationshipTypes: [
      "linked_vehicle",
      "part_of_life_event",
      "life_event_context",
      "related_to",
    ],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "vehicle_reminder",
    relationshipTypes: ["linked_reminder", "part_of_life_event", "preparation_for"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "task",
    relationshipTypes: ["linked_task", "part_of_life_event", "preparation_for"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "document",
    relationshipTypes: ["linked_document", "supported_by", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "receipt",
    relationshipTypes: ["linked_receipt", "supported_by", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "finance_transaction",
    relationshipTypes: ["linked_transaction", "paid_by", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "shopping_item",
    relationshipTypes: ["linked_shopping_list", "part_of_life_event", "preparation_for"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "shopping_list",
    relationshipTypes: ["linked_shopping_list", "part_of_life_event", "preparation_for"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "family_member",
    relationshipTypes: ["linked_family_member", "belongs_to", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "timeline_item",
    relationshipTypes: ["related_to", "source_of", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: false,
  },
  {
    sourceType: "life_event",
    targetType: "family_knowledge",
    relationshipTypes: ["related_to", "supported_by", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "note",
    relationshipTypes: ["related_to", "part_of_life_event"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "life_event",
    targetType: "smart_inbox_item",
    relationshipTypes: ["related_to", "part_of_life_event", "life_event_context"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "receipt",
    targetType: "finance_transaction",
    relationshipTypes: ["linked_transaction", "created_from"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "receipt",
    targetType: "document",
    relationshipTypes: ["linked_document", "created_from"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "document",
    targetType: "finance_transaction",
    relationshipTypes: ["linked_transaction", "linked_document", "supported_by"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "document",
    targetType: "vehicle",
    relationshipTypes: ["linked_vehicle", "supported_by"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "document",
    targetType: "family_member",
    relationshipTypes: ["linked_family_member", "belongs_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "task",
    targetType: "document",
    relationshipTypes: ["linked_document", "follow_up_for"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "task",
    targetType: "vehicle",
    relationshipTypes: ["linked_vehicle", "follow_up_for"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "task",
    targetType: "family_member",
    relationshipTypes: ["assigned_to", "linked_family_member"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "note",
    targetType: "task",
    relationshipTypes: ["converted_to", "created_from"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "smart_capture",
    targetType: "task",
    relationshipTypes: ["created_from", "converted_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "smart_capture",
    targetType: "shopping_item",
    relationshipTypes: ["created_from", "converted_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "smart_capture",
    targetType: "family_knowledge",
    relationshipTypes: ["created_from", "converted_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "family_knowledge",
    targetType: "document",
    relationshipTypes: ["linked_document", "supported_by", "related_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "family_knowledge",
    targetType: "vehicle",
    relationshipTypes: ["linked_vehicle", "related_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "family_knowledge",
    targetType: "family_member",
    relationshipTypes: ["linked_family_member", "belongs_to", "related_to"],
    bidirectional: true,
    confirmationRequired: true,
  },
  {
    sourceType: "timeline_item",
    targetType: "task",
    relationshipTypes: ["source_of", "related_to"],
    bidirectional: false,
    confirmationRequired: false,
  },
  {
    sourceType: "timeline_item",
    targetType: "finance_transaction",
    relationshipTypes: ["source_of", "related_to"],
    bidirectional: false,
    confirmationRequired: false,
  },
];

export function findRegistryEntry(
  sourceType: EntityRelationType,
  targetType: EntityRelationType,
  relationshipType: EntityRelationshipType
) {
  return relationRegistry.find(
    (entry) =>
      ((entry.sourceType === sourceType && entry.targetType === targetType) ||
        (entry.bidirectional &&
          entry.sourceType === targetType &&
          entry.targetType === sourceType)) &&
      entry.relationshipTypes.includes(relationshipType)
  );
}

export function getDefaultDirection(
  sourceType: EntityRelationType,
  targetType: EntityRelationType,
  relationshipType: EntityRelationshipType
): EntityRelationDirection {
  return findRegistryEntry(sourceType, targetType, relationshipType)?.bidirectional
    ? "bidirectional"
    : "one_way";
}
