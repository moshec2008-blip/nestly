import { storageKeys } from "@/lib/storageKeys";
import type {
  AutomationExecutionRecord,
  AutomationReviewItem,
  AutomationRule,
} from "@/types/automations";
import { readStorageArray, writeStorage } from "@/utils/storage";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isAutomationRule(value: unknown): value is AutomationRule {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.familySpaceId === "string" &&
    typeof value.title === "string" &&
    typeof value.triggerType === "string" &&
    Array.isArray(value.conditions) &&
    Array.isArray(value.actions) &&
    typeof value.enabled === "boolean" &&
    typeof value.requiresConfirmation === "boolean" &&
    typeof value.createdByUserId === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.status === "string" &&
    typeof value.failureCount === "number" &&
    typeof value.source === "string" &&
    typeof value.visibility === "string" &&
    typeof value.version === "number"
  );
}

export function isAutomationExecutionRecord(
  value: unknown
): value is AutomationExecutionRecord {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.automationId === "string" &&
    typeof value.familySpaceId === "string" &&
    typeof value.executionKey === "string" &&
    typeof value.triggerType === "string" &&
    Array.isArray(value.actionsAttempted) &&
    Array.isArray(value.actionsCompleted) &&
    Array.isArray(value.actionsFailed) &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string"
  );
}

export function isAutomationReviewItem(
  value: unknown
): value is AutomationReviewItem {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.automationId === "string" &&
    typeof value.familySpaceId === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.proposedActions) &&
    isObject(value.sourceEvent) &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function readAutomationRules() {
  return readStorageArray(storageKeys.automations, [], isAutomationRule);
}

export function writeAutomationRules(rules: AutomationRule[]) {
  return writeStorage(storageKeys.automations, rules);
}

export function upsertAutomationRule(rule: AutomationRule) {
  const rules = readAutomationRules();
  const nextRules = rules.some((item) => item.id === rule.id)
    ? rules.map((item) => (item.id === rule.id ? rule : item))
    : [rule, ...rules];

  return writeAutomationRules(nextRules);
}

export function readAutomationHistory() {
  return readStorageArray(
    storageKeys.automationHistory,
    [],
    isAutomationExecutionRecord
  );
}

export function appendAutomationHistory(record: AutomationExecutionRecord) {
  return writeStorage(storageKeys.automationHistory, [
    record,
    ...readAutomationHistory(),
  ]);
}

export function findAutomationHistoryByExecutionKey(executionKey: string) {
  return readAutomationHistory().find(
    (record) => record.executionKey === executionKey
  );
}

export function readAutomationReviewQueue() {
  return readStorageArray(
    storageKeys.automationReviewQueue,
    [],
    isAutomationReviewItem
  );
}

export function upsertAutomationReviewItem(item: AutomationReviewItem) {
  const queue = readAutomationReviewQueue();
  const nextQueue = queue.some((entry) => entry.id === item.id)
    ? queue.map((entry) => (entry.id === item.id ? item : entry))
    : [item, ...queue];

  return writeStorage(storageKeys.automationReviewQueue, nextQueue);
}
