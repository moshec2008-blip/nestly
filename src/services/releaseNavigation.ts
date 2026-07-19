import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

export type ReleaseNavigationLanguage = "he" | "en";

export type ReleaseNavigationRouteItem = {
  id: string;
  kind: "route";
  href: AppRoute;
  icon: AppIconName;
  label: Record<ReleaseNavigationLanguage, string>;
  description: Record<ReleaseNavigationLanguage, string>;
};

export type ReleaseNavigationActionItem = {
  id: string;
  kind: "action";
  eventName: "nestly-open-universal-inbox";
  eventDetail: Record<string, string>;
  icon: AppIconName;
  label: Record<ReleaseNavigationLanguage, string>;
  description: Record<ReleaseNavigationLanguage, string>;
};

export type ReleaseNavigationItem =
  | ReleaseNavigationRouteItem
  | ReleaseNavigationActionItem;

export const releasePrimaryNavigation: ReleaseNavigationItem[] = [
  {
    id: "home",
    kind: "route",
    href: "/",
    icon: "home",
    label: { he: "בית", en: "Home" },
    description: {
      he: "מה חשוב היום",
      en: "What matters today",
    },
  },
  {
    id: "capture",
    kind: "action",
    eventName: "nestly-open-universal-inbox",
    eventDetail: { source: "text", mode: "text" },
    icon: "spark",
    label: { he: "הוסף", en: "Add" },
    description: {
      he: "שמרו משהו חדש",
      en: "Capture something new",
    },
  },
  {
    id: "handle",
    kind: "route",
    href: "/handle",
    icon: "check",
    label: { he: "לטיפול", en: "Handle" },
    description: {
      he: "מה צריך אתכם עכשיו",
      en: "What needs you now",
    },
  },
  {
    id: "memory",
    kind: "route",
    href: "/memory",
    icon: "knowledge",
    label: { he: "למצוא", en: "Find" },
    description: {
      he: "חיפוש במה שנשמר",
      en: "Find what was saved",
    },
  },
];

export const releaseWorkspaceNavigation: ReleaseNavigationRouteItem[] = [
  {
    id: "tasks",
    kind: "route",
    href: "/tasks",
    icon: "check",
    label: { he: "משימות", en: "Tasks" },
    description: { he: "משימות ותזכורות", en: "Tasks and reminders" },
  },
  {
    id: "shopping",
    kind: "route",
    href: "/shopping",
    icon: "shopping",
    label: { he: "קניות", en: "Shopping" },
    description: { he: "רשימות קניות", en: "Shopping lists" },
  },
  {
    id: "finance",
    kind: "route",
    href: "/finance",
    icon: "finance",
    label: { he: "כספים", en: "Money" },
    description: { he: "תשלומים ותקציב", en: "Payments and budget" },
  },
  {
    id: "documents",
    kind: "route",
    href: "/documents",
    icon: "document",
    label: { he: "מסמכים", en: "Documents" },
    description: { he: "קבצים ואישורים", en: "Files and forms" },
  },
  {
    id: "health",
    kind: "route",
    href: "/health",
    icon: "health",
    label: { he: "בריאות", en: "Health" },
    description: { he: "תורים ומעקב", en: "Care and appointments" },
  },
  {
    id: "vehicles",
    kind: "route",
    href: "/vehicles",
    icon: "car",
    label: { he: "רכבים", en: "Vehicles" },
    description: { he: "טיפולים ורישוי", en: "Service and licensing" },
  },
  {
    id: "family",
    kind: "route",
    href: "/family",
    icon: "family",
    label: { he: "משפחה", en: "Family" },
    description: { he: "אנשים ופרטים", en: "People and details" },
  },
  {
    id: "birthdays",
    kind: "route",
    href: "/birthdays",
    icon: "calendar",
    label: { he: "אירועים", en: "Events" },
    description: { he: "ימי הולדת ותאריכים", en: "Dates and birthdays" },
  },
];

export const releaseSecondaryNavigation: ReleaseNavigationRouteItem[] = [
  {
    id: "command-center",
    kind: "route",
    href: "/command-center",
    icon: "dashboard",
    label: { he: "מרכז המשפחה", en: "Command Center" },
    description: { he: "סקירת טיפול ישנה", en: "Legacy action overview" },
  },
  {
    id: "dashboard",
    kind: "route",
    href: "/dashboard",
    icon: "dashboard",
    label: { he: "סקירה", en: "Overview" },
    description: { he: "סקירת מודולים", en: "Module overview" },
  },
  {
    id: "knowledge",
    kind: "route",
    href: "/knowledge",
    icon: "knowledge",
    label: { he: "מידע משפחתי", en: "Family Knowledge" },
    description: { he: "ידע שנשמר", en: "Saved knowledge" },
  },
  {
    id: "timeline",
    kind: "route",
    href: "/timeline",
    icon: "timeline",
    label: { he: "ציר הזמן", en: "Timeline" },
    description: { he: "מה קרה לאחרונה", en: "Recent history" },
  },
  {
    id: "life",
    kind: "route",
    href: "/life",
    icon: "flag",
    label: { he: "סיפורי חיים", en: "Life Stories" },
    description: { he: "תהליכים גדולים", en: "Bigger family arcs" },
  },
  {
    id: "legacy",
    kind: "route",
    href: "/legacy",
    icon: "book",
    label: { he: "מורשת", en: "Legacy" },
    description: { he: "ארכיון משפחתי", en: "Family archive" },
  },
  {
    id: "assistant",
    kind: "route",
    href: "/assistant",
    icon: "spark",
    label: { he: "העוזר", en: "Assistant" },
    description: { he: "עזרה חכמה", en: "Smart assistance" },
  },
  {
    id: "security",
    kind: "route",
    href: "/security",
    icon: "lock",
    label: { he: "אבטחה", en: "Security" },
    description: { he: "מידע רגיש", en: "Sensitive data" },
  },
  {
    id: "permissions",
    kind: "route",
    href: "/permissions",
    icon: "lock",
    label: { he: "הרשאות", en: "Sharing" },
    description: { he: "שיתוף ותפקידים", en: "Sharing and roles" },
  },
  {
    id: "settings",
    kind: "route",
    href: "/settings",
    icon: "settings",
    label: { he: "הגדרות", en: "Settings" },
    description: { he: "העדפות מערכת", en: "System preferences" },
  },
];

export const releaseMoreNavigation = [
  ...releaseWorkspaceNavigation,
  ...releaseSecondaryNavigation,
];

export const releaseNavigationRoutes = [
  ...releasePrimaryNavigation.filter(
    (item): item is ReleaseNavigationRouteItem => item.kind === "route"
  ),
  ...releaseMoreNavigation,
].map((item) => item.href);

export function getReleaseNavigationLanguage(language: string) {
  return language === "en" ? "en" : "he";
}

export function getNavigationItemLabel(
  item: ReleaseNavigationItem,
  language: string
) {
  return item.label[getReleaseNavigationLanguage(language)];
}

export function getNavigationItemDescription(
  item: ReleaseNavigationItem,
  language: string
) {
  return item.description[getReleaseNavigationLanguage(language)];
}

export function isRouteActive(pathname: string, href: AppRoute) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function isMoreActive(pathname: string) {
  return releaseMoreNavigation.some((item) => isRouteActive(pathname, item.href));
}
