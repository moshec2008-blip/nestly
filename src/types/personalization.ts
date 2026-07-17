import type { AppRoute } from "@/types/navigation";

export type HomeSectionId = "quickActions" | "importantToday" | "moreAreas";

export type QuickActionId =
  | "shopping"
  | "tasks"
  | "finance"
  | "events"
  | "scanReceipt";

export type FavoriteEntityType =
  | "document"
  | "note"
  | "collection"
  | "vehicle"
  | "task"
  | "knowledge";

export type SavedViewScope = "tasks" | "finance" | "documents" | "shopping";

export type SavedView = {
  id: string;
  scope: SavedViewScope;
  title: string;
  description: string;
  route: AppRoute;
  filters: Record<string, string | number | boolean | string[]>;
  createdAt: string;
  updatedAt: string;
};

export type PersonalizationPreferences = {
  homeSections: Array<{
    id: HomeSectionId;
    visible: boolean;
  }>;
  quickActions: Array<{
    id: QuickActionId;
    pinned: boolean;
  }>;
  favorites: Array<{
    id: string;
    type: FavoriteEntityType;
    entityId: string;
    title: string;
    route: AppRoute;
    updatedAt: string;
  }>;
  savedViews: SavedView[];
  defaults: {
    tasksSort: "dueDate" | "priority" | "created";
    financeSort: "newest" | "amount";
    documentsFilter: "all" | "needs_review" | "recent";
    defaultReminderTiming: "same_day" | "day_before" | "week_before";
  };
  recentRecords: Array<{
    id: string;
    title: string;
    route: AppRoute;
    openedAt: string;
  }>;
};
