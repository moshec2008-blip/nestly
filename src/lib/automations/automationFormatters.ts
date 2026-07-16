import type { AppLanguage } from "@/i18n/config";
import type { AutomationAction, AutomationRule } from "@/types/automations";
import { getAutomationActionEntry } from "@/lib/automations/actionRegistry";
import { getAutomationTriggerEntry } from "@/lib/automations/triggerRegistry";

function label(language: AppLanguage, he: string, en: string) {
  return language === "en" ? en : he;
}

export function formatAutomationAction(
  action: AutomationAction,
  language: AppLanguage = "he"
) {
  const entry = getAutomationActionEntry(action.type);
  return entry
    ? label(language, entry.labelHe, entry.labelEn)
    : action.type.replaceAll("_", " ");
}

export function formatAutomationTrigger(
  rule: Pick<AutomationRule, "triggerType">,
  language: AppLanguage = "he"
) {
  const entry = getAutomationTriggerEntry(rule.triggerType);
  return entry
    ? label(language, entry.labelHe, entry.labelEn)
    : rule.triggerType.replaceAll("_", " ");
}

export function formatAutomationSummary(
  rule: AutomationRule,
  language: AppLanguage = "he"
) {
  const trigger = formatAutomationTrigger(rule, language);
  const actions = rule.actions.map((action) =>
    formatAutomationAction(action, language)
  );

  if (language === "en") {
    return `When ${trigger.toLowerCase()}, Nestly will prepare: ${actions.join(", ")}.`;
  }

  return `כאשר ${trigger}, Nestly תכין: ${actions.join(", ")}.`;
}

export function formatAutomationStatus(
  status: AutomationRule["status"],
  language: AppLanguage = "he"
) {
  const labels: Record<AutomationRule["status"], { he: string; en: string }> = {
    active: { he: "פעילה", en: "Active" },
    paused: { he: "מושהית", en: "Paused" },
    error: { he: "דורשת טיפול", en: "Needs attention" },
    archived: { he: "בארכיון", en: "Archived" },
  };

  return label(language, labels[status].he, labels[status].en);
}
