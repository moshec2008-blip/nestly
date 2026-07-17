import { storageKeys } from "@/lib/storageKeys";
import type { KnowledgeRevision } from "@/types/legacy";
import { readStorageArray, writeStorage } from "@/utils/storage";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function isKnowledgeRevision(value: unknown): value is KnowledgeRevision {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<KnowledgeRevision>;

  return (
    typeof item.id === "string" &&
    typeof item.knowledgeItemId === "string" &&
    typeof item.title === "string" &&
    typeof item.content === "string" &&
    typeof item.category === "string" &&
    Array.isArray(item.tags) &&
    typeof item.createdAt === "string"
  );
}

export function readKnowledgeRevisions(knowledgeItemId?: string) {
  const revisions = readStorageArray<KnowledgeRevision>(
    storageKeys.familyKnowledgeRevisions,
    [],
    isKnowledgeRevision
  );

  return knowledgeItemId
    ? revisions.filter((revision) => revision.knowledgeItemId === knowledgeItemId)
    : revisions;
}

export function writeKnowledgeRevision(
  input: Omit<KnowledgeRevision, "id" | "createdAt">
) {
  const revision: KnowledgeRevision = {
    ...input,
    id: createId("knowledge_revision"),
    createdAt: nowIso(),
  };

  writeStorage(storageKeys.familyKnowledgeRevisions, [
    revision,
    ...readKnowledgeRevisions(),
  ]);
  return revision;
}
