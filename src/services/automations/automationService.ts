import type {
  AutomationRule,
  AutomationTriggerEvent,
} from "@/types/automations";
import {
  readAutomationRules,
  upsertAutomationRule,
} from "@/repositories/automationRepository";
import { automationRequiresReview } from "@/lib/automations/automationRules";
import { evaluateAutomationForEvent } from "@/services/automations/automationExecutionService";
import {
  canSaveAutomationRule,
  validateAutomationRule,
} from "@/services/automations/automationValidationService";

export function listAutomations(options?: { includeArchived?: boolean }) {
  return readAutomationRules().filter((rule) =>
    options?.includeArchived ? true : rule.status !== "archived"
  );
}

export function saveAutomationRule(rule: AutomationRule) {
  const normalizedRule = {
    ...rule,
    requiresConfirmation:
      rule.requiresConfirmation || automationRequiresReview(rule.actions),
    updatedAt: new Date().toISOString(),
  };

  if (!canSaveAutomationRule(normalizedRule)) {
    return {
      ok: false as const,
      issues: validateAutomationRule(normalizedRule),
    };
  }

  return {
    ok: upsertAutomationRule(normalizedRule),
    rule: normalizedRule,
    issues: [],
  };
}

export function handleAutomationTrigger(event: AutomationTriggerEvent) {
  return listAutomations()
    .map((rule) => evaluateAutomationForEvent(rule, event))
    .filter((record) => record !== null);
}

export function pauseAutomation(rule: AutomationRule) {
  return saveAutomationRule({ ...rule, status: "paused", enabled: false });
}

export function resumeAutomation(rule: AutomationRule) {
  return saveAutomationRule({ ...rule, status: "active", enabled: true });
}

export function archiveAutomation(rule: AutomationRule) {
  return saveAutomationRule({ ...rule, status: "archived", enabled: false });
}
