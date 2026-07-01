import type { AuthSession } from "@/types/auth";

export const demoAdminSession: AuthSession = {
  id: "auth-admin-1",
  name: "מוישי",
  email: "moshe@example.com",
  provider: "google",
  role: "admin",
  workspaceName: "משפחת כהן שור",
  signedInAt: new Date().toISOString(),
};

export const authProviderNotes = [
  {
    title: "Google OAuth",
    description:
      "כניסה מאובטחת דרך Google בלי לבקש או לשמור את סיסמת Google באפליקציה.",
  },
  {
    title: "מייל וסיסמה",
    description:
      "מיועד לחשבון Nestly עצמאי. הסיסמה לא נשמרת ב-localStorage בתצורת הפיתוח.",
  },
  {
    title: "הרשאות מנהל",
    description:
      "מנהל המשפחה יכול לקבוע צפייה, יצירה, עריכה ומחיקה לכל מודול.",
  },
];

