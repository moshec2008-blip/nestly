import type { NavigationItem } from "@/types/navigation";

export const dashboardStats = [
  {
    title: "משימות פתוחות",
    value: "2",
    note: "דורשות טיפול",
  },
  {
    title: "פעולות כספים",
    value: "18",
    note: "בדמו הנוכחי",
  },
  {
    title: "מודולים פעילים",
    value: "13",
    note: "כל אזורי הבית מחוברים",
  },
  {
    title: "שמירה מקומית",
    value: "פעילה",
    note: "בדפדפן המשתמש",
  },
];

export const appModules: NavigationItem[] = [
  {
    label: "כספים",
    href: "/finance",
    description:
      "ניהול הכנסות, הוצאות, תקציבים, דוחות, ייבוא, ייצוא וגיבוי.",
    status: "פעיל",
  },
  {
    label: "משימות",
    href: "/tasks",
    description:
      "משימות בית, אחראים, תאריכי יעד, עדיפויות, חיפוש וסינון.",
    status: "פעיל",
  },
  {
    label: "מרכז המשפחה",
    href: "/command-center",
    description: "פעולה מומלצת, דחופים, היום ומה שמתקרב.",
    status: "פעיל",
  },
  {
    label: "ציר הזמן",
    href: "/timeline",
    description: "מה קרה לאחרונה במרחב המשפחתי.",
    status: "פעיל",
  },
  {
    label: "בריאות",
    href: "/health",
    description: "תורים, בדיקות, תרופות ומעקב בריאות משפחתי.",
    status: "פעיל",
  },
  {
    label: "מסמכים",
    href: "/documents",
    description: "מסמכים חשובים, קבצים, אישורים וחוזים.",
    status: "פעיל",
  },
  {
    label: "רכבים",
    href: "/vehicles",
    description: "טיפולים, ביטוחים, טסטים והוצאות רכב.",
    status: "פעיל",
  },
  {
    label: "משפחה",
    href: "/family",
    description: "מידע משפחתי, אנשי קשר והרשאות.",
    status: "פעיל",
  },
  {
    label: "מידע משפחתי",
    href: "/knowledge",
    description: "זיכרון ארוך טווח לבית: דגמים, העדפות, הוראות ואנשי קשר.",
    status: "פעיל",
  },
  {
    label: "מורשת משפחתית",
    href: "/legacy",
    description: "היסטוריה, אבני דרך, אוספים וארכיון משפחתי לאורך שנים.",
    status: "פעיל",
  },
  {
    label: "אירועי משפחה",
    href: "/birthdays",
    description: "תאריכים עבריים ולועזיים, גילאים, קרבה ותזכורות משפחתיות.",
    status: "פעיל",
  },
  {
    label: "קניות",
    href: "/shopping",
    description: "רשימות קניות משותפות, כמויות, מחירים, אחראים וסימון רכישה.",
    status: "פעיל",
  },
  {
    label: "הרשאות",
    href: "/permissions",
    description: "שיתוף משפחתי, תפקידים, אזורים פרטיים והרשאות לפי מודול.",
    status: "פעיל",
  },
  {
    label: "הגדרות",
    href: "/settings",
    description: "שפה, נגישות, נתונים והעדפות מערכת.",
    status: "פעיל",
  },
];
