import { storageKeys } from "@/lib/storageKeys";
import type { SmartCollection } from "@/types/smartCollections";
import { readStorageArray, writeStorage } from "@/utils/storage";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isSmartCollection(value: unknown): value is SmartCollection {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.familySpaceId === "string" &&
    typeof value.title === "string" &&
    typeof value.icon === "string" &&
    Array.isArray(value.rules) &&
    Array.isArray(value.manuallyPinnedEntities) &&
    typeof value.createdBy === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.visibility === "string" &&
    typeof value.sortOrder === "number" &&
    typeof value.favorite === "boolean" &&
    typeof value.archived === "boolean"
  );
}

export function readSmartCollections() {
  return readStorageArray(
    storageKeys.smartCollections,
    [],
    isSmartCollection
  );
}

export function writeSmartCollections(collections: SmartCollection[]) {
  return writeStorage(storageKeys.smartCollections, collections);
}

export function upsertSmartCollection(collection: SmartCollection) {
  const collections = readSmartCollections();
  const nextCollections = collections.some((item) => item.id === collection.id)
    ? collections.map((item) =>
        item.id === collection.id ? collection : item
      )
    : [collection, ...collections];

  return writeSmartCollections(nextCollections);
}
