import type { AutomationTriggerType } from "@/types/automations";

export type AutomationTriggerRegistryEntry = {
  type: AutomationTriggerType;
  labelHe: string;
  labelEn: string;
  category: "tasks" | "documents" | "finance" | "shopping" | "vehicles" | "knowledge" | "schedule" | "system";
};

export const automationTriggerRegistry: AutomationTriggerRegistryEntry[] = [
  { type: "task_created", labelHe: "נוצרה משימה", labelEn: "Task created", category: "tasks" },
  { type: "task_completed", labelHe: "משימה הושלמה", labelEn: "Task completed", category: "tasks" },
  { type: "task_due_soon", labelHe: "משימה מתקרבת", labelEn: "Task due soon", category: "tasks" },
  { type: "document_uploaded", labelHe: "מסמך הועלה", labelEn: "Document uploaded", category: "documents" },
  { type: "document_reviewed", labelHe: "מסמך נבדק", labelEn: "Document reviewed", category: "documents" },
  { type: "document_expiring", labelHe: "מסמך עומד לפוג", labelEn: "Document expiring", category: "documents" },
  { type: "receipt_scanned", labelHe: "קבלה נסרקה", labelEn: "Receipt scanned", category: "finance" },
  { type: "receipt_confirmed", labelHe: "קבלה אושרה", labelEn: "Receipt confirmed", category: "finance" },
  { type: "finance_record_created", labelHe: "נוצרה פעולה כספית", labelEn: "Finance record created", category: "finance" },
  { type: "vehicle_reminder_due", labelHe: "תזכורת רכב מתקרבת", labelEn: "Vehicle reminder due", category: "vehicles" },
  { type: "shopping_list_completed", labelHe: "רשימת קניות הושלמה", labelEn: "Shopping list completed", category: "shopping" },
  { type: "note_created", labelHe: "נוצרה לכידה", labelEn: "Capture created", category: "knowledge" },
  { type: "note_converted", labelHe: "לכידה הומרה", labelEn: "Capture converted", category: "knowledge" },
  { type: "family_knowledge_created", labelHe: "נשמר ידע משפחתי", labelEn: "Family knowledge created", category: "knowledge" },
  { type: "smart_inbox_item_created", labelHe: "נוצר פריט לבדיקה", labelEn: "Review item created", category: "system" },
  { type: "smart_inbox_item_reviewed", labelHe: "פריט נבדק", labelEn: "Review item reviewed", category: "system" },
  { type: "scheduled_daily", labelHe: "כל יום", labelEn: "Daily schedule", category: "schedule" },
  { type: "scheduled_weekly", labelHe: "כל שבוע", labelEn: "Weekly schedule", category: "schedule" },
  { type: "scheduled_monthly", labelHe: "כל חודש", labelEn: "Monthly schedule", category: "schedule" },
  { type: "manual_trigger", labelHe: "הפעלה ידנית", labelEn: "Manual trigger", category: "system" },
];

export function getAutomationTriggerEntry(type: AutomationTriggerType) {
  return automationTriggerRegistry.find((entry) => entry.type === type);
}
