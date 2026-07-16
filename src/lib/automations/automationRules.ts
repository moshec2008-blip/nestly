import type {
  AutomationAction,
  AutomationSafetyLevel,
} from "@/types/automations";

const safetyRank: Record<AutomationSafetyLevel, number> = {
  system_maintenance: 1,
  safe_reversible: 2,
  confirmation_required: 3,
  never_autonomous: 4,
};

export const automationSafetyPolicy: Record<
  AutomationSafetyLevel,
  { labelHe: string; labelEn: string; mayRunAutomatically: boolean }
> = {
  system_maintenance: {
    labelHe: "תחזוקת מערכת",
    labelEn: "System maintenance",
    mayRunAutomatically: true,
  },
  safe_reversible: {
    labelHe: "בטוח והפיך",
    labelEn: "Safe and reversible",
    mayRunAutomatically: true,
  },
  confirmation_required: {
    labelHe: "דורש אישור",
    labelEn: "Requires confirmation",
    mayRunAutomatically: false,
  },
  never_autonomous: {
    labelHe: "לעולם לא אוטומטי",
    labelEn: "Never autonomous",
    mayRunAutomatically: false,
  },
};

export function getHighestSafetyLevel(actions: AutomationAction[]) {
  return actions.reduce<AutomationSafetyLevel>(
    (highest, action) =>
      safetyRank[action.safetyLevel] > safetyRank[highest]
        ? action.safetyLevel
        : highest,
    "system_maintenance"
  );
}

export function actionRequiresReview(action: AutomationAction) {
  return !automationSafetyPolicy[action.safetyLevel].mayRunAutomatically;
}

export function automationRequiresReview(actions: AutomationAction[]) {
  return actions.some(actionRequiresReview);
}

export function createAutomationExecutionKey(input: {
  automationId: string;
  sourceEntityId?: string;
  sourceVersion?: string;
  actionTypes: string[];
}) {
  return [
    input.automationId,
    input.sourceEntityId ?? "manual",
    input.sourceVersion ?? "v0",
    input.actionTypes.slice().sort().join("+"),
  ].join(":");
}
