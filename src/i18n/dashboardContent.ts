import { appModules, dashboardStats } from "@/data/dashboard";
import type { AppLanguage } from "@/i18n/config";
import type { AppRoute, NavigationItem } from "@/types/navigation";

type DashboardStat = {
  title: string;
  value: string;
  note: string;
};

type DashboardContent = {
  stats: DashboardStat[];
  modules: NavigationItem[];
};

const englishStats: DashboardStat[] = [
  {
    title: "Open tasks",
    value: "2",
    note: "Need attention",
  },
  {
    title: "Finance items",
    value: "18",
    note: "Current demo data",
  },
  {
    title: "Active modules",
    value: "11",
    note: "Family areas connected",
  },
  {
    title: "Local storage",
    value: "Active",
    note: "Saved in this browser",
  },
];

const englishModuleCopy: Record<
  AppRoute,
  Pick<NavigationItem, "label" | "description" | "status">
> = {
  "/": {
    label: "Home",
    description: "Daily family overview, quick actions and active modules.",
    status: "Active",
  },
  "/finance": {
    label: "Finance",
    description:
      "Income, expenses, budgets, reports, import, export and backups.",
    status: "Active",
  },
  "/tasks": {
    label: "Tasks",
    description:
      "Home tasks, owners, due dates, priorities, search and filters.",
    status: "Active",
  },
  "/dashboard": {
    label: "Overview",
    description: "A focused snapshot of the system and active modules.",
    status: "Active",
  },
  "/health": {
    label: "Health",
    description: "Appointments, tests, medication and family health tracking.",
    status: "Active",
  },
  "/documents": {
    label: "Documents",
    description: "Important documents, files, approvals and contracts.",
    status: "Active",
  },
  "/vehicles": {
    label: "Vehicles",
    description: "Maintenance, insurance, tests and vehicle expenses.",
    status: "Active",
  },
  "/family": {
    label: "Family",
    description: "Family information, contacts and permissions.",
    status: "Active",
  },
  "/birthdays": {
    label: "Birthdays",
    description:
      "Hebrew and Gregorian dates, ages, relationships and reminders.",
    status: "Active",
  },
  "/shopping": {
    label: "Shopping",
    description:
      "Shared shopping lists, quantities, prices, owners and purchased items.",
    status: "Active",
  },
  "/permissions": {
    label: "Sharing",
    description:
      "Family sharing, roles, private areas and module permissions.",
    status: "Active",
  },
  "/security": {
    label: "Security",
    description: "Demo access status and future security settings.",
    status: "Active",
  },
  "/settings": {
    label: "Settings",
    description: "Language, accessibility, data and system preferences.",
    status: "Active",
  },
};

function getEnglishModules(): NavigationItem[] {
  return appModules.map((module) => ({
    ...module,
    ...englishModuleCopy[module.href],
  }));
}

export function getDashboardContent(language: AppLanguage): DashboardContent {
  if (language === "en") {
    return {
      stats: englishStats,
      modules: getEnglishModules(),
    };
  }

  return {
    stats: dashboardStats,
    modules: appModules,
  };
}
