"use client";

import { storageKeys } from "@/lib/storageKeys";
import type {
  FavoriteEntityType,
  HomeSectionId,
  PersonalizationPreferences,
  QuickActionId,
  SavedView,
} from "@/types/personalization";
import type { AppRoute } from "@/types/navigation";
import { readStorage, writeStorage } from "@/utils/storage";
import { createUuid } from "@/utils/ids";

export const personalizationChangedEventName = "nestly-personalization-change";

export const defaultPersonalizationPreferences: PersonalizationPreferences = {
  homeSections: [
    { id: "quickActions", visible: true },
    { id: "importantToday", visible: true },
    { id: "moreAreas", visible: true },
  ],
  quickActions: [
    { id: "shopping", pinned: true },
    { id: "tasks", pinned: true },
    { id: "finance", pinned: true },
    { id: "events", pinned: true },
    { id: "scanReceipt", pinned: true },
  ],
  favorites: [],
  savedViews: [],
  defaults: {
    tasksSort: "dueDate",
    financeSort: "newest",
    documentsFilter: "all",
    defaultReminderTiming: "day_before",
  },
  recentRecords: [],
};

function isHomeSectionId(value: unknown): value is HomeSectionId {
  return (
    value === "quickActions" || value === "importantToday" || value === "moreAreas"
  );
}

function isQuickActionId(value: unknown): value is QuickActionId {
  return (
    value === "shopping" ||
    value === "tasks" ||
    value === "finance" ||
    value === "events" ||
    value === "scanReceipt"
  );
}

function isSavedView(value: unknown): value is SavedView {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedView>;

  return (
    typeof item.id === "string" &&
    typeof item.scope === "string" &&
    typeof item.title === "string" &&
    typeof item.description === "string" &&
    typeof item.route === "string" &&
    Boolean(item.filters) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

function isPersonalizationPreferences(
  value: unknown
): value is PersonalizationPreferences {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PersonalizationPreferences>;

  return (
    Array.isArray(item.homeSections) &&
    Array.isArray(item.quickActions) &&
    Array.isArray(item.favorites) &&
    Array.isArray(item.savedViews) &&
    Boolean(item.defaults) &&
    Array.isArray(item.recentRecords)
  );
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${createUuid()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePreferences(
  input: PersonalizationPreferences
): PersonalizationPreferences {
  const sectionMap = new Map(
    input.homeSections
      .filter((section) => isHomeSectionId(section.id))
      .map((section) => [section.id, section.visible])
  );
  const quickActionMap = new Map(
    input.quickActions
      .filter((action) => isQuickActionId(action.id))
      .map((action) => [action.id, action.pinned])
  );

  return {
    ...defaultPersonalizationPreferences,
    ...input,
    homeSections: defaultPersonalizationPreferences.homeSections.map((section) => ({
      id: section.id,
      visible: sectionMap.get(section.id) ?? section.visible,
    })),
    quickActions: defaultPersonalizationPreferences.quickActions.map((action) => ({
      id: action.id,
      pinned: quickActionMap.get(action.id) ?? action.pinned,
    })),
    favorites: input.favorites.filter(
      (favorite) =>
        typeof favorite.id === "string" &&
        typeof favorite.entityId === "string" &&
        typeof favorite.title === "string" &&
        typeof favorite.route === "string"
    ),
    savedViews: input.savedViews.filter(isSavedView),
    recentRecords: input.recentRecords.filter(
      (record) =>
        typeof record.id === "string" &&
        typeof record.title === "string" &&
        typeof record.route === "string" &&
        typeof record.openedAt === "string"
    ),
  };
}

function emitChange(preferences: PersonalizationPreferences) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(personalizationChangedEventName, { detail: preferences })
  );
}

export function readPersonalizationPreferences() {
  return normalizePreferences(
    readStorage(
      storageKeys.personalization,
      defaultPersonalizationPreferences,
      isPersonalizationPreferences
    )
  );
}

export function writePersonalizationPreferences(
  preferences: PersonalizationPreferences
) {
  const normalized = normalizePreferences(preferences);
  writeStorage(storageKeys.personalization, normalized);
  emitChange(normalized);
  return normalized;
}

export function updateHomeSectionVisibility(id: HomeSectionId, visible: boolean) {
  const preferences = readPersonalizationPreferences();

  return writePersonalizationPreferences({
    ...preferences,
    homeSections: preferences.homeSections.map((section) =>
      section.id === id ? { ...section, visible } : section
    ),
  });
}

export function moveHomeSection(id: HomeSectionId, direction: -1 | 1) {
  const preferences = readPersonalizationPreferences();
  const currentIndex = preferences.homeSections.findIndex((section) => section.id === id);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= preferences.homeSections.length) {
    return preferences;
  }

  const homeSections = [...preferences.homeSections];
  const [section] = homeSections.splice(currentIndex, 1);
  homeSections.splice(nextIndex, 0, section);

  return writePersonalizationPreferences({ ...preferences, homeSections });
}

export function updateQuickActionPinned(id: QuickActionId, pinned: boolean) {
  const preferences = readPersonalizationPreferences();

  return writePersonalizationPreferences({
    ...preferences,
    quickActions: preferences.quickActions.map((action) =>
      action.id === id ? { ...action, pinned } : action
    ),
  });
}

export function addFavorite(input: {
  type: FavoriteEntityType;
  entityId: string;
  title: string;
  route: AppRoute;
}) {
  const preferences = readPersonalizationPreferences();
  const favoriteId = `${input.type}:${input.entityId}`;
  const nextFavorite = {
    id: favoriteId,
    type: input.type,
    entityId: input.entityId,
    title: input.title,
    route: input.route,
    updatedAt: nowIso(),
  };

  return writePersonalizationPreferences({
    ...preferences,
    favorites: [
      nextFavorite,
      ...preferences.favorites.filter((favorite) => favorite.id !== favoriteId),
    ].slice(0, 40),
  });
}

export function removeFavorite(favoriteId: string) {
  const preferences = readPersonalizationPreferences();

  return writePersonalizationPreferences({
    ...preferences,
    favorites: preferences.favorites.filter((favorite) => favorite.id !== favoriteId),
  });
}

export function saveView(input: Omit<SavedView, "id" | "createdAt" | "updatedAt">) {
  const preferences = readPersonalizationPreferences();
  const timestamp = nowIso();
  const savedView: SavedView = {
    ...input,
    id: createId("saved_view"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return writePersonalizationPreferences({
    ...preferences,
    savedViews: [savedView, ...preferences.savedViews].slice(0, 30),
  });
}

export function trackRecentlyOpenedRecord(input: {
  id: string;
  title: string;
  route: AppRoute;
}) {
  const preferences = readPersonalizationPreferences();
  const record = {
    ...input,
    openedAt: nowIso(),
  };

  return writePersonalizationPreferences({
    ...preferences,
    recentRecords: [
      record,
      ...preferences.recentRecords.filter((item) => item.id !== input.id),
    ].slice(0, 20),
  });
}
