import type {
  AutomationExecutionRecord,
  AutomationReviewItem,
  AutomationRule,
  AutomationTriggerEvent,
} from "@/types/automations";
import {
  automationRequiresReview,
  createAutomationExecutionKey,
} from "@/lib/automations/automationRules";
import { formatAutomationSummary } from "@/lib/automations/automationFormatters";
import {
  findAutomationHistoryByExecutionKey,
  upsertAutomationReviewItem,
} from "@/repositories/automationRepository";
import { recordAutomationExecution } from "@/services/automations/automationHistoryService";
import { createUuid } from "@/utils/ids";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${createUuid()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createReviewItem(
  rule: AutomationRule,
  event: AutomationTriggerEvent
): AutomationReviewItem {
  const now = new Date().toISOString();

  return {
    id: createId("automation-review"),
    automationId: rule.id,
    familySpaceId: rule.familySpaceId,
    title: rule.title,
    description: formatAutomationSummary(rule, "he"),
    proposedActions: rule.actions,
    sourceEvent: event,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

export function evaluateAutomationForEvent(
  rule: AutomationRule,
  event: AutomationTriggerEvent
): AutomationExecutionRecord | null {
  if (
    !rule.enabled ||
    rule.status !== "active" ||
    rule.familySpaceId !== event.familySpaceId ||
    rule.triggerType !== event.type
  ) {
    return null;
  }

  const executionKey = createAutomationExecutionKey({
    automationId: rule.id,
    sourceEntityId: event.sourceEntityId,
    sourceVersion: event.sourceVersion,
    actionTypes: rule.actions.map((action) => action.type),
  });

  const attempted = rule.actions.map((action) => action.type);
  const existing = findAutomationHistoryByExecutionKey(executionKey);

  if (existing) {
    const duplicateRecord: AutomationExecutionRecord = {
      id: createId("automation-run"),
      automationId: rule.id,
      familySpaceId: rule.familySpaceId,
      executionKey,
      triggerType: event.type,
      sourceEntityId: event.sourceEntityId,
      actionsAttempted: attempted,
      actionsCompleted: [],
      actionsFailed: [],
      status: "skipped_duplicate",
      createdAt: new Date().toISOString(),
    };

    recordAutomationExecution(duplicateRecord);
    return duplicateRecord;
  }

  if (rule.requiresConfirmation || automationRequiresReview(rule.actions)) {
    upsertAutomationReviewItem(createReviewItem(rule, event));

    const reviewRecord: AutomationExecutionRecord = {
      id: createId("automation-run"),
      automationId: rule.id,
      familySpaceId: rule.familySpaceId,
      executionKey,
      triggerType: event.type,
      sourceEntityId: event.sourceEntityId,
      actionsAttempted: attempted,
      actionsCompleted: [],
      actionsFailed: [],
      status: "queued_for_review",
      createdAt: new Date().toISOString(),
    };

    recordAutomationExecution(reviewRecord);
    return reviewRecord;
  }

  const completedRecord: AutomationExecutionRecord = {
    id: createId("automation-run"),
    automationId: rule.id,
    familySpaceId: rule.familySpaceId,
    executionKey,
    triggerType: event.type,
    sourceEntityId: event.sourceEntityId,
    actionsAttempted: attempted,
    actionsCompleted: attempted,
    actionsFailed: [],
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  recordAutomationExecution(completedRecord);
  return completedRecord;
}
