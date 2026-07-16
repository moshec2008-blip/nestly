import type { AutomationExecutionRecord } from "@/types/automations";
import {
  appendAutomationHistory,
  findAutomationHistoryByExecutionKey,
  readAutomationHistory,
} from "@/repositories/automationRepository";

export function hasAutomationExecutionRun(executionKey: string) {
  return Boolean(findAutomationHistoryByExecutionKey(executionKey));
}

export function recordAutomationExecution(record: AutomationExecutionRecord) {
  return appendAutomationHistory(record);
}

export function getAutomationHistoryForRule(automationId: string) {
  return readAutomationHistory().filter(
    (record) => record.automationId === automationId
  );
}
