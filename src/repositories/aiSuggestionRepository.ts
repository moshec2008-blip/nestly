import { storageKeys } from "@/lib/storageKeys";
import type {
  AISuggestion,
  AISuggestionAuditRecord,
  AISuggestionFeedback,
  AISuggestionStatus,
} from "@/types/aiSuggestions";
import {
  isAISuggestion,
  isAISuggestionAuditRecord,
} from "@/types/aiSuggestions";
import { readStorageArray, writeStorage } from "@/utils/storage";

function sortSuggestions(items: AISuggestion[]) {
  return [...items].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt)
  );
}

export function readAISuggestions(options?: { includeResolved?: boolean }) {
  const items = sortSuggestions(
    readStorageArray<AISuggestion>(
      storageKeys.aiSuggestions,
      [],
      isAISuggestion
    )
  );

  return options?.includeResolved
    ? items
    : items.filter((item) => item.status === "pending");
}

export function writeAISuggestions(items: AISuggestion[]) {
  return writeStorage(storageKeys.aiSuggestions, sortSuggestions(items));
}

export function upsertAISuggestion(suggestion: AISuggestion) {
  const existing = readAISuggestions({ includeResolved: true });
  const withoutDuplicate = existing.filter((item) => item.id !== suggestion.id);
  return writeAISuggestions([suggestion, ...withoutDuplicate]);
}

export function updateAISuggestionStatus(
  id: string,
  status: AISuggestionStatus,
  resultingEntityIds: string[] = []
): AISuggestion | null {
  const timestamp = new Date().toISOString();
  let updatedSuggestion: AISuggestion | null = null;
  const items = readAISuggestions({ includeResolved: true }).map((item) => {
    if (item.id !== id) {
      return item;
    }

    updatedSuggestion = {
      ...item,
      status,
      acceptedAt:
        status === "accepted" || status === "edited" ? timestamp : item.acceptedAt,
      rejectedAt: status === "rejected" ? timestamp : item.rejectedAt,
      resultingEntityIds,
    };
    return updatedSuggestion;
  });

  writeAISuggestions(items);
  return updatedSuggestion;
}

export function readAIAuditRecords() {
  return readStorageArray<AISuggestionAuditRecord>(
    storageKeys.aiAudit,
    [],
    isAISuggestionAuditRecord
  );
}

export function appendAIAuditRecord(record: AISuggestionAuditRecord) {
  const current = readAIAuditRecords();
  return writeStorage(storageKeys.aiAudit, [record, ...current].slice(0, 200));
}

export function readAISuggestionFeedback() {
  return readStorageArray<AISuggestionFeedback>(
    storageKeys.aiSuggestionFeedback,
    []
  );
}

export function appendAISuggestionFeedback(feedback: AISuggestionFeedback) {
  const current = readAISuggestionFeedback();
  return writeStorage(storageKeys.aiSuggestionFeedback, [
    feedback,
    ...current,
  ].slice(0, 200));
}
