import type { AutomationRule } from "@/types/automations";

export function getNextAutomationEvaluation(rule: AutomationRule, now = new Date()) {
  if (!rule.enabled || rule.status !== "active") {
    return null;
  }

  if (rule.triggerType === "scheduled_daily") {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
    return next.toISOString();
  }

  if (rule.triggerType === "scheduled_weekly") {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(8, 0, 0, 0);
    return next.toISOString();
  }

  if (rule.triggerType === "scheduled_monthly") {
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    next.setHours(8, 0, 0, 0);
    return next.toISOString();
  }

  return null;
}
