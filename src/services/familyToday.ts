import { initialBirthdays } from "@/data/birthdays";
import { initialFinanceTransactions } from "@/data/finance";
import { initialDocumentRecords, initialVehicleRecords } from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import type { FinanceTransaction } from "@/data/finance";
import type { FamilyTask } from "@/data/tasks";
import type { FamilyEvent } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import type { AppRoute } from "@/types/navigation";
import {
  getDaysUntilFamilyEvent,
  normalizeFamilyEvent,
} from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

export type FamilyTodayItem = {
  id: string;
  href: AppRoute;
  label: string;
  detail: string;
  tone: "warm" | "blue" | "green" | "slate" | "purple";
  priority: number;
};

export type FamilySuggestion = {
  id: string;
  href: AppRoute;
  text: string;
  action: string;
};

export type FamilyTodaySummary = {
  items: FamilyTodayItem[];
  suggestion: FamilySuggestion | null;
};

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getDaysUntilDate(date: string, referenceDate = new Date()) {
  const targetDate = startOfDay(new Date(date));
  const today = startOfDay(referenceDate);

  if (Number.isNaN(targetDate.getTime())) {
    return 9999;
  }

  return Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getRelativeDayLabel(days: number) {
  if (days === 0) return "היום";
  if (days === 1) return "מחר";
  if (days > 1 && days <= 7) return `בעוד ${days} ימים`;
  if (days > 7 && days <= 31) return "בהמשך החודש";
  if (days > 31 && days <= 62) return "בחודש הבא";
  if (days < 0) return "באיחור";
  return "";
}

function getEventLabel(event: FamilyEvent) {
  const eventType = event.eventType ?? "birthday";
  const name = event.person || event.name || event.title || "אירוע משפחתי";

  if (eventType === "anniversary") return `יום נישואין של ${name}`;
  if (eventType === "memorial") return `יארצייט של ${name}`;
  if (eventType === "custom") return event.title || name;
  return `יום הולדת של ${name}`;
}

function readFamilyData() {
  return {
    events: readStorageArray<FamilyEvent>(
      storageKeys.birthdays,
      initialBirthdays
    ).map(normalizeFamilyEvent),
    tasks: readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks),
    shoppingItems: readStorageArray<ShoppingItem>(
      storageKeys.shopping,
      initialShoppingItems
    ),
    financeTransactions: readStorageArray<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions
    ),
    vehicleRecords: readStorageArray<ModuleRecord>(
      storageKeys.vehicles,
      initialVehicleRecords
    ),
    documentRecords: readStorageArray<ModuleRecord>(
      storageKeys.documents,
      initialDocumentRecords
    ),
  };
}

export function getFamilyTodaySummary(): FamilyTodaySummary {
  if (typeof window === "undefined") {
    return { items: [], suggestion: null };
  }

  const {
    events,
    tasks,
    shoppingItems,
    financeTransactions,
    vehicleRecords,
    documentRecords,
  } = readFamilyData();

  const items: FamilyTodayItem[] = [];
  const nextEvent = [...events].sort(
    (first, second) =>
      getDaysUntilFamilyEvent(first) - getDaysUntilFamilyEvent(second)
  )[0];

  if (nextEvent) {
    const days = getDaysUntilFamilyEvent(nextEvent);
    if (days <= 14) {
      items.push({
        id: `event-${nextEvent.id}`,
        href: "/birthdays",
        label: getEventLabel(nextEvent),
        detail: getRelativeDayLabel(days),
        tone: nextEvent.eventType === "memorial" ? "slate" : "warm",
        priority: days,
      });
    }
  }

  const pendingPayment = financeTransactions
    .filter((transaction) => transaction.status === "pending")
    .sort(
      (first, second) =>
        getDaysUntilDate(first.reminderDate || first.date) -
        getDaysUntilDate(second.reminderDate || second.date)
    )[0];

  if (pendingPayment) {
    const days = getDaysUntilDate(pendingPayment.reminderDate || pendingPayment.date);
    items.push({
      id: `finance-${pendingPayment.id}`,
      href: "/finance",
      label: pendingPayment.title,
      detail: `${getRelativeDayLabel(days) || "תשלום פתוח"} · ${pendingPayment.amount.toLocaleString(
        "he-IL"
      )} ₪`,
      tone: "green",
      priority: Math.max(days, 0) + 4,
    });
  }

  const importantTasks = tasks.filter(
    (task) => task.status === "open" && task.priority === "high"
  );
  if (importantTasks.length > 0) {
    items.push({
      id: "important-tasks",
      href: "/tasks",
      label: `${importantTasks.length} משימות חשובות פתוחות`,
      detail: importantTasks[0].title,
      tone: "purple",
      priority: 6,
    });
  }

  const uncheckedShoppingItems = shoppingItems.filter((item) => !item.purchased);
  if (uncheckedShoppingItems.length > 0) {
    items.push({
      id: "shopping-open",
      href: "/shopping",
      label: `${uncheckedShoppingItems.length} פריטים לקנייה`,
      detail: "הקנייה הבאה מתחילה כאן",
      tone: "blue",
      priority: 9,
    });
  }

  const nextVehicleRecord = vehicleRecords
    .filter((record) => record.status === "open")
    .sort(
      (first, second) =>
        getDaysUntilDate(first.date) - getDaysUntilDate(second.date)
    )[0];

  if (nextVehicleRecord) {
    const days = getDaysUntilDate(nextVehicleRecord.date);
    if (days <= 62) {
      items.push({
        id: `vehicle-${nextVehicleRecord.id}`,
        href: "/vehicles",
        label: nextVehicleRecord.title,
        detail: getRelativeDayLabel(days),
        tone: "slate",
        priority: Math.max(days, 0) + 12,
      });
    }
  }

  const suggestion =
    getMissingEventReminderSuggestion(events) ??
    getUncategorizedExpenseSuggestion(financeTransactions) ??
    getShoppingSuggestion(uncheckedShoppingItems) ??
    getDocumentSuggestion(documentRecords);

  return {
    items: items.sort((first, second) => first.priority - second.priority).slice(0, 4),
    suggestion,
  };
}

function getMissingEventReminderSuggestion(
  events: FamilyEvent[]
): FamilySuggestion | null {
  const eventWithoutReminder = events.find(
    (event) =>
      getDaysUntilFamilyEvent(event) <= 14 && event.reminders.length === 0
  );

  if (!eventWithoutReminder) {
    return null;
  }

  return {
    id: "event-reminder",
    href: "/birthdays",
    text: `לא הוגדרה תזכורת עבור ${getEventLabel(eventWithoutReminder)}.`,
    action: "פתח אירועים",
  };
}

function getUncategorizedExpenseSuggestion(
  transactions: FinanceTransaction[]
): FamilySuggestion | null {
  const uncategorizedExpense = transactions.find(
    (transaction) =>
      transaction.type === "expense" &&
      (!transaction.category || transaction.category.trim() === "")
  );

  if (!uncategorizedExpense) {
    return null;
  }

  return {
    id: "finance-category",
    href: "/finance",
    text: "יש הוצאה בלי קטגוריה. סידור קטן עכשיו ישפר את הדוחות.",
    action: "פתח כספים",
  };
}

function getShoppingSuggestion(
  uncheckedItems: ShoppingItem[]
): FamilySuggestion | null {
  if (uncheckedItems.length < 5) {
    return null;
  }

  return {
    id: "shopping-open",
    href: "/shopping",
    text: `יש ${uncheckedItems.length} פריטים פתוחים לקנייה. אפשר לסגור את הרשימה לפני היציאה.`,
    action: "פתח קניות",
  };
}

function getDocumentSuggestion(
  records: ModuleRecord[]
): FamilySuggestion | null {
  const upcomingDocument = records.find(
    (record) => record.status === "open" && getDaysUntilDate(record.date) <= 30
  );

  if (!upcomingDocument) {
    return null;
  }

  return {
    id: "documents-upcoming",
    href: "/documents",
    text: `${upcomingDocument.title} מתקרב. כדאי לוודא שהמסמך מעודכן.`,
    action: "פתח מסמכים",
  };
}
