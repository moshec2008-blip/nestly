import type {
  TimelineEventType,
  TimelineSourceModule,
  TimelineVisibility,
} from "@/types/timeline";

export function formatTimelineTime(value: string, language: "he" | "en" = "he") {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getTimelineModuleLabel(
  sourceModule: TimelineSourceModule,
  language: "he" | "en" = "he"
) {
  const labels: Record<TimelineSourceModule, { he: string; en: string }> = {
    tasks: { he: "משימות", en: "Tasks" },
    shopping: { he: "קניות", en: "Shopping" },
    finance: { he: "כספים", en: "Finance" },
    documents: { he: "מסמכים", en: "Documents" },
    vehicles: { he: "רכבים", en: "Vehicles" },
    health: { he: "בריאות", en: "Health" },
    family: { he: "משפחה", en: "Family" },
    events: { he: "אירועים", en: "Events" },
    knowledge: { he: "מידע משפחתי", en: "Family Knowledge" },
    smart_inbox: { he: "לכידה חכמה", en: "Smart Capture" },
    permissions: { he: "הרשאות", en: "Permissions" },
    system: { he: "מערכת", en: "System" },
  };

  return labels[sourceModule][language];
}

export function getTimelineEventLabel(
  eventType: TimelineEventType,
  language: "he" | "en" = "he"
) {
  const labels: Partial<Record<TimelineEventType, { he: string; en: string }>> = {
    task_completed: { he: "משימה הושלמה", en: "Task completed" },
    task_reopened: { he: "משימה נפתחה מחדש", en: "Task reopened" },
    receipt_confirmed: { he: "קבלה נשמרה", en: "Receipt saved" },
    expense_added: { he: "הוצאה נוספה", en: "Expense added" },
    income_added: { he: "הכנסה נוספה", en: "Income added" },
    document_uploaded: { he: "מסמך נוסף", en: "Document added" },
    document_reviewed: { he: "מסמך נבדק", en: "Document reviewed" },
    vehicle_service_completed: {
      he: "טיפול רכב הושלם",
      en: "Vehicle service completed",
    },
    knowledge_created: { he: "מידע נשמר", en: "Knowledge saved" },
    knowledge_updated: { he: "מידע עודכן", en: "Knowledge updated" },
    custom_timeline_item: { he: "עדכון משפחתי", en: "Family update" },
  };

  return labels[eventType]?.[language] ?? eventType.replaceAll("_", " ");
}

export function getVisibilityLabel(
  visibility: TimelineVisibility,
  language: "he" | "en" = "he"
) {
  if (visibility === "private") {
    return language === "en" ? "Private" : "פרטי";
  }

  return language === "en" ? "Family" : "משפחתי";
}
