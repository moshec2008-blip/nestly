import { initialFinanceTransactions } from "@/data/finance";
import { initialBirthdays } from "@/data/birthdays";
import {
  initialDocumentRecords,
  initialFamilyRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import {
  matchesSearchQuery,
  scoreSearchMatch,
} from "@/lib/search/searchNormalization";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray, writeStorage } from "@/utils/storage";
import { readKnowledgeItems } from "@/services/familyKnowledge";
import { getActiveLifeEvents } from "@/services/lifeEventsService";
import { readUniversalInboxItems } from "@/services/universalInboxService";
import type { FinanceTransaction } from "@/data/finance";
import type { FamilyTask } from "@/data/tasks";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import type {
  MemoryDomain,
  MemoryGroup,
  MemoryItem,
  MemoryRecentItem,
  MemoryState,
} from "@/types/memory";

const recentViewsKey = "nestly-memory-recent-views";
const maxRecentViews = 12;

const domainOrder: MemoryDomain[] = [
  "knowledge",
  "documents",
  "finance",
  "family",
  "health",
  "vehicles",
  "tasks",
  "shopping",
  "life",
  "birthdays",
  "inbox",
];

type CollectResult = {
  items: MemoryItem[];
  warnings: string[];
};

function getDomainCopy(language: AppLanguage) {
  const he = language !== "en";

  return {
    knowledge: {
      label: he ? "מידע משפחתי" : "Family knowledge",
      description: he ? "דברים שנשמרו כדי לזכור" : "Things saved to remember",
    },
    documents: {
      label: he ? "מסמכים" : "Documents",
      description: he ? "פוליסות, אישורים וקבצים חשובים" : "Policies, forms and important files",
    },
    finance: {
      label: he ? "כספים" : "Money",
      description: he ? "תשלומים, קבלות ותנועות" : "Payments, receipts and transactions",
    },
    family: {
      label: he ? "משפחה" : "Family",
      description: he ? "אנשי קשר, תפקידים ופרטים משפחתיים" : "Contacts, roles and family details",
    },
    health: {
      label: he ? "בריאות" : "Health",
      description: he ? "תורים, תרופות ומעקב" : "Care, medication and appointments",
    },
    vehicles: {
      label: he ? "רכבים" : "Vehicles",
      description: he ? "טסטים, טיפולים ורישוי" : "Service, licensing and reminders",
    },
    tasks: {
      label: he ? "משימות" : "Tasks",
      description: he ? "פעולות והחלטות פתוחות או סגורות" : "Open and completed actions",
    },
    shopping: {
      label: he ? "קניות" : "Shopping",
      description: he ? "רשימות, פריטים והעדפות קנייה" : "Lists, items and shopping preferences",
    },
    life: {
      label: he ? "סיפורי חיים" : "Life stories",
      description: he ? "אירועים ותהליכים גדולים" : "Events and bigger family arcs",
    },
    birthdays: {
      label: he ? "ימי הולדת ואירועים" : "Birthdays and events",
      description: he
        ? "תאריכים, תזכורות, מתנות ותכנונים משפחתיים"
        : "Dates, reminders, gifts and family plans",
    },
    inbox: {
      label: "Inbox",
      description: he ? "דברים שנקלטו ועדיין חיים בצינור" : "Captured things still in the pipeline",
    },
  } satisfies Record<MemoryDomain, { label: string; description: string }>;
}

function getLocale(language: AppLanguage) {
  return language === "en" ? "en-US" : "he-IL";
}

function formatCurrency(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusLabel(status: string | boolean | undefined, language: AppLanguage) {
  if (typeof status === "boolean") {
    return status
      ? language === "en" ? "Done" : "בוצע"
      : language === "en" ? "Open" : "פתוח";
  }

  if (status === "done" || status === "saved" || status === "archived") {
    return language === "en" ? "Saved" : "שמור";
  }

  if (status === "pending" || status === "open" || status === "new" || status === "reviewed") {
    return language === "en" ? "Open" : "פתוח";
  }

  return status;
}

function makeItem(input: MemoryItem): MemoryItem {
  return {
    ...input,
    keywords: Array.from(
      new Set(
        [
          input.title,
          input.description,
          input.meta,
          input.status ?? "",
          input.sourceLabel,
          ...input.keywords,
        ].filter(Boolean)
      )
    ),
  };
}

function moduleItem(
  record: ModuleRecord,
  domain: Extract<MemoryDomain, "documents" | "family" | "health" | "vehicles">,
  href: MemoryItem["href"],
  language: AppLanguage
): MemoryItem {
  const domainCopy = getDomainCopy(language)[domain];
  const iconByDomain = {
    documents: "document",
    family: "family",
    health: "health",
    vehicles: "car",
  } as const;

  return makeItem({
    id: `${domain}:${record.id}`,
    domain,
    title: record.title,
    description: record.description,
    meta: `${record.category} · ${record.owner}`,
    href,
    icon: iconByDomain[domain],
    status: getStatusLabel(record.status, language),
    date: record.date,
    updatedAt: record.date,
    savedAt: record.date,
    sourceLabel: domainCopy.label,
    keywords: [record.category, record.owner, record.date],
  });
}

function collectSafely(label: string, collect: () => MemoryItem[]): CollectResult {
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

function sortMemoryItems(items: MemoryItem[]) {
  return [...items].sort((first, second) =>
    (second.updatedAt ?? second.savedAt ?? "").localeCompare(
      first.updatedAt ?? first.savedAt ?? ""
    )
  );
}

function collectMemory(language: AppLanguage): CollectResult {
  const copy = getDomainCopy(language);
  const tasks = () => readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks);
  const finance = () => readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const shopping = () => readStorageArray<ShoppingItem>(storageKeys.shopping, initialShoppingItems);
  const documents = () => readStorageArray<ModuleRecord>(storageKeys.documents, initialDocumentRecords);
  const family = () => readStorageArray<ModuleRecord>(storageKeys.family, initialFamilyRecords);
  const health = () => readStorageArray<ModuleRecord>(storageKeys.health, initialHealthRecords);
  const vehicles = () => readStorageArray<ModuleRecord>(storageKeys.vehicles, initialVehicleRecords);
  const knowledge = () => readKnowledgeItems({ includeArchived: false });
  const lifeEvents = () => getActiveLifeEvents();
  const inbox = () => readUniversalInboxItems().filter((item) => item.status !== "cancelled");
  const birthdays = () => readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );

  const results = [
    collectSafely(copy.knowledge.label, () => knowledge().map((item) =>
      makeItem({
        id: `knowledge:${item.id}`,
        domain: "knowledge",
        title: item.title,
        description: item.content,
        meta: [item.category, ...item.tags.slice(0, 2)].filter(Boolean).join(" · "),
        href: "/knowledge",
        icon: "knowledge",
        status: item.favorite
          ? language === "en" ? "Favorite" : "מועדף"
          : language === "en" ? "Saved" : "שמור",
        updatedAt: item.updatedAt,
        savedAt: item.createdAt,
        sourceLabel: copy.knowledge.label,
        keywords: [item.category, item.linkedModule ?? "", ...item.tags, ...item.searchKeywords],
      })
    )),
    collectSafely(copy.documents.label, () =>
      documents().map((record) => moduleItem(record, "documents", "/documents", language))
    ),
    collectSafely(copy.finance.label, () => finance().map((transaction) =>
      makeItem({
        id: `finance:${transaction.id}`,
        domain: "finance",
        title: transaction.title,
        description:
          transaction.notes ||
          `${formatCurrency(transaction.amount, language)} · ${transaction.category}`,
        meta: `${transaction.category} · ${formatCurrency(transaction.amount, language)}`,
        href: "/finance",
        icon: "finance",
        status: getStatusLabel(transaction.status, language),
        date: transaction.reminderDate ?? transaction.date,
        updatedAt: transaction.completedAt ?? transaction.reminderDate ?? transaction.date,
        savedAt: transaction.date,
        sourceLabel: copy.finance.label,
        keywords: [
          transaction.category,
          transaction.date,
          transaction.reminderDate ?? "",
          transaction.completedAt ?? "",
          String(transaction.amount),
          transaction.notes ?? "",
        ],
      })
    )),
    collectSafely(copy.family.label, () =>
      family().map((record) => moduleItem(record, "family", "/family", language))
    ),
    collectSafely(copy.health.label, () =>
      health().map((record) => moduleItem(record, "health", "/health", language))
    ),
    collectSafely(copy.vehicles.label, () =>
      vehicles().map((record) => moduleItem(record, "vehicles", "/vehicles", language))
    ),
    collectSafely(copy.tasks.label, () => tasks().map((task) =>
      makeItem({
        id: `tasks:${task.id}`,
        domain: "tasks",
        title: task.title,
        description: task.description,
        meta: `${task.category} · ${task.owner}`,
        href: "/tasks",
        icon: "check",
        status: getStatusLabel(task.status, language),
        date: task.dueDate,
        updatedAt: task.completedAt ?? task.dueDate,
        savedAt: task.dueDate,
        sourceLabel: copy.tasks.label,
        keywords: [task.category, task.owner, task.priority, task.dueDate, task.completedAt ?? ""],
      })
    )),
    collectSafely(copy.shopping.label, () => shopping().map((item) =>
      makeItem({
        id: `shopping:${item.id}`,
        domain: "shopping",
        title: item.title,
        description: item.notes || `${item.quantity} · ${item.department}`,
        meta: `${item.listName} · ${item.buyer}`,
        href: "/shopping",
        icon: "shopping",
        status: getStatusLabel(item.purchased, language),
        updatedAt: item.purchasedAt,
        savedAt: item.purchasedAt,
        sourceLabel: copy.shopping.label,
        keywords: [
          item.listName,
          item.department,
          item.buyer,
          item.quantity,
          item.notes,
          String(item.estimatedPrice),
          item.purchasedAt ?? "",
        ],
      })
    )),
    collectSafely(copy.life.label, () => lifeEvents().map((event) =>
      makeItem({
        id: `life:${event.id}`,
        domain: "life",
        title: event.title,
        description: event.subtitle || event.story,
        meta: [event.owner, event.location].filter(Boolean).join(" · "),
        href: "/life",
        icon: "timeline",
        status: `${event.progress}%`,
        date: event.targetDate,
        updatedAt: event.targetDate,
        savedAt: event.startDate,
        sourceLabel: copy.life.label,
        keywords: [
          event.type,
          event.owner,
          event.location ?? "",
          event.story,
          ...event.tags,
          ...event.milestones.map((milestone) => milestone.title),
        ],
      })
    )),
    collectSafely(copy.birthdays.label, () => birthdays().map((event) =>
      makeItem({
        id: `birthdays:${event.id}`,
        domain: "birthdays",
        title: event.title || event.name,
        description: event.notes || event.relationship,
        meta: [event.relationship, event.hebrewDate || event.gregorianDate]
          .filter(Boolean)
          .join(" · "),
        href: "/birthdays",
        icon: "calendar",
        status:
          event.eventType === "anniversary"
            ? language === "en" ? "Anniversary" : "יום שנה"
            : language === "en" ? "Birthday" : "יום הולדת",
        date: event.gregorianDate,
        updatedAt: event.gregorianDate,
        savedAt: event.gregorianDate,
        sourceLabel: copy.birthdays.label,
        keywords: [
          event.name,
          event.person ?? "",
          event.relationship,
          event.eventType ?? "birthday",
          event.gregorianDate,
          event.hebrewDate,
          event.notes,
          event.giftPlan?.ideas ?? "",
          event.giftPlan?.budget ?? "",
        ],
      })
    )),
    collectSafely(copy.inbox.label, () => inbox().map((item) =>
      makeItem({
        id: `inbox:${item.id}`,
        domain: "inbox",
        title: item.title,
        description: item.summary || item.normalizedText,
        meta: `${item.source} · ${item.actions.length}`,
        href: "/",
        icon: "spark",
        status: getStatusLabel(item.status, language),
        updatedAt: item.updatedAt,
        savedAt: item.createdAt,
        sourceLabel: copy.inbox.label,
        keywords: [
          item.rawText,
          item.normalizedText,
          item.source,
          ...item.classifications.map((classification) => classification.type),
          ...item.entities.map((entity) => entity.label),
          ...item.actions.map((action) => action.title),
        ],
      })
    )),
  ];

  return {
    items: sortMemoryItems(results.flatMap((result) => result.items)),
    warnings: results.flatMap((result) => result.warnings),
  };
}

function readRecentViews(): MemoryRecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsedValue = JSON.parse(
      window.localStorage.getItem(recentViewsKey) ?? "[]"
    );

    return Array.isArray(parsedValue)
      ? parsedValue.filter(
          (item): item is MemoryRecentItem =>
            typeof item?.id === "string" && typeof item?.viewedAt === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function writeRecentViews(items: MemoryRecentItem[]) {
  writeStorage(recentViewsKey, items.slice(0, maxRecentViews));
}

function filterItems(items: MemoryItem[], query: string) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return items;
  }

  return items
    .filter((item) => matchesSearchQuery(cleanQuery, item.keywords))
    .map((item) => ({
      ...item,
      matchScore: scoreSearchMatch(
        cleanQuery,
        item.title,
        item.keywords.join(" ")
      ),
    }))
    .sort((first, second) => {
      const scoreDifference = (second.matchScore ?? 0) - (first.matchScore ?? 0);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return (second.updatedAt ?? second.savedAt ?? "").localeCompare(
        first.updatedAt ?? first.savedAt ?? ""
      );
    });
}

function getRecentlyViewed(items: MemoryItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]));

  return readRecentViews()
    .map((recent) => byId.get(recent.id))
    .filter((item): item is MemoryItem => Boolean(item))
    .slice(0, 6);
}

function getRecentlySaved(items: MemoryItem[]) {
  return [...items]
    .filter((item) => item.savedAt || item.updatedAt || item.date)
    .sort((first, second) =>
      (second.savedAt ?? second.updatedAt ?? second.date ?? "").localeCompare(
        first.savedAt ?? first.updatedAt ?? first.date ?? ""
      )
    )
    .slice(0, 6);
}

function getRecentlyUpdated(items: MemoryItem[]) {
  return [...items]
    .filter((item) => item.updatedAt)
    .sort((first, second) =>
      (second.updatedAt ?? "").localeCompare(first.updatedAt ?? "")
    )
    .slice(0, 6);
}

function getGroups(items: MemoryItem[], language: AppLanguage): MemoryGroup[] {
  const copy = getDomainCopy(language);

  return domainOrder
    .map((domain) => ({
      domain,
      label: copy[domain].label,
      description: copy[domain].description,
      items: items.filter((item) => item.domain === domain).slice(0, 5),
    }))
    .filter((group) => group.items.length > 0);
}

export function getMemoryState(
  query = "",
  language: AppLanguage = "he"
): MemoryState {
  const memory = collectMemory(language);
  const items = filterItems(memory.items, query);

  return {
    query,
    total: items.length,
    items,
    groups: getGroups(items, language),
    recentlyViewed: getRecentlyViewed(memory.items),
    recentlySaved: getRecentlySaved(memory.items),
    recentlyUpdated: getRecentlyUpdated(memory.items),
    warnings: memory.warnings,
  };
}

export function markMemoryItemViewed(itemId: string) {
  if (!itemId) {
    return;
  }

  writeRecentViews([
    { id: itemId, viewedAt: new Date().toISOString() },
    ...readRecentViews().filter((item) => item.id !== itemId),
  ]);
}
