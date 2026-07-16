import type {
  AutomationActionType,
  AutomationSafetyLevel,
} from "@/types/automations";

export type AutomationActionRegistryEntry = {
  type: AutomationActionType;
  labelHe: string;
  labelEn: string;
  safetyLevel: AutomationSafetyLevel;
  requiresReview: boolean;
};

export const automationActionRegistry: AutomationActionRegistryEntry[] = [
  {
    type: "refresh_search_index",
    labelHe: "רענון אינדקס החיפוש",
    labelEn: "Refresh search index",
    safetyLevel: "system_maintenance",
    requiresReview: false,
  },
  {
    type: "update_derived_summary",
    labelHe: "עדכון סיכום מחושב",
    labelEn: "Update derived summary",
    safetyLevel: "system_maintenance",
    requiresReview: false,
  },
  {
    type: "add_timeline_event",
    labelHe: "הוספת עדכון לציר הזמן",
    labelEn: "Add Timeline update",
    safetyLevel: "system_maintenance",
    requiresReview: false,
  },
  {
    type: "invalidate_ai_suggestion",
    labelHe: "ביטול הצעת AI ישנה",
    labelEn: "Invalidate stale AI suggestion",
    safetyLevel: "system_maintenance",
    requiresReview: false,
  },
  {
    type: "refresh_command_center",
    labelHe: "רענון מרכז המשפחה",
    labelEn: "Refresh Command Center",
    safetyLevel: "system_maintenance",
    requiresReview: false,
  },
  {
    type: "archive_completed_item",
    labelHe: "העברת פריט שהושלם לארכיון",
    labelEn: "Archive completed item",
    safetyLevel: "safe_reversible",
    requiresReview: false,
  },
  {
    type: "prepare_weekly_summary",
    labelHe: "הכנת סיכום שבועי",
    labelEn: "Prepare weekly summary",
    safetyLevel: "safe_reversible",
    requiresReview: false,
  },
  {
    type: "notify_in_app",
    labelHe: "הצגת הודעה בתוך האפליקציה",
    labelEn: "Create in-app notification",
    safetyLevel: "safe_reversible",
    requiresReview: false,
  },
  {
    type: "create_task_draft",
    labelHe: "הכנת טיוטת משימה",
    labelEn: "Prepare task draft",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "create_reminder_draft",
    labelHe: "הכנת טיוטת תזכורת",
    labelEn: "Prepare reminder draft",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "create_checklist_draft",
    labelHe: "הכנת רשימת בדיקה",
    labelEn: "Prepare checklist draft",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "suggest_document_link",
    labelHe: "הצעת קישור למסמך",
    labelEn: "Suggest document link",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "suggest_finance_record",
    labelHe: "הצעת פעולה בכספים",
    labelEn: "Suggest finance record",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "suggest_family_knowledge",
    labelHe: "הצעת ידע משפחתי",
    labelEn: "Suggest family knowledge",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "request_user_review",
    labelHe: "בקשה לבדיקה ואישור",
    labelEn: "Request user review",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "open_workflow",
    labelHe: "פתיחת תהליך עבודה",
    labelEn: "Open workflow",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
  {
    type: "create_related_record_draft",
    labelHe: "הכנת רשומה קשורה",
    labelEn: "Prepare related record",
    safetyLevel: "confirmation_required",
    requiresReview: true,
  },
];

export function getAutomationActionEntry(type: AutomationActionType) {
  return automationActionRegistry.find((entry) => entry.type === type);
}
