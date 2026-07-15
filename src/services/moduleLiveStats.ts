import { initialBirthdays } from "@/data/birthdays";
import { getFinanceStats, initialFinanceTransactions } from "@/data/finance";
import {
  initialDocumentRecords,
  initialFamilyRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import { storageKeys } from "@/lib/storageKeys";
import { readKnowledgeItems } from "@/services/familyKnowledge";
import { getCommandCenterSections } from "@/services/commandCenterService";
import { getRecentTimelineItems } from "@/services/timelineService";
import type { AppRoute } from "@/types/navigation";
import {
  getDaysUntilFamilyEvent,
  normalizeFamilyEvent,
} from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

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

function enPlural(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function getModuleLiveStat(
  href: AppRoute,
  fallback: string,
  language: AppLanguage = "he"
) {
  if (typeof window === "undefined") {
    return fallback;
  }

  if (href === "/finance") {
    const transactions = readStorageArray(
      storageKeys.finance,
      initialFinanceTransactions
    );
    const stats = getFinanceStats(transactions);
    return language === "en"
      ? `${formatCurrency(stats.balance, language)} balance`
      : `${formatCurrency(stats.balance, language)} יתרה`;
  }

  if (href === "/tasks") {
    const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);
    const openTasks = getTaskStats(tasks).openTasks;
    return language === "en" ? `${openTasks} open` : `${openTasks} פתוחות`;
  }

  if (href === "/command-center") {
    const sections = getCommandCenterSections();
    const attentionCount = sections.urgent.length + sections.today.length;
    return language === "en"
      ? `${attentionCount} need attention`
      : `${attentionCount} לטיפול`;
  }

  if (href === "/timeline") {
    const items = getRecentTimelineItems(100);
    return language === "en"
      ? `${items.length} ${enPlural(items.length, "update", "updates")}`
      : `${items.length} עדכונים`;
  }

  if (href === "/health") {
    const records = readStorageArray(storageKeys.health, initialHealthRecords);
    const openRecords = records.filter((record) => record.status === "open").length;
    return language === "en"
      ? `${openRecords} ${enPlural(openRecords, "open item", "open items")}`
      : `${openRecords} פתוחים`;
  }

  if (href === "/vehicles") {
    const records = readStorageArray(
      storageKeys.vehicles,
      initialVehicleRecords
    );
    const openRecords = records.filter((record) => record.status === "open").length;
    return language === "en"
      ? `${openRecords} ${enPlural(openRecords, "reminder", "reminders")}`
      : `${openRecords} תזכורות`;
  }

  if (href === "/documents") {
    const records = readStorageArray(
      storageKeys.documents,
      initialDocumentRecords
    );
    return language === "en"
      ? `${records.length} ${enPlural(records.length, "document", "documents")}`
      : `${records.length} מסמכים`;
  }

  if (href === "/birthdays") {
    const events = readStorageArray(storageKeys.birthdays, initialBirthdays).map(
      normalizeFamilyEvent
    );
    const nextEvent = [...events]
      .filter((event) => Number.isFinite(getDaysUntilFamilyEvent(event)))
      .sort(
        (first, second) =>
          getDaysUntilFamilyEvent(first) - getDaysUntilFamilyEvent(second)
      )[0];

    if (!nextEvent) {
      return fallback;
    }

    const days = getDaysUntilFamilyEvent(nextEvent);
    return language === "en"
      ? `${nextEvent.person || nextEvent.name} in ${days} ${enPlural(days, "day", "days")}`
      : `${nextEvent.person || nextEvent.name} בעוד ${days} ימים`;
  }

  if (href === "/shopping") {
    const items = readStorageArray(storageKeys.shopping, initialShoppingItems);
    const remaining = items.filter((item) => !item.purchased).length;
    return language === "en" ? `${remaining} to buy` : `${remaining} לקנייה`;
  }

  if (href === "/family") {
    const records = readStorageArray(storageKeys.family, initialFamilyRecords);
    return language === "en"
      ? `${records.length} ${enPlural(records.length, "record", "records")}`
      : `${records.length} רשומות`;
  }

  if (href === "/knowledge") {
    const items = readKnowledgeItems();
    return language === "en"
      ? `${items.length} ${enPlural(items.length, "memory", "memories")}`
      : `${items.length} פריטים`;
  }

  return fallback;
}
