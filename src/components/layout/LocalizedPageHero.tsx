"use client";

import PageHero from "@/components/layout/PageHero";
import { useLanguage } from "@/i18n/useLanguage";

type ModuleHeroKey =
  | "tasks"
  | "documents"
  | "vehicles"
  | "health"
  | "settings"
  | "permissions";

const heroCopy: Record<
  ModuleHeroKey,
  {
    he: { eyebrow: string; title: string; description: string };
    en: { eyebrow: string; title: string; description: string };
  }
> = {
  tasks: {
    he: {
      eyebrow: "מרכז משימות",
      title: "משימות",
      description:
        "ניהול משימות, אחראים, קטגוריות, עדיפויות ותאריכי יעד בצורה פשוטה וברורה.",
    },
    en: {
      eyebrow: "Task Center",
      title: "Tasks",
      description:
        "Manage tasks, owners, categories, priorities and due dates in a simple family-friendly way.",
    },
  },
  documents: {
    he: {
      eyebrow: "מסמכים",
      title: "מסמכים",
      description:
        "צירוף קבצים, ארגון מסמכים, חוזים, אישורים ותזכורות למסמכים חשובים.",
    },
    en: {
      eyebrow: "Documents",
      title: "Documents",
      description:
        "Upload, organize and track important family documents, contracts, approvals and reminders.",
    },
  },
  vehicles: {
    he: {
      eyebrow: "רכבים",
      title: "רכבים",
      description: "ניהול טיפולים, טסטים, ביטוחים והוצאות רכב משפחתיות.",
    },
    en: {
      eyebrow: "Vehicles",
      title: "Vehicles",
      description:
        "Track family cars, service dates, inspections, insurance and vehicle expenses.",
    },
  },
  health: {
    he: {
      eyebrow: "בריאות",
      title: "בריאות",
      description:
        "ניהול תורים, בדיקות, תרופות ומעקב בריאות משפחתי במקום אחד.",
    },
    en: {
      eyebrow: "Health",
      title: "Health",
      description:
        "Keep appointments, tests, medication and family health tracking in one place.",
    },
  },
  settings: {
    he: {
      eyebrow: "הגדרות",
      title: "הגדרות",
      description:
        "ניהול שפה, נגישות, תצוגה ושמירה מקומית של נתוני המערכת.",
    },
    en: {
      eyebrow: "Settings",
      title: "Settings",
      description:
        "Manage language, accessibility, appearance and local family data preferences.",
    },
  },
  permissions: {
    he: {
      eyebrow: "הרשאות ושיתוף",
      title: "הרשאות ושיתוף משפחתי",
      description:
        "ניהול תפקידים, אזורים פרטיים ומשותפים, והרשאות צפייה, יצירה, עריכה ומחיקה לפי מודול.",
    },
    en: {
      eyebrow: "Sharing",
      title: "Family sharing and permissions",
      description:
        "Manage roles, private and shared areas, and module permissions for viewing and editing.",
    },
  },
};

export default function LocalizedPageHero({
  module,
  showBackHome = true,
}: {
  module: ModuleHeroKey;
  showBackHome?: boolean;
}) {
  const { language } = useLanguage();
  const copy = language === "en" ? heroCopy[module].en : heroCopy[module].he;

  return <PageHero {...copy} showBackHome={showBackHome} />;
}
