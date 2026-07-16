import type { AutomationConditionType } from "@/types/automations";

export type AutomationConditionRegistryEntry = {
  type: AutomationConditionType;
  labelHe: string;
  labelEn: string;
};

export const automationConditionRegistry: AutomationConditionRegistryEntry[] = [
  { type: "source_module", labelHe: "מקור הפעולה", labelEn: "Source module" },
  { type: "document_type", labelHe: "סוג מסמך", labelEn: "Document type" },
  { type: "due_date_exists", labelHe: "יש תאריך יעד", labelEn: "Due date exists" },
  { type: "expiration_within_days", labelHe: "תוקף מסתיים בתוך ימים", labelEn: "Expiration within days" },
  { type: "task_assigned_to_current_user", labelHe: "משויך למשתמש הנוכחי", labelEn: "Assigned to current user" },
  { type: "amount_above", labelHe: "סכום מעל", labelEn: "Amount above" },
  { type: "amount_below", labelHe: "סכום מתחת", labelEn: "Amount below" },
  { type: "record_status", labelHe: "סטטוס רשומה", labelEn: "Record status" },
  { type: "family_member", labelHe: "בן משפחה", labelEn: "Family member" },
  { type: "vehicle", labelHe: "רכב", labelEn: "Vehicle" },
  { type: "visibility", labelHe: "רמת פרטיות", labelEn: "Visibility" },
  { type: "category", labelHe: "קטגוריה", labelEn: "Category" },
  { type: "source_mode", labelHe: "מצב מקור", labelEn: "Source mode" },
  { type: "confirmation_status", labelHe: "סטטוס אישור", labelEn: "Confirmation status" },
];

export function getAutomationConditionEntry(type: AutomationConditionType) {
  return automationConditionRegistry.find((entry) => entry.type === type);
}
