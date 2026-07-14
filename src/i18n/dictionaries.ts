import type { AppLanguage } from "@/i18n/config";
import { brand } from "@/lib/branding";

export type CommonDictionary = {
  appName: string;
  tagline: string;
  workspaceLabel: string;
  home: string;
  nav: Record<
    | "home"
    | "finance"
    | "tasks"
    | "dashboard"
    | "health"
    | "documents"
    | "vehicles"
    | "family"
    | "birthdays"
    | "shopping"
    | "permissions"
    | "settings",
    string
  >;
  hero: {
    badge: string;
    description: string;
    dailyReview: string;
    tasks: string;
    finance: string;
    stats: {
      activeModules: string;
      localStorage: string;
      systemStatus: string;
      active: string;
      healthy: string;
    };
  };
  dashboard: {
    modules: string;
    workspaceAreas: string;
    whatCanDo: string;
  };
  searchPlaceholder: string;
  searchLabel: string;
  noSearchResults: string;
  notifications: string;
  noNotifications: string;
  openMenu: string;
  closeMenu: string;
  expandSidebar: string;
  collapseSidebar: string;
  language: string;
  currentLanguage: string;
  comingSoon: string;
};

const hebrewDictionary: CommonDictionary = {
  appName: brand.productName,
  tagline: brand.taglineHe,
  workspaceLabel: "מרחב משפחתי",
  home: "בית",
  nav: {
    home: "בית",
    finance: "כספים",
    tasks: "משימות",
    dashboard: "סקירה",
    health: "בריאות",
    documents: "מסמכים",
    vehicles: "רכבים",
    family: "משפחה",
    birthdays: "אירועי משפחה",
    shopping: "קניות",
    permissions: "הרשאות",
    settings: "הגדרות",
  },
  hero: {
    badge: brand.taglineHe,
    description: `מרחב משפחתי: ${brand.workspaceName}. כספים, משימות, מסמכים, בריאות, רכבים וניהול משפחתי במקום אחד שקט וברור.`,
    dailyReview: "סקירה יומית",
    tasks: "משימות",
    finance: "כספים",
    stats: {
      activeModules: "מודולים פעילים",
      localStorage: "שמירה מקומית",
      systemStatus: "מצב מערכת",
      active: "פעיל",
      healthy: "תקין",
    },
  },
  dashboard: {
    modules: "מודולים",
    workspaceAreas: "אזורי עבודה",
    whatCanDo: "מה אפשר לעשות עכשיו",
  },
  searchPlaceholder: "חיפוש בכל הבית",
  searchLabel: "חיפוש גלובלי",
  noSearchResults: "לא נמצאו תוצאות",
  notifications: "התראות",
  noNotifications: "אין התראות חדשות כרגע",
  openMenu: "פתח תפריט",
  closeMenu: "סגור תפריט",
  expandSidebar: "הרחב תפריט צד",
  collapseSidebar: "כווץ תפריט צד",
  language: "שפה",
  currentLanguage: "שפה נוכחית",
  comingSoon: "בקרוב",
};

const englishDictionary: CommonDictionary = {
  appName: brand.productName,
  tagline: brand.taglineEn,
  workspaceLabel: "Family workspace",
  home: "Home",
  nav: {
    home: "Home",
    finance: "Finance",
    tasks: "Tasks",
    dashboard: "Overview",
    health: "Health",
    documents: "Documents",
    vehicles: "Vehicles",
    family: "Family",
    birthdays: "Family Events",
    shopping: "Shopping",
    permissions: "Sharing",
    settings: "Settings",
  },
  hero: {
    badge: brand.taglineEn,
    description: `Family workspace: ${brand.workspaceName}. Finance, tasks, documents, health, vehicles and family routines in one calm place.`,
    dailyReview: "Daily review",
    tasks: "Tasks",
    finance: "Finance",
    stats: {
      activeModules: "Active modules",
      localStorage: "Local storage",
      systemStatus: "System status",
      active: "Active",
      healthy: "Healthy",
    },
  },
  dashboard: {
    modules: "Modules",
    workspaceAreas: "Work areas",
    whatCanDo: "What can we do now",
  },
  searchPlaceholder: "Search the family system",
  searchLabel: "Global search",
  noSearchResults: "No results found",
  notifications: "Notifications",
  noNotifications: "No new notifications right now",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  expandSidebar: "Expand sidebar",
  collapseSidebar: "Collapse sidebar",
  language: "Language",
  currentLanguage: "Current language",
  comingSoon: "Coming soon",
};

export const dictionaries: Record<AppLanguage, CommonDictionary> = {
  he: hebrewDictionary,
  en: englishDictionary,
  fr: englishDictionary,
  ru: englishDictionary,
  yi: hebrewDictionary,
  it: englishDictionary,
  es: englishDictionary,
};

export function getDictionary(language: AppLanguage) {
  return dictionaries[language] ?? dictionaries.he;
}
