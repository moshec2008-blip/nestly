import { storageKeys } from "@/lib/storageKeys";
import type { EntityRelation } from "@/types/entityRelations";
import { isEntityRelation } from "@/types/entityRelations";
import { readStorageArray, writeStorage } from "@/utils/storage";

function sortRelations(relations: EntityRelation[]) {
  return [...relations].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt)
  );
}

export function readEntityRelations(options?: { includeArchived?: boolean }) {
  const relations = sortRelations(
    readStorageArray<EntityRelation>(
      storageKeys.entityRelations,
      [],
      isEntityRelation
    )
  );

  return options?.includeArchived
    ? relations
    : relations.filter((relation) => relation.status !== "archived");
}

export function writeEntityRelations(relations: EntityRelation[]) {
  return writeStorage(storageKeys.entityRelations, sortRelations(relations));
}

export function upsertEntityRelation(relation: EntityRelation) {
  const existing = readEntityRelations({ includeArchived: true });
  const withoutDuplicate = existing.filter((item) => item.id !== relation.id);
  writeEntityRelations([relation, ...withoutDuplicate]);
  return relation;
}

export function findEntityRelationByUniqueKey(uniqueKey: string) {
  return readEntityRelations({ includeArchived: true }).find(
    (relation) => relation.uniqueKey === uniqueKey
  );
}

export function getRelationsForEntity(input: {
  entityType: EntityRelation["sourceEntityType"];
  entityId: string;
  includeSuggested?: boolean;
}) {
  return readEntityRelations().filter((relation) => {
    if (!input.includeSuggested && relation.status !== "active") {
      return false;
    }

    const isSource =
      relation.sourceEntityType === input.entityType &&
      relation.sourceEntityId === input.entityId;
    const isTarget =
      relation.targetEntityType === input.entityType &&
      relation.targetEntityId === input.entityId;

    return isSource || isTarget;
  });
}

export function updateEntityRelationStatus(
  relationId: string,
  status: EntityRelation["status"]
) {
  const timestamp = new Date().toISOString();
  let updatedRelation: EntityRelation | null = null;
  const relations = readEntityRelations({ includeArchived: true }).map((relation) => {
    if (relation.id !== relationId) {
      return relation;
    }

    updatedRelation = {
      ...relation,
      status,
      updatedAt: timestamp,
    };
    return updatedRelation;
  });

  writeEntityRelations(relations);
  return updatedRelation;
}
