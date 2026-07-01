import type { ModuleRecord } from "@/types/modules";

export const initialHealthRecords: ModuleRecord[] = [
  {
    id: "health-1",
    title: "בדיקת שיניים תקופתית",
    description: "לתאם תור לכל המשפחה ולשמור תאריך ביומן.",
    owner: "הבית",
    category: "תורים",
    date: "2026-07-10",
    status: "open",
  },
  {
    id: "health-2",
    title: "מעקב תרופות",
    description: "לעדכן רשימת תרופות ומינונים קבועים.",
    owner: "הבית",
    category: "תרופות",
    date: "2026-07-01",
    status: "done",
  },
];

export const initialDocumentRecords: ModuleRecord[] = [
  {
    id: "documents-1",
    title: "ביטוח דירה",
    description: "לשמור פוליסה עדכנית ולבדוק תאריך חידוש.",
    owner: "הבית",
    category: "ביטוח",
    date: "2026-08-01",
    status: "open",
  },
  {
    id: "documents-2",
    title: "מסמכי בית ספר",
    description: "לרכז אישורים וטפסים לשנת הלימודים.",
    owner: "הבית",
    category: "חינוך",
    date: "2026-07-15",
    status: "open",
  },
];

export const initialVehicleRecords: ModuleRecord[] = [
  {
    id: "vehicles-1",
    title: "טסט לרכב",
    description: "בדיקת תאריך טסט והכנת מסמכים נדרשים.",
    owner: "הבית",
    category: "רישוי",
    date: "2026-08-20",
    status: "open",
  },
  {
    id: "vehicles-2",
    title: "טיפול תקופתי",
    description: "לתאם טיפול ולשמור חשבונית לאחר הביקור.",
    owner: "הבית",
    category: "תחזוקה",
    date: "2026-07-05",
    status: "open",
  },
];

export const initialFamilyRecords: ModuleRecord[] = [
  {
    id: "family-1",
    title: "אנשי קשר חשובים",
    description: "לעדכן רופאים, מוסדות, אנשי מקצוע ובני משפחה.",
    owner: "הבית",
    category: "אנשי קשר",
    date: "2026-07-03",
    status: "open",
  },
  {
    id: "family-2",
    title: "חלוקת אחריות שבועית",
    description: "לסדר תפקידים קבועים לבית ולמשפחה.",
    owner: "הבית",
    category: "אחריות",
    date: "2026-07-01",
    status: "done",
  },
];
