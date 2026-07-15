import { findRegistryEntry } from "@/lib/relations/relationRegistry";
import type {
  EntityRelation,
  EntityRelationCreateInput,
  RelationValidationResult,
} from "@/types/entityRelations";

export function buildRelationUniqueKey(input: {
  familySpaceId?: string;
  sourceEntityType: EntityRelation["sourceEntityType"];
  sourceEntityId: string;
  targetEntityType: EntityRelation["targetEntityType"];
  targetEntityId: string;
  relationshipType: EntityRelation["relationshipType"];
  direction: EntityRelation["direction"];
}) {
  const source = `${input.sourceEntityType}:${input.sourceEntityId}`;
  const target = `${input.targetEntityType}:${input.targetEntityId}`;
  const [first, second] =
    input.direction === "bidirectional" && source.localeCompare(target) > 0
      ? [target, source]
      : [source, target];

  return [
    input.familySpaceId ?? "local",
    first,
    input.relationshipType,
    second,
  ].join(":");
}

export function validateRelationInput(
  input: EntityRelationCreateInput,
  existingRelations: EntityRelation[]
): RelationValidationResult {
  if (
    input.sourceEntityType === input.targetEntityType &&
    input.sourceEntityId === input.targetEntityId
  ) {
    return {
      ok: false,
      code: "same_entity",
      message: "אי אפשר לקשר פריט לעצמו.",
    };
  }

  if (
    input.familySpaceId &&
    input.metadata?.targetFamilySpaceId &&
    input.familySpaceId !== input.metadata.targetFamilySpaceId
  ) {
    return {
      ok: false,
      code: "cross_family_space",
      message: "אי אפשר לקשר פריטים ממרחבים משפחתיים שונים.",
    };
  }

  const registryEntry = findRegistryEntry(
    input.sourceEntityType,
    input.targetEntityType,
    input.relationshipType
  );

  if (!registryEntry) {
    return {
      ok: false,
      code: "unsupported_relation",
      message: "סוג הקישור הזה עדיין לא נתמך.",
    };
  }

  const uniqueKey = buildRelationUniqueKey(input);
  const duplicate = existingRelations.some(
    (relation) =>
      relation.uniqueKey === uniqueKey &&
      relation.status !== "archived" &&
      relation.status !== "rejected"
  );

  if (duplicate) {
    return {
      ok: false,
      code: "duplicate_relation",
      message: "הקישור הזה כבר קיים.",
    };
  }

  return { ok: true };
}
