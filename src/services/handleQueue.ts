import {
  initialDocumentRecords,
  initialFamilyRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialFinanceTransactions } from "@/data/finance";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray, writeStorage } from "@/utils/storage";
import type { FinanceTransaction } from "@/data/finance";
import type { FamilyTask } from "@/data/tasks";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import type { LifeEvent } from "@/types/lifeEvents";
import type { UniversalInboxItem } from "@/types/universalInbox";
import type {
  HandleDomain,
  HandleCompletedItem,
  HandleCompletionResult,
  HandleCompletionUndoToken,
  HandleQueueItem,
  HandleQueueState,
  HandleUrgency,
} from "@/types/handleQueue";
import { nowIso } from "@/utils/dateTime";
import { getLocale } from "@/i18n/locale";

type CollectResult<T> = {
  items: T[];
  warnings: string[];
};

function getDaysUntilDate(value: string | undefined, referenceDate = new Date()) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const target = new Date(`${value}T00:00:00`);
  const reference = new Date(referenceDate);
  reference.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.ceil((target.getTime() - reference.getTime()) / 86_400_000);
}

function isValidTimestamp(value: string | undefined) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function createUndoToken<T>(
  itemId: string,
  storageKey: string,
  previousValue: T[]
): HandleCompletionUndoToken {
  return {
    itemId,
    storageKey,
    previousValue,
  };
}

function failure(reason?: string): HandleCompletionResult {
  return {
    ok: false,
    reason,
  };
}

function success(undoToken: HandleCompletionUndoToken): HandleCompletionResult {
  return {
    ok: true,
    undoToken,
  };
}

function formatCurrency(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDateMeta(date: string | undefined, language: AppLanguage) {
  const days = getDaysUntilDate(date);

  if (!Number.isFinite(days)) {
    return language === "en" ? "No date" : "ללא תאריך";
  }

  if (days < 0) {
    return language === "en" ? `${Math.abs(days)} days overdue` : `באיחור ${Math.abs(days)} ימים`;
  }

  if (days === 0) {
    return language === "en" ? "Today" : "היום";
  }

  if (days === 1) {
    return language === "en" ? "Tomorrow" : "מחר";
  }

  return language === "en" ? `In ${days} days` : `בעוד ${days} ימים`;
}

function getUrgency(date: string | undefined, fallback: HandleUrgency = "open") {
  const days = getDaysUntilDate(date);

  if (!Number.isFinite(days)) {
    return fallback;
  }

  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 14) return "soon";
  return fallback;
}

function scoreUrgency(urgency: HandleUrgency) {
  const scores: Record<HandleUrgency, number> = {
    overdue: 500,
    today: 420,
    review: 360,
    soon: 260,
    open: 120,
  };

  return scores[urgency];
}

function createItem(input: Omit<HandleQueueItem, "score">): HandleQueueItem {
  const days = getDaysUntilDate(input.dueDate);
  const dateBoost = Number.isFinite(days) ? Math.max(0, 40 - days) : 0;

  return {
    ...input,
    score: scoreUrgency(input.urgency) + dateBoost,
  };
}

function collectTaskItems(language: AppLanguage): HandleQueueItem[] {
  return readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks)
    .filter((task) => task.status === "open")
    .map((task) =>
      createItem({
        id: `task:${task.id}`,
        domain: "tasks",
        title: task.title,
        description: task.description,
        reason: getDateMeta(task.dueDate, language),
        meta: `${task.owner} · ${getDateMeta(task.dueDate, language)}`,
        href: "/tasks",
        icon: "check",
        urgency: getUrgency(task.dueDate),
        actionLabel: language === "en" ? "Open task" : "פתח משימה",
        completeLabel: language === "en" ? "Mark done" : "סמן כבוצע",
        canComplete: true,
        dueDate: task.dueDate,
        owner: task.owner,
      })
    );
}

function collectFinanceItems(language: AppLanguage): HandleQueueItem[] {
  return readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  )
    .filter((transaction) => transaction.status === "pending")
    .map((transaction) => {
      const urgency = getUrgency(transaction.reminderDate ?? transaction.date);

      return createItem({
        id: `finance:${transaction.id}`,
        domain: "finance",
        title: transaction.title,
        description:
          language === "en"
            ? `${formatCurrency(transaction.amount, language)} still needs closing.`
            : `${formatCurrency(transaction.amount, language)} עדיין מחכה לסגירה.`,
        reason:
          language === "en"
            ? "Pending payment"
            : "תשלום ממתין",
        meta: `${transaction.category} · ${getDateMeta(
          transaction.reminderDate ?? transaction.date,
          language
        )}`,
        href: "/finance",
        icon: "finance",
        urgency,
        actionLabel: language === "en" ? "Open payment" : "פתח כספים",
        completeLabel: language === "en" ? "Mark paid" : "סמן כשולם",
        canComplete: true,
        dueDate: transaction.reminderDate ?? transaction.date,
      });
    });
}

function collectShoppingItems(language: AppLanguage): HandleQueueItem[] {
  return readStorageArray<ShoppingItem>(storageKeys.shopping, initialShoppingItems)
    .filter((item) => !item.purchased)
    .map((item) =>
      createItem({
        id: `shopping:${item.id}`,
        domain: "shopping",
        title: item.title,
        description:
          item.notes ||
          (language === "en" ? "Still waiting on the shopping list." : "עדיין מחכה ברשימת הקניות."),
        reason: language === "en" ? "Not purchased yet" : "עוד לא נקנה",
        meta: `${item.listName} · ${item.quantity}`,
        href: "/shopping",
        icon: "shopping",
        urgency: "open",
        actionLabel: language === "en" ? "Open list" : "פתח קניות",
        completeLabel: language === "en" ? "Mark bought" : "סמן כנקנה",
        canComplete: true,
        owner: item.buyer,
      })
    );
}

function collectModuleItems(
  domain: HandleDomain,
  storageKey: (typeof storageKeys)[keyof typeof storageKeys],
  fallback: ModuleRecord[],
  href: HandleQueueItem["href"],
  language: AppLanguage
): HandleQueueItem[] {
  const iconByDomain: Partial<Record<HandleDomain, HandleQueueItem["icon"]>> = {
    documents: "document",
    vehicles: "car",
    health: "health",
    family: "family",
  };

  return readStorageArray<ModuleRecord>(storageKey, fallback)
    .filter((record) => record.status === "open")
    .map((record) =>
      createItem({
        id: `${domain}:${record.id}`,
        domain,
        title: record.title,
        description: record.description,
        reason: getDateMeta(record.date, language),
        meta: `${record.category} · ${getDateMeta(record.date, language)}`,
        href,
        icon: iconByDomain[domain] ?? "document",
        urgency: getUrgency(record.date),
        actionLabel: language === "en" ? "Open workspace" : "פתח אזור",
        completeLabel: language === "en" ? "Mark handled" : "סמן כטופל",
        canComplete: true,
        dueDate: record.date,
        owner: record.owner,
      })
    );
}

function collectLifeItems(language: AppLanguage): HandleQueueItem[] {
  return readStorageArray<LifeEvent>(storageKeys.lifeEvents, [])
    .filter((event) => event.status === "active" || event.status === "planning")
    .flatMap((event) =>
      event.milestones
        .filter((milestone) => milestone.status === "current" || milestone.status === "upcoming")
        .slice(0, 2)
        .map((milestone) =>
          createItem({
            id: `life:${event.id}:${milestone.id}`,
            domain: "life",
            title: milestone.title,
            description: milestone.description || event.subtitle,
            reason: getDateMeta(milestone.date ?? event.targetDate, language),
            meta: `${event.title} · ${getDateMeta(milestone.date ?? event.targetDate, language)}`,
            href: "/life",
            icon: "timeline",
            urgency: getUrgency(milestone.date ?? event.targetDate, "open"),
            actionLabel: language === "en" ? "Open story" : "פתח סיפור",
            dueDate: milestone.date ?? event.targetDate,
            owner: event.owner,
          })
        )
    );
}

function collectInboxItems(language: AppLanguage): HandleQueueItem[] {
  return readStorageArray<UniversalInboxItem>(storageKeys.universalInbox, [])
    .filter((item) => item.status === "new" || item.status === "reviewed")
    .map((item) =>
      createItem({
        id: `inbox:${item.id}`,
        domain: "inbox",
        title: item.title,
        description:
          item.summary ||
          (language === "en"
            ? "A captured item is waiting for review."
            : "פריט שנקלט מחכה לבדיקה."),
        reason: language === "en" ? "Needs review" : "מחכה לאישור",
        meta: language === "en" ? "Waiting for review" : "מחכה לאישור",
        href: "/",
        icon: "spark",
        urgency: "review",
        actionLabel: language === "en" ? "Review" : "בדוק",
        eventName: "nestly-open-universal-inbox",
        eventDetail: { source: item.source, mode: item.files.length > 0 ? "files" : "text" },
        dueDate: item.updatedAt.slice(0, 10),
      })
    );
}

function getSummary(items: HandleQueueItem[]) {
  const domains = new Map<HandleDomain, number>();

  items.forEach((item) => {
    domains.set(item.domain, (domains.get(item.domain) ?? 0) + 1);
  });

  return {
    total: items.length,
    overdue: items.filter((item) => item.urgency === "overdue").length,
    today: items.filter((item) => item.urgency === "today").length,
    review: items.filter((item) => item.urgency === "review").length,
    domains: Array.from(domains.entries()).map(([domain, count]) => ({
      domain,
      count,
    })),
  };
}

function createCompletedItem(
  input: Omit<HandleCompletedItem, "meta"> & { meta?: string },
  language: AppLanguage
): HandleCompletedItem {
  return {
    ...input,
    meta: input.meta ?? (language === "en" ? "Handled" : "טופל"),
  };
}

function collectCompletedItems(language: AppLanguage): HandleCompletedItem[] {
  const tasks = readStorageArray<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  )
    .filter((task) => task.status === "done" && isValidTimestamp(task.completedAt))
    .map((task) =>
      createCompletedItem(
        {
          id: `task:${task.id}`,
          domain: "tasks",
          title: task.title,
          href: "/tasks",
          icon: "check",
          meta: task.owner,
          completedAt: task.completedAt ?? "",
        },
        language
      )
    );

  const shopping = readStorageArray<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  )
    .filter((item) => item.purchased && isValidTimestamp(item.purchasedAt))
    .map((item) =>
      createCompletedItem(
        {
          id: `shopping:${item.id}`,
          domain: "shopping",
          title: item.title,
          href: "/shopping",
          icon: "shopping",
          meta: item.listName,
          completedAt: item.purchasedAt ?? "",
        },
        language
      )
    );

  const finance = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  )
    .filter(
      (transaction) =>
        transaction.status === "done" && isValidTimestamp(transaction.completedAt)
    )
    .map((transaction) =>
      createCompletedItem(
        {
          id: `finance:${transaction.id}`,
          domain: "finance",
          title: transaction.title,
          href: "/finance",
          icon: "finance",
          meta: formatCurrency(transaction.amount, language),
          completedAt: transaction.completedAt ?? "",
        },
        language
      )
    );

  const moduleItems = [
    ...readStorageArray<ModuleRecord>(storageKeys.documents, initialDocumentRecords).map(
      (record) => ({ record, domain: "documents" as const, href: "/documents" as const, icon: "document" as const })
    ),
    ...readStorageArray<ModuleRecord>(storageKeys.vehicles, initialVehicleRecords).map(
      (record) => ({ record, domain: "vehicles" as const, href: "/vehicles" as const, icon: "car" as const })
    ),
    ...readStorageArray<ModuleRecord>(storageKeys.health, initialHealthRecords).map(
      (record) => ({ record, domain: "health" as const, href: "/health" as const, icon: "health" as const })
    ),
    ...readStorageArray<ModuleRecord>(storageKeys.family, initialFamilyRecords).map(
      (record) => ({ record, domain: "family" as const, href: "/family" as const, icon: "family" as const })
    ),
  ]
    .filter(
      (item) =>
        item.record.status === "done" && isValidTimestamp(item.record.completedAt)
    )
    .map((item) =>
      createCompletedItem(
        {
          id: `${item.domain}:${item.record.id}`,
          domain: item.domain,
          title: item.record.title,
          href: item.href,
          icon: item.icon,
          meta: item.record.category,
          completedAt: item.record.completedAt ?? "",
        },
        language
      )
    );

  return [...tasks, ...shopping, ...finance, ...moduleItems]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    .slice(0, 5);
}

export function completeHandleQueueItem(itemId: string): HandleCompletionResult {
  const [domain, id] = itemId.split(":");

  if (!domain || !id) {
    return failure("Invalid item id");
  }

  const completedAt = nowIso();

  if (domain === "task") {
    const tasks = readStorageArray<FamilyTask>(
      storageKeys.tasks,
      initialFamilyTasks
    );

    if (!tasks.some((task) => task.id === id)) {
      return failure("Task not found");
    }

    const nextTasks = tasks.map((task) =>
      task.id === id ? { ...task, status: "done" as const, completedAt } : task
    );

    return writeStorage(storageKeys.tasks, nextTasks)
      ? success(createUndoToken(itemId, storageKeys.tasks, tasks))
      : failure("Could not write tasks");
  }

  if (domain === "finance") {
    const transactions = readStorageArray<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions
    );

    if (!transactions.some((transaction) => transaction.id === id)) {
      return failure("Finance item not found");
    }

    const nextTransactions = transactions.map((transaction) =>
      transaction.id === id
        ? { ...transaction, status: "done" as const, completedAt }
        : transaction
    );

    return writeStorage(storageKeys.finance, nextTransactions)
      ? success(createUndoToken(itemId, storageKeys.finance, transactions))
      : failure("Could not write finance");
  }

  if (domain === "shopping") {
    const items = readStorageArray<ShoppingItem>(
      storageKeys.shopping,
      initialShoppingItems
    );

    if (!items.some((item) => item.id === id)) {
      return failure("Shopping item not found");
    }

    const nextItems = items.map((item) =>
      item.id === id ? { ...item, purchased: true, purchasedAt: completedAt } : item
    );

    return writeStorage(storageKeys.shopping, nextItems)
      ? success(createUndoToken(itemId, storageKeys.shopping, items))
      : failure("Could not write shopping");
  }

  const moduleConfig: Partial<
    Record<
      HandleDomain,
      {
        key: (typeof storageKeys)[keyof typeof storageKeys];
        fallback: ModuleRecord[];
      }
    >
  > = {
    documents: { key: storageKeys.documents, fallback: initialDocumentRecords },
    vehicles: { key: storageKeys.vehicles, fallback: initialVehicleRecords },
    health: { key: storageKeys.health, fallback: initialHealthRecords },
    family: { key: storageKeys.family, fallback: initialFamilyRecords },
  };

  const config = moduleConfig[domain as HandleDomain];

  if (!config) {
    return failure("Unsupported domain");
  }

  const records = readStorageArray<ModuleRecord>(config.key, config.fallback);

  if (!records.some((record) => record.id === id)) {
    return failure("Workspace item not found");
  }

  const nextRecords = records.map((record) =>
    record.id === id ? { ...record, status: "done" as const, completedAt } : record
  );

  return writeStorage(config.key, nextRecords)
    ? success(createUndoToken(itemId, config.key, records))
    : failure("Could not write workspace");
}

export function undoHandleQueueCompletion(token: HandleCompletionUndoToken) {
  return writeStorage(token.storageKey, token.previousValue);
}

function collectSafely<T>(
  label: string,
  collect: () => T[]
): CollectResult<T> {
  try {
    return {
      items: collect(),
      warnings: [],
    };
  } catch {
    return {
      items: [],
      warnings: [label],
    };
  }
}

function mergeCollectResults<T>(results: Array<CollectResult<T>>): CollectResult<T> {
  return {
    items: results.flatMap((result) => result.items),
    warnings: results.flatMap((result) => result.warnings),
  };
}

export function getHandleQueueState(
  language: AppLanguage = "he"
): HandleQueueState {
  const queueResult = mergeCollectResults([
    collectSafely("tasks", () => collectTaskItems(language)),
    collectSafely("finance", () => collectFinanceItems(language)),
    collectSafely("shopping", () => collectShoppingItems(language)),
    collectSafely("documents", () =>
      collectModuleItems(
        "documents",
        storageKeys.documents,
        initialDocumentRecords,
        "/documents",
        language
      )
    ),
    collectSafely("vehicles", () =>
      collectModuleItems(
        "vehicles",
        storageKeys.vehicles,
        initialVehicleRecords,
        "/vehicles",
        language
      )
    ),
    collectSafely("health", () =>
      collectModuleItems(
        "health",
        storageKeys.health,
        initialHealthRecords,
        "/health",
        language
      )
    ),
    collectSafely("family", () =>
      collectModuleItems(
        "family",
        storageKeys.family,
        initialFamilyRecords,
        "/family",
        language
      )
    ),
    collectSafely("life", () => collectLifeItems(language)),
    collectSafely("inbox", () => collectInboxItems(language)),
  ]);
  const completedResult = collectSafely("recently handled", () =>
    collectCompletedItems(language)
  );
  const items = queueResult.items.sort((a, b) => b.score - a.score);

  return {
    generatedAt: new Date().toISOString(),
    items,
    completedItems: completedResult.items,
    summary: getSummary(items),
    warnings: [...queueResult.warnings, ...completedResult.warnings],
  };
}
