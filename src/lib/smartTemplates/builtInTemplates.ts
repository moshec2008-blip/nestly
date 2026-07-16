import type { SmartTemplate } from "@/types/smartTemplates";

const now = "2026-07-16T00:00:00.000Z";

export const builtInSmartTemplates: SmartTemplate[] = [
  {
    id: "moving-home-he",
    title: "מעבר דירה",
    description: "רשימת הכנה קצרה למעבר דירה בלי לשכוח מסמכים, ספקים וקניות.",
    category: "home",
    icon: "home",
    version: 1,
    locale: "he",
    tasks: [
      { id: "moving-address", title: "לעדכן כתובת אצל ספקים חשובים", suggestedModule: "tasks" },
      { id: "moving-utilities", title: "לתאם חיבור מים, חשמל ואינטרנט", suggestedModule: "tasks" },
      { id: "moving-keys", title: "לתאם מסירת מפתחות", suggestedModule: "tasks" },
    ],
    checklists: [
      { id: "moving-boxes", title: "אריזת חדרים לפי אזורים", suggestedModule: "tasks" },
    ],
    reminders: [
      { id: "moving-final-reading", title: "לצלם מונים ביום המעבר", defaultOffsetDays: 0, suggestedModule: "tasks" },
    ],
    documentRequirements: [
      { id: "moving-contract", title: "חוזה שכירות / רכישה", suggestedModule: "documents" },
      { id: "moving-insurance", title: "ביטוח דירה", optional: true, suggestedModule: "documents" },
    ],
    shoppingItems: [
      { id: "moving-cleaning", title: "חומרי ניקיון ליום המעבר", suggestedModule: "shopping" },
    ],
    knowledgePrompts: [
      { id: "moving-codes", title: "קודים, ספקים ואנשי קשר לבית החדש", suggestedModule: "knowledge" },
    ],
    suggestedRelations: [],
    estimatedDuration: "שבועיים עד חודש",
    source: "built_in",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "buying-car-he",
    title: "קניית רכב",
    description: "תהליך מסודר לבדיקות, מסמכים, ביטוח והוצאות סביב רכב חדש.",
    category: "vehicle",
    icon: "car",
    version: 1,
    locale: "he",
    tasks: [
      { id: "car-check", title: "לתאם בדיקה לפני קנייה", suggestedModule: "tasks" },
      { id: "car-insurance", title: "להשוות הצעות ביטוח", suggestedModule: "tasks" },
      { id: "car-transfer", title: "לוודא העברת בעלות", suggestedModule: "tasks" },
    ],
    checklists: [
      { id: "car-questions", title: "רשימת שאלות למוכר", suggestedModule: "tasks" },
    ],
    reminders: [
      { id: "car-test-reminder", title: "להוסיף תזכורת לטסט הבא", suggestedModule: "tasks" },
    ],
    documentRequirements: [
      { id: "car-license", title: "רישיון רכב", suggestedModule: "documents" },
      { id: "car-insurance-doc", title: "פוליסת ביטוח", suggestedModule: "documents" },
    ],
    shoppingItems: [],
    knowledgePrompts: [
      { id: "car-details", title: "מספר רכב, דגם, קילומטרים ותאריכים חשובים", suggestedModule: "knowledge" },
    ],
    suggestedRelations: [],
    estimatedDuration: "כמה ימים",
    source: "built_in",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "monthly-budget-he",
    title: "הכנת תקציב חודשי",
    description: "פתיחת חודש מסודרת: יתרות, הוצאות קבועות ומשימות לטיפול.",
    category: "finance",
    icon: "finance",
    version: 1,
    locale: "he",
    tasks: [
      { id: "budget-balance", title: "לעדכן יתרת בנק ידנית", suggestedModule: "tasks" },
      { id: "budget-fixed", title: "לבדוק הוצאות קבועות החודש", suggestedModule: "tasks" },
      { id: "budget-saving", title: "לעדכן יתרת חסכונות והלוואות", suggestedModule: "tasks" },
    ],
    checklists: [],
    reminders: [
      { id: "budget-weekly", title: "בדיקת תקציב שבועית", defaultOffsetDays: 7, suggestedModule: "tasks" },
    ],
    documentRequirements: [],
    shoppingItems: [],
    knowledgePrompts: [
      { id: "budget-notes", title: "החלטות משפחתיות לתקציב החודש", suggestedModule: "knowledge" },
    ],
    suggestedRelations: [],
    estimatedDuration: "15 דקות",
    source: "built_in",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];
