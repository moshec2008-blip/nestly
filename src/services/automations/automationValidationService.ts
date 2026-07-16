import type {
  AutomationRule,
  AutomationValidationIssue,
} from "@/types/automations";
import { getAutomationActionEntry } from "@/lib/automations/actionRegistry";
import { getAutomationConditionEntry } from "@/lib/automations/conditionRegistry";
import { automationRequiresReview } from "@/lib/automations/automationRules";
import { getAutomationTriggerEntry } from "@/lib/automations/triggerRegistry";

export function validateAutomationRule(rule: AutomationRule) {
  const issues: AutomationValidationIssue[] = [];

  if (!rule.title.trim()) {
    issues.push({
      code: "missing_title",
      severity: "error",
      message: "Automation must have a title.",
    });
  }

  if (!getAutomationTriggerEntry(rule.triggerType)) {
    issues.push({
      code: "unknown_trigger",
      severity: "error",
      message: `Unknown trigger: ${rule.triggerType}.`,
    });
  }

  if (rule.actions.length === 0) {
    issues.push({
      code: "missing_actions",
      severity: "error",
      message: "Automation must include at least one action.",
    });
  }

  for (const action of rule.actions) {
    const actionEntry = getAutomationActionEntry(action.type);

    if (!actionEntry) {
      issues.push({
        code: "unknown_action",
        severity: "error",
        message: `Unknown action: ${action.type}.`,
      });
      continue;
    }

    if (action.safetyLevel === "never_autonomous") {
      issues.push({
        code: "never_autonomous_action",
        severity: "error",
        message: `${action.type} cannot be saved as an autonomous automation.`,
      });
    }

    if (action.safetyLevel !== actionEntry.safetyLevel) {
      issues.push({
        code: "safety_level_mismatch",
        severity: "error",
        message: `${action.type} has an invalid safety level.`,
      });
    }
  }

  for (const condition of rule.conditions) {
    if (!getAutomationConditionEntry(condition.type)) {
      issues.push({
        code: "unknown_condition",
        severity: "error",
        message: `Unknown condition: ${condition.type}.`,
      });
    }
  }

  if (automationRequiresReview(rule.actions) && !rule.requiresConfirmation) {
    issues.push({
      code: "confirmation_required",
      severity: "error",
      message: "This automation must require user confirmation.",
    });
  }

  return issues;
}

export function canSaveAutomationRule(rule: AutomationRule) {
  return validateAutomationRule(rule).every(
    (issue) => issue.severity !== "error"
  );
}
