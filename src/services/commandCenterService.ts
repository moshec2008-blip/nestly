import { initialBirthdays } from "@/data/birthdays";
import { initialFinanceTransactions, type FinanceTransaction } from "@/data/finance";
import {
  initialDocumentRecords,
  initialFamilyRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialPermissionUsers } from "@/data/permissions";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import {
  readCommandCenterPreferences,
  dismissCommandCenterItem,
  snoozeCommandCenterItem,
} from "@/repositories/commandCenterPreferencesRepository";
import {
  calculateImportanceScore,
  calculateUrgencyScore,
  explainCommandCenterReason,
  getDaysUntil,
  priorityFromScores,
  sortCommandCenterItems,
} from "@/services/commandCenterPriorityService";
import { readKnowledgeItems } from "@/services/familyKnowledge";
import type { BirthdayPerson } from "@/types/birthdays";
import { isSmartCapture, type SmartCapture } from "@/types/capture";
import type {
  CommandCenterContext,
  CommandCenterItem,
  CommandCenterModule,
  CommandCenterPriority,
  CommandCenterSections,
} from "@/types/commandCenter";
import type { ModuleRecord } from "@/types/modules";
import type { AppRoute } from "@/types/navigation";
import type { FamilyPermissionUser } from "@/types/permissions";
import type { ShoppingItem } from "@/types/shopping";
import { readStorageArray, writeStorage } from "@/utils/storage";

const dayMs = 24 * 60 * 60 * 1000;

function todayIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function daysAgoIso(days: number, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function buildItem(
  input: Omit<
    CommandCenterItem,
    | "urgencyScore"
    | "importanceScore"
    | "isOverdue"
    | "generatedAt"
    | "reason"
  >,
  now = new Date()
): CommandCenterItem {
  const isOverdue = Boolean(input.dueAt && getDaysUntil(input.dueAt, now) !== null && (getDaysUntil(input.dueAt, now) ?? 0) < 0);
  const baseItem = {
    ...input,
    isOverdue,
    generatedAt: now.toISOString(),
  };
  const urgencyScore = calculateUrgencyScore(baseItem, now);
  const importanceScore = calculateImportanceScore(baseItem);
  const priority = input.priority === "normal"
    ? priorityFromScores(urgencyScore, importanceScore)
    : input.priority;
  const item = {
    ...baseItem,
    priority,
    urgencyScore,
    importanceScore,
    reason: "",
  };

  return {
    ...item,
    reason: explainCommandCenterReason(item, now),
  };
}

function itemKey(item: Pick<CommandCenterItem, "sourceModule" | "sourceEntityId">) {
  return `${item.sourceModule}:${item.sourceEntityId}`;
}

function isPreferenceActive(item: CommandCenterItem, now = new Date()) {
  const preference = readCommandCenterPreferences().find(
    (entry) => entry.itemKey === itemKey(item)
  );

  if (!preference) {
    return false;
  }

  if (preference.snoozedUntil) {
    const snoozedUntil = new Date(preference.snoozedUntil);
    return snoozedUntil.getTime() > now.getTime();
  }

  if (preference.dismissedAt && item.priority !== "critical") {
    return true;
  }

  return false;
}

function sourceLabel(sourceModule: CommandCenterModule) {
  const labels: Record<CommandCenterModule, string> = {
    tasks: "משימות",
    shopping: "קניות",
    finance: "כספים",
    documents: "מסמכים",
    vehicles: "רכבים",
    health: "בריאות",
    family: "משפחה",
    events: "אירועים",
    knowledge: "מידע משפחתי",
    smart_inbox: "Smart Inbox",
    permissions: "הרשאות",
  };

  return labels[sourceModule];
}

function taskPriority(priority: FamilyTask["priority"]): CommandCenterPriority {
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "normal";
}

function taskItems(now: Date) {
  const tasks = readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks);

  return tasks.map((task) =>
    buildItem(
      {
        id: `task-${task.id}`,
        sourceModule: "tasks",
        sourceEntityType: "task",
        sourceEntityId: task.id,
        sourceUrl: "/tasks",
        title: task.title,
        description: task.description,
        status: task.status === "done" ? "completed" : "open",
        priority: taskPriority(task.priority),
        dueAt: task.dueDate,
        completedAt: task.status === "done" ? task.dueDate : undefined,
        assignedToName: task.owner,
        category: task.category,
        actionType: task.status === "done" ? "open" : "complete",
        primaryActionLabel: task.status === "done" ? "פתח משימה" : "סמן כהושלם",
        secondaryActionLabel: "פתח פרטים",
        requiresReview: false,
        isBlocked: false,
        visibility: "family",
        metadata: { sourceLabel: sourceLabel("tasks") },
      },
      now
    )
  );
}

function shoppingItems(now: Date) {
  const items = readStorageArray<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  );
  const openItems = items.filter((item) => !item.purchased);
  const listNames = Array.from(new Set(openItems.map((item) => item.listName)));

  if (openItems.length === 0) {
    return items
      .filter((item) => item.purchased)
      .slice(0, 2)
      .map((item) =>
        buildItem(
          {
            id: `shopping-done-${item.id}`,
            sourceModule: "shopping",
            sourceEntityType: "shopping_item",
            sourceEntityId: item.id,
            sourceUrl: "/shopping",
            title: `נרכש: ${item.title}`,
            description: item.notes || item.listName,
            status: "completed",
            priority: "low",
            completedAt: todayIso(now),
            assignedToName: item.buyer,
            category: item.department,
            actionType: "open",
            primaryActionLabel: "פתח קניות",
            requiresReview: false,
            isBlocked: false,
            visibility: "family",
            metadata: { sourceLabel: sourceLabel("shopping") },
          },
          now
        )
      );
  }

  return [
    buildItem(
      {
        id: "shopping-active-list",
        sourceModule: "shopping",
        sourceEntityType: "shopping_list",
        sourceEntityId: "active",
        sourceUrl: "/shopping",
        title: `${openItems.length} פריטים לקנייה`,
        description: listNames.length > 1 ? `${listNames.length} רשימות פעילות` : listNames[0],
        status: "open",
        priority: openItems.length >= 6 ? "high" : "normal",
        dueAt: todayIso(now),
        category: "קניות",
        actionType: "open",
        primaryActionLabel: "פתח רשימה",
        requiresReview: false,
        isBlocked: false,
        visibility: "family",
        metadata: { sourceLabel: sourceLabel("shopping"), count: openItems.length },
      },
      now
    ),
  ];
}

function financeItems(now: Date) {
  const transactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );

  return transactions
    .filter((transaction) => transaction.status === "pending" || transaction.reminderDate)
    .map((transaction) =>
      buildItem(
        {
          id: `finance-${transaction.id}`,
          sourceModule: "finance",
          sourceEntityType: "transaction",
          sourceEntityId: transaction.id,
          sourceUrl: "/finance",
          title: transaction.title,
          description: `${transaction.category} · ${transaction.amount.toLocaleString("he-IL")} ₪`,
          status: transaction.status === "done" ? "completed" : "open",
          priority: transaction.type === "expense" ? "high" : "normal",
          dueAt: transaction.reminderDate ?? transaction.date,
          category: transaction.category,
          actionType: "follow_up",
          primaryActionLabel: "פתח כספים",
          requiresReview: transaction.status === "pending",
          isBlocked: false,
          visibility: "family",
          metadata: { sourceLabel: sourceLabel("finance"), amount: transaction.amount },
        },
        now
      )
    );
}

function moduleRecordItems(
  records: ModuleRecord[],
  sourceModule: CommandCenterModule,
  sourceUrl: AppRoute,
  sourceEntityType: string,
  now: Date
) {
  return records.map((record) =>
    buildItem(
      {
        id: `${sourceModule}-${record.id}`,
        sourceModule,
        sourceEntityType,
        sourceEntityId: record.id,
        sourceUrl,
        title: record.title,
        description: record.description,
        status: record.status === "done" ? "completed" : "open",
        priority: record.status === "open" ? "normal" : "low",
        dueAt: record.date,
        completedAt: record.status === "done" ? record.date : undefined,
        assignedToName: record.owner,
        category: record.category,
        actionType: record.status === "done" ? "open" : "prepare",
        primaryActionLabel: `פתח ${sourceLabel(sourceModule)}`,
        requiresReview: false,
        isBlocked: false,
        visibility: "family",
        metadata: { sourceLabel: sourceLabel(sourceModule) },
      },
      now
    )
  );
}

function familyEventItems(now: Date) {
  const events = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );

  return events
    .map((event) => {
      const date = event.gregorianDate;
      const thisYear = new Date(now).getFullYear();
      const sourceDate = new Date(date);
      const nextDate = new Date(thisYear, sourceDate.getMonth(), sourceDate.getDate());
      if (nextDate < now) nextDate.setFullYear(thisYear + 1);
      const dueAt = nextDate.toISOString().slice(0, 10);
      const days = getDaysUntil(dueAt, now);

      if (days === null || days > 30) {
        return null;
      }

      return buildItem(
        {
          id: `event-${event.id}`,
          sourceModule: "events",
          sourceEntityType: "family_event",
          sourceEntityId: event.id,
          sourceUrl: "/birthdays",
          title: event.person || event.name,
          description: event.notes || event.relationship,
          status: days <= 7 ? "open" : "upcoming",
          priority: days <= 7 ? "normal" : "low",
          dueAt,
          assignedToName: event.person,
          category: event.eventType ?? "אירוע",
          actionType: "prepare",
          primaryActionLabel: "פתח אירועים",
          requiresReview: false,
          isBlocked: false,
          visibility: "family",
          metadata: { sourceLabel: sourceLabel("events") },
        },
        now
      );
    })
    .filter((item): item is CommandCenterItem => Boolean(item));
}

function smartInboxItems(now: Date) {
  const captures = readStorageArray<SmartCapture>(
    storageKeys.smartCaptures,
    [],
    isSmartCapture
  );

  return captures
    .filter((capture) => capture.status === "new" || capture.status === "reviewed")
    .map((capture) =>
      buildItem(
        {
          id: `capture-${capture.id}`,
          sourceModule: "smart_inbox",
          sourceEntityType: "smart_capture",
          sourceEntityId: capture.id,
          sourceUrl: "/",
          title: capture.title,
          description: `${capture.suggestions.length} הצעות ממתינות לבדיקה`,
          status: "review",
          priority: "high",
          dueAt: capture.createdAt.slice(0, 10),
          category: "לכידה",
          actionType: "review",
          primaryActionLabel: "פתח לכידה",
          requiresReview: true,
          isBlocked: false,
          visibility: "family",
          metadata: { sourceLabel: sourceLabel("smart_inbox") },
        },
        now
      )
    );
}

function knowledgeItems(now: Date) {
  return readKnowledgeItems()
    .filter((item) => item.pinned)
    .map((item) =>
      buildItem(
        {
          id: `knowledge-${item.id}`,
          sourceModule: "knowledge",
          sourceEntityType: "knowledge_item",
          sourceEntityId: item.id,
          sourceUrl: "/knowledge",
          title: item.title,
          description: item.content.slice(0, 120),
          status: "open",
          priority: "low",
          category: item.category,
          actionType: "open",
          primaryActionLabel: "פתח מידע",
          requiresReview: false,
          isBlocked: false,
          visibility: "family",
          metadata: { sourceLabel: sourceLabel("knowledge"), pinned: item.pinned },
        },
        now
      )
    );
}

function permissionItems(now: Date) {
  const users = readStorageArray<FamilyPermissionUser>(
    storageKeys.permissions,
    initialPermissionUsers
  );

  return users
    .filter((user) => user.role === "limited")
    .slice(0, 1)
    .map((user) =>
      buildItem(
        {
          id: `permission-${user.id}`,
          sourceModule: "permissions",
          sourceEntityType: "permission_user",
          sourceEntityId: user.id,
          sourceUrl: "/permissions",
          title: `בדיקת הרשאות עבור ${user.name}`,
          description: user.note,
          status: "waiting",
          priority: "low",
          category: "הרשאות",
          actionType: "follow_up",
          primaryActionLabel: "פתח הרשאות",
          requiresReview: false,
          isBlocked: true,
          blockedReason: "ממתין להגדרת תפקידים והרשאות משפחתיות.",
          visibility: "family",
          metadata: { sourceLabel: sourceLabel("permissions") },
        },
        now
      )
    );
}

function applyPreferences(items: CommandCenterItem[], now: Date) {
  return items.filter((item) => !isPreferenceActive(item, now));
}

export function getCommandCenterItems(context: CommandCenterContext = {}) {
  const now = context.now ?? new Date();
  const rawItems = [
    ...taskItems(now),
    ...shoppingItems(now),
    ...financeItems(now),
    ...moduleRecordItems(
      readStorageArray(storageKeys.documents, initialDocumentRecords),
      "documents",
      "/documents",
      "document",
      now
    ),
    ...moduleRecordItems(
      readStorageArray(storageKeys.vehicles, initialVehicleRecords),
      "vehicles",
      "/vehicles",
      "vehicle_record",
      now
    ),
    ...moduleRecordItems(
      readStorageArray(storageKeys.health, initialHealthRecords),
      "health",
      "/health",
      "health_record",
      now
    ),
    ...moduleRecordItems(
      readStorageArray(storageKeys.family, initialFamilyRecords),
      "family",
      "/family",
      "family_record",
      now
    ),
    ...familyEventItems(now),
    ...smartInboxItems(now),
    ...knowledgeItems(now),
    ...permissionItems(now),
  ];

  const filteredByCompletion = context.includeCompleted
    ? rawItems
    : rawItems.filter(
        (item) =>
          item.status !== "completed" ||
          Boolean(item.completedAt && item.completedAt >= daysAgoIso(14, now))
      );

  return sortCommandCenterItems(applyPreferences(filteredByCompletion, now));
}

export function getDailyFocus(items: CommandCenterItem[]) {
  return sortCommandCenterItems(
    items.filter(
      (item) =>
        item.status !== "completed" &&
        !item.isBlocked &&
        item.actionType !== "open" &&
        item.urgencyScore + item.importanceScore >= 45
    )
  )[0] ?? null;
}

export function getCommandCenterSections(
  context: CommandCenterContext = {}
): CommandCenterSections {
  const now = context.now ?? new Date();
  const items = getCommandCenterItems({ ...context, includeCompleted: true });
  const activeItems = items.filter((item) => item.status !== "completed");
  const recentlyCompleted = items
    .filter((item) => item.status === "completed")
    .filter((item) => !item.completedAt || item.completedAt >= daysAgoIso(14, now))
    .slice(0, 5);
  const urgent = activeItems
    .filter((item) => item.priority === "critical" || item.isOverdue || item.urgencyScore >= 55)
    .slice(0, 5);
  const today = activeItems
    .filter((item) => {
      const days = getDaysUntil(item.dueAt, now);
      return days === 0 || item.requiresReview;
    })
    .filter((item) => !urgent.some((urgentItem) => urgentItem.id === item.id))
    .slice(0, 5);
  const waiting = activeItems
    .filter((item) => item.status === "waiting" || item.isBlocked)
    .slice(0, 4);
  const upcoming = activeItems
    .filter((item) => {
      const days = getDaysUntil(item.dueAt, now);
      return days !== null && days > 0 && days <= 30;
    })
    .filter(
      (item) =>
        !urgent.some((urgentItem) => urgentItem.id === item.id) &&
        !today.some((todayItem) => todayItem.id === item.id)
    )
    .slice(0, 5);

  return {
    dailyFocus: getDailyFocus(activeItems),
    urgent,
    today,
    waiting,
    upcoming,
    recentlyCompleted,
    all: activeItems,
  };
}

export function dismissCommandCenterRecommendation(item: CommandCenterItem) {
  return dismissCommandCenterItem(itemKey(item), "not_now");
}

export function snoozeCommandCenterRecommendation(
  item: CommandCenterItem,
  until: string
) {
  return snoozeCommandCenterItem(itemKey(item), until);
}

export function completeCommandCenterTask(item: CommandCenterItem) {
  if (item.sourceModule !== "tasks" || item.actionType !== "complete") {
    return false;
  }

  const tasks = readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks);
  const updatedTasks = tasks.map((task) =>
    task.id === item.sourceEntityId ? { ...task, status: "done" as const } : task
  );
  return writeStorage(storageKeys.tasks, updatedTasks);
}

export function getTomorrowSnoozeIso(now = new Date()) {
  const tomorrow = new Date(now.getTime() + dayMs);
  tomorrow.setHours(8, 0, 0, 0);
  return tomorrow.toISOString();
}
