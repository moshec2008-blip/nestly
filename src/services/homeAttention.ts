import { initialBirthdays } from "@/data/birthdays";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import { initialDocumentRecords, initialVehicleRecords } from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks } from "@/data/tasks";
import type { AppIconName } from "@/components/ui/AppIcon";
import { isDemoModeActive } from "@/lib/demoMode";
import { storageKeys } from "@/lib/storageKeys";
import { getActiveLifeEvents } from "@/services/lifeEventsService";
import { toSmartDocumentView } from "@/services/smartDocuments";
import { readUniversalInboxItems } from "@/services/universalInboxService";
import type { AppLanguage } from "@/i18n/config";
import type { FinanceTransaction } from "@/data/finance";
import type { FamilyTask } from "@/data/tasks";
import type { ModuleRecord } from "@/types/modules";
import type {
  AttentionDomain,
  AttentionItem,
  AttentionReason,
  AttentionSeverity,
  HomeAttentionPreference,
  HomeAttentionState,
  HomeQuickAction,
} from "@/types/homeAttention";
import type { AppRoute } from "@/types/navigation";
import {
  getDaysUntilFamilyEvent,
  normalizeFamilyEvent,
} from "@/utils/birthdayCalendar";
import { readStorage, readStorageArray, writeStorage } from "@/utils/storage";

const defaultPreference: HomeAttentionPreference = {
  dismissed: {},
  snoozedUntil: {},
  priorityOverrides: {},
};

export const homeAttentionChangedEventName = "nestly-home-attention-change";

function nowIso() {
  return new Date().toISOString();
}

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getDaysUntilDate(date: string, referenceDate = new Date()) {
  const target = startOfDay(new Date(date));
  const today = startOfDay(referenceDate);

  if (Number.isNaN(target.getTime())) {
    return 9999;
  }

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function getGreeting(language: AppLanguage) {
  const hour = new Date().getHours();
  const isEnglish = language === "en";

  if (hour >= 5 && hour < 12) return isEnglish ? "Good morning" : "בוקר טוב";
  if (hour >= 12 && hour < 17) return isEnglish ? "Good afternoon" : "צהריים טובים";
  if (hour >= 17 && hour < 22) return isEnglish ? "Good evening" : "ערב טוב";
  return isEnglish ? "Good night" : "לילה טוב";
}

function formatCurrency(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTodayLabel(language: AppLanguage) {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function severityForDays(days: number): AttentionSeverity {
  if (days < 0) return "critical";
  if (days === 0) return "high";
  if (days <= 3) return "medium";
  return "low";
}

function reasonForDays(days: number, language: AppLanguage) {
  if (language === "en") {
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  }

  if (days < 0) return "באיחור";
  if (days === 0) return "להיום";
  if (days === 1) return "למחר";
  return `בעוד ${days} ימים`;
}

function scoreDueDate(days: number) {
  if (days < 0) return 96 + Math.min(Math.abs(days), 10);
  if (days === 0) return 92;
  if (days === 1) return 82;
  if (days <= 3) return 72;
  if (days <= 7) return 56;
  return 34;
}

function isPreference(value: unknown): value is HomeAttentionPreference {
  if (!value || typeof value !== "object") {
    return false;
  }

  const preference = value as Partial<HomeAttentionPreference>;
  return (
    Boolean(preference.dismissed) &&
    Boolean(preference.snoozedUntil) &&
    Boolean(preference.priorityOverrides)
  );
}

export function readHomeAttentionPreference() {
  return readStorage(
    storageKeys.homeAttentionPreferences,
    defaultPreference,
    isPreference
  );
}

function writeHomeAttentionPreference(preference: HomeAttentionPreference) {
  if (typeof window === "undefined") {
    return;
  }

  writeStorage(storageKeys.homeAttentionPreferences, preference);
  window.dispatchEvent(new CustomEvent(homeAttentionChangedEventName));
}

export function dismissAttentionItem(itemId: string) {
  const preference = readHomeAttentionPreference();
  writeHomeAttentionPreference({
    ...preference,
    dismissed: { ...preference.dismissed, [itemId]: nowIso() },
  });
}

export function snoozeAttentionItem(itemId: string, hours = 24) {
  const preference = readHomeAttentionPreference();
  const date = new Date();
  date.setHours(date.getHours() + hours);

  writeHomeAttentionPreference({
    ...preference,
    snoozedUntil: {
      ...preference.snoozedUntil,
      [itemId]: date.toISOString(),
    },
  });
}

function createAttentionItem(input: {
  id: string;
  domain: AttentionDomain;
  title: string;
  summary: string;
  reason: string;
  reasonCode: AttentionReason;
  href: AppRoute;
  icon: AppIconName;
  severity: AttentionSeverity;
  score: number;
  confidence?: number;
  dueAt?: string;
  relatedLabel?: string;
  actionLabel: string;
  sourceEntityId?: string;
}): AttentionItem {
  return {
    ...input,
    confidence: input.confidence ?? 0.86,
    action: {
      label: input.actionLabel,
      href: input.href,
    },
  };
}

function collectTaskItems(language: AppLanguage): AttentionItem[] {
  const tasks = readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks);

  return tasks
    .filter((task) => task.status === "open")
    .map((task) => {
      const days = getDaysUntilDate(task.dueDate);
      const priorityBoost = task.priority === "high" ? 18 : task.priority === "medium" ? 8 : 0;

      return createAttentionItem({
        id: `task:${task.id}`,
        domain: "tasks",
        title: task.title,
        summary:
          language === "en"
            ? "An open task needs a decision or completion."
            : "משימה פתוחה שמחכה להחלטה או סגירה.",
        reason: `${reasonForDays(days, language)} · ${task.owner}`,
        reasonCode: days < 0 ? "overdue" : days === 0 ? "due_today" : "due_soon",
        href: "/tasks",
        icon: "check",
        severity: severityForDays(days),
        score: scoreDueDate(days) + priorityBoost,
        dueAt: task.dueDate,
        relatedLabel: task.category,
        actionLabel: language === "en" ? "Open task" : "פתח משימה",
        sourceEntityId: task.id,
      });
    });
}

function collectFinanceItems(language: AppLanguage): AttentionItem[] {
  const transactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );

  return transactions
    .filter((transaction) => transaction.status === "pending")
    .map((transaction) => {
      const days = getDaysUntilDate(transaction.reminderDate || transaction.date);
      const amountScore = Math.min(Math.round(transaction.amount / 100), 24);
      const amount = formatCurrency(transaction.amount, language);

      return createAttentionItem({
        id: `finance:${transaction.id}`,
        domain: "finance",
        title: transaction.title,
        summary:
          language === "en"
            ? `${amount} is still pending.`
            : `${amount} עדיין ממתין לטיפול.`,
        reason: `${reasonForDays(days, language)} · ${language === "en" ? "Financial impact" : "השפעה כספית"}`,
        reasonCode: days < 0 ? "overdue" : "financial_impact",
        href: "/finance",
        icon: "finance",
        severity: days < 0 ? "critical" : "high",
        score: scoreDueDate(days) + amountScore,
        dueAt: transaction.reminderDate || transaction.date,
        relatedLabel: transaction.category,
        actionLabel: language === "en" ? "Review payment" : "בדוק תשלום",
        sourceEntityId: transaction.id,
      });
    });
}

function collectDocumentItems(language: AppLanguage): AttentionItem[] {
  const documents = readStorageArray<ModuleRecord>(
    storageKeys.documents,
    initialDocumentRecords
  );

  return documents
    .map(toSmartDocumentView)
    .filter((view) => view.needsReview || view.isExpiringSoon)
    .map((view) => {
      const days = view.daysUntilExpiry ?? 14;
      const needsReview = view.needsReview;

      return createAttentionItem({
        id: `document:${view.item.id}`,
        domain: "documents",
        title: view.item.title,
        summary: needsReview
          ? language === "en"
            ? "A document is waiting for review."
            : "מסמך מחכה לבדיקה כדי שלא יישכח."
          : language === "en"
            ? "This document may expire soon."
            : "המסמך הזה עלול לפוג בקרוב.",
        reason: needsReview
          ? language === "en" ? "Waiting for confirmation" : "ממתין לאישור"
          : reasonForDays(days, language),
        reasonCode: needsReview ? "needs_review" : "due_soon",
        href: "/documents",
        icon: "document",
        severity: needsReview ? "high" : severityForDays(days),
        score: needsReview ? 84 : scoreDueDate(days),
        dueAt: view.item.expiryDate,
        relatedLabel: view.typeLabel,
        actionLabel: language === "en" ? "Open document" : "פתח מסמך",
        sourceEntityId: view.item.id,
      });
    });
}

function collectVehicleItems(language: AppLanguage): AttentionItem[] {
  const records = readStorageArray<ModuleRecord>(
    storageKeys.vehicles,
    initialVehicleRecords
  );

  return records
    .filter((record) => record.status === "open")
    .map((record) => {
      const days = getDaysUntilDate(record.date);
      return createAttentionItem({
        id: `vehicle:${record.id}`,
        domain: "vehicles",
        title: record.title,
        summary:
          language === "en"
            ? "A vehicle reminder is open."
            : "תזכורת רכב פתוחה ומחכה לטיפול.",
        reason: reasonForDays(days, language),
        reasonCode: days <= 0 ? "due_today" : "due_soon",
        href: "/vehicles",
        icon: "car",
        severity: severityForDays(days),
        score: scoreDueDate(days) - 6,
        dueAt: record.date,
        relatedLabel: record.category,
        actionLabel: language === "en" ? "Open vehicle" : "פתח רכבים",
        sourceEntityId: record.id,
      });
    });
}

function collectFamilyItems(language: AppLanguage): AttentionItem[] {
  return readStorageArray(storageKeys.birthdays, initialBirthdays)
    .map(normalizeFamilyEvent)
    .map((event) => ({ event, days: getDaysUntilFamilyEvent(event) }))
    .filter(({ days }) => days <= 7)
    .map(({ event, days }) =>
      createAttentionItem({
        id: `family:${event.id}`,
        domain: "family",
        title: event.title || event.name,
        summary:
          language === "en"
            ? "A family date is coming up."
            : "תאריך משפחתי מתקרב וכדאי לשים לב.",
        reason: reasonForDays(days, language),
        reasonCode: days === 0 ? "due_today" : "due_soon",
        href: "/birthdays",
        icon: "calendar",
        severity: days === 0 ? "high" : "medium",
        score: scoreDueDate(days) - 4,
        dueAt: event.gregorianDate,
        relatedLabel: event.relationship,
        actionLabel: language === "en" ? "Open event" : "פתח אירוע",
        sourceEntityId: event.id,
      })
    );
}

function collectLifeEventItems(language: AppLanguage): AttentionItem[] {
  return getActiveLifeEvents()
    .filter((event) => event.status === "active" || event.status === "planning")
    .map((event) => {
      const currentMilestone =
        event.milestones.find((milestone) => milestone.status === "current") ??
        event.milestones.find((milestone) => milestone.status === "upcoming");
      const days = currentMilestone?.date ? getDaysUntilDate(currentMilestone.date) : 14;
      const unresolvedCount =
        event.linkedEntities.filter((entity) => entity.confidence < 0.9).length +
        event.aiInsights.filter((insight) => insight.tone === "warning").length;

      return createAttentionItem({
        id: `life:${event.id}`,
        domain: "life",
        title: event.title,
        summary: currentMilestone?.description || event.subtitle,
        reason:
          unresolvedCount > 0
            ? language === "en"
              ? `${unresolvedCount} items need confirmation`
              : `${unresolvedCount} דברים מחכים לאישור`
            : currentMilestone?.title || (language === "en" ? "Active life story" : "סיפור חיים פעיל"),
        reasonCode: "active_life_event",
        href: "/life",
        icon: "timeline",
        severity: unresolvedCount > 0 ? "medium" : "low",
        score: Math.max(42, 72 - Math.max(days, 0) + unresolvedCount * 6),
        dueAt: currentMilestone?.date,
        relatedLabel: `${event.progress}%`,
        actionLabel: language === "en" ? "Continue story" : "המשך סיפור",
        sourceEntityId: event.id,
      });
    });
}

function collectInboxItems(language: AppLanguage): AttentionItem[] {
  return readUniversalInboxItems()
    .filter((item) => item.status === "new" || item.status === "reviewed")
    .map((item) =>
      createAttentionItem({
        id: `inbox:${item.id}`,
        domain: "inbox",
        title: item.title,
        summary:
          language === "en"
            ? `${item.actions.length} suggested actions are waiting.`
            : `${item.actions.length} פעולות מוצעות מחכות לאישור.`,
        reason: language === "en" ? "Waiting for confirmation" : "ממתין לאישור",
        reasonCode: "needs_review",
        href: "/",
        icon: "spark",
        severity: "high",
        score: 88 + Math.min(item.actions.length, 4),
        relatedLabel: "Universal Inbox",
        actionLabel: language === "en" ? "Review" : "סקירה",
        sourceEntityId: item.id,
      })
    );
}

function collectShoppingItem(language: AppLanguage): AttentionItem | null {
  const items = readStorageArray(storageKeys.shopping, initialShoppingItems).filter(
    (item) => !item.purchased
  );

  if (items.length < 5) {
    return null;
  }

  return createAttentionItem({
    id: "shopping:open-list",
    domain: "shopping",
    title:
      language === "en"
        ? `${items.length} shopping items are open`
        : `${items.length} פריטים מחכים בקניות`,
    summary:
      language === "en"
        ? "The next shopping trip can be prepared quickly."
        : "אפשר לסגור את הרשימה לפני היציאה הבאה.",
    reason: language === "en" ? "Unresolved list" : "רשימה פתוחה",
    reasonCode: "unresolved",
    href: "/shopping",
    icon: "shopping",
    severity: "low",
    score: 38 + Math.min(items.length, 12),
    relatedLabel: language === "en" ? "Shopping" : "קניות",
    actionLabel: language === "en" ? "Open list" : "פתח רשימה",
  });
}

function filterByPreference(items: AttentionItem[], preference: HomeAttentionPreference) {
  const now = nowIso();

  return items
    .filter((item) => !preference.dismissed[item.id])
    .filter((item) => {
      const snoozedUntil = preference.snoozedUntil[item.id];
      return !snoozedUntil || snoozedUntil <= now;
    })
    .map((item) => ({
      ...item,
      score: item.score + (preference.priorityOverrides[item.id] ?? 0),
    }))
    .sort((a, b) => b.score - a.score);
}

function buildQuickActions(items: AttentionItem[], language: AppLanguage): HomeQuickAction[] {
  const primary = items[0];
  const actions: HomeQuickAction[] = [
    {
      id: "universal-inbox",
      label: "Universal Inbox",
      description:
        language === "en"
          ? "Save anything, review once"
          : "שמרו כל דבר, אשרו פעם אחת",
      icon: "spark",
      eventName: "nestly-open-universal-inbox",
      eventDetail: { source: "text", mode: "text" },
      priority: 100,
    },
  ];

  if (primary?.href) {
    actions.push({
      id: `continue-${primary.domain}`,
      label: primary.action.label,
      description: primary.reason,
      icon: primary.icon,
      href: primary.href,
      priority: 92,
    });
  }

  actions.push(
    {
      id: "task",
      label: language === "en" ? "Add task" : "משימה",
      description: language === "en" ? "Capture a next step" : "לסגור פעולה קטנה",
      icon: "check",
      href: "/tasks",
      priority: 60,
    },
    {
      id: "expense",
      label: language === "en" ? "Add expense" : "הוצאה",
      description: language === "en" ? "Record something paid" : "לתעד תשלום",
      icon: "finance",
      href: "/finance",
      priority: 48,
    }
  );

  return actions
    .filter(
      (action, index, all) => all.findIndex((candidate) => candidate.id === action.id) === index
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

function buildQuietItem(language: AppLanguage): AttentionItem {
  return createAttentionItem({
    id: "quiet:today",
    domain: "system",
    title: language === "en" ? "Nothing urgent needs attention" : "אין משהו דחוף כרגע",
    summary:
      language === "en"
        ? "Nestly checked the main areas. The day looks calm."
        : "Nestly בדקה את האזורים המרכזיים. היום נראה רגוע.",
    reason: language === "en" ? "Quiet day" : "יום שקט",
    reasonCode: "quiet_day",
    href: "/",
    icon: "home",
    severity: "calm",
    score: 0,
    confidence: 1,
    actionLabel: language === "en" ? "Open Inbox" : "פתח Inbox",
  });
}

export function getHomeAttentionState(
  language: AppLanguage = "he"
): HomeAttentionState {
  if (typeof window === "undefined") {
    const quietItem = buildQuietItem(language);
    return {
      generatedAt: nowIso(),
      greeting: getGreeting(language),
      contextLabel: getTodayLabel(language),
      daySummary: quietItem.summary,
      primaryItem: quietItem,
      todayItems: [],
      lifeEventItems: [],
      quickActions: buildQuickActions([], language),
      quiet: true,
    };
  }

  const preference = readHomeAttentionPreference();
  const shoppingItem = collectShoppingItem(language);
  const rawItems = [
    ...collectInboxItems(language),
    ...collectFinanceItems(language),
    ...collectTaskItems(language),
    ...collectDocumentItems(language),
    ...collectVehicleItems(language),
    ...collectFamilyItems(language),
    ...collectLifeEventItems(language),
    ...(shoppingItem ? [shoppingItem] : []),
  ];
  const rankedItems = filterByPreference(rawItems, preference);
  const primaryItem = rankedItems[0] ?? buildQuietItem(language);
  const lifeEventItems = rankedItems
    .filter((item) => item.domain === "life")
    .slice(0, 2);
  const todayItems = rankedItems
    .filter((item) => item.id !== primaryItem.id && item.domain !== "life")
    .slice(0, 4);
  const balance = getFinanceStats(
    readStorageArray(storageKeys.finance, initialFinanceTransactions)
  ).balance;
  const daySummary =
    rankedItems.length > 0
      ? language === "en"
        ? `${rankedItems.length} things are worth noticing. The top one is ${primaryItem.reason.toLowerCase()}.`
        : `${rankedItems.length} דברים שווים תשומת לב. החשוב ביותר: ${primaryItem.reason}.`
      : language === "en"
        ? `A quiet day. Current balance: ${formatCurrency(balance, language)}.`
        : `יום שקט. היתרה הנוכחית: ${formatCurrency(balance, language)}.`;

  return {
    generatedAt: nowIso(),
    greeting: getGreeting(language),
    contextLabel: `${getTodayLabel(language)}${isDemoModeActive() ? " · Demo" : ""}`,
    daySummary,
    primaryItem,
    todayItems,
    lifeEventItems,
    quickActions: buildQuickActions(rankedItems, language),
    quiet: rankedItems.length === 0,
  };
}
