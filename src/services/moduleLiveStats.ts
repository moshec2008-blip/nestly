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
import { storageKeys } from "@/lib/storageKeys";
import type { AppRoute } from "@/types/navigation";
import { getDaysUntilBirthday } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

export function getModuleLiveStat(href: AppRoute, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  if (href === "/finance") {
    const transactions = readStorageArray(
      storageKeys.finance,
      initialFinanceTransactions
    );
    const stats = getFinanceStats(transactions);
    return `${stats.balance.toLocaleString("he-IL")} ₪ יתרה`;
  }

  if (href === "/tasks") {
    const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);
    return `${getTaskStats(tasks).openTasks} פתוחות`;
  }

  if (href === "/health") {
    const records = readStorageArray(storageKeys.health, initialHealthRecords);
    return `${records.filter((record) => record.status === "open").length} פתוחים`;
  }

  if (href === "/vehicles") {
    const records = readStorageArray(
      storageKeys.vehicles,
      initialVehicleRecords
    );
    return `${records.filter((record) => record.status === "open").length} תזכורות`;
  }

  if (href === "/documents") {
    const records = readStorageArray(
      storageKeys.documents,
      initialDocumentRecords
    );
    return `${records.length} מסמכים`;
  }

  if (href === "/birthdays") {
    const birthdays = readStorageArray(storageKeys.birthdays, initialBirthdays);
    const nextBirthday = [...birthdays].sort(
      (first, second) =>
        getDaysUntilBirthday({
          gregorianDate: first.gregorianDate,
          calendarType: first.calendarType,
        }) -
        getDaysUntilBirthday({
          gregorianDate: second.gregorianDate,
          calendarType: second.calendarType,
        })
    )[0];

    return nextBirthday
      ? `${nextBirthday.name} בעוד ${getDaysUntilBirthday({
          gregorianDate: nextBirthday.gregorianDate,
          calendarType: nextBirthday.calendarType,
        })} ימים`
      : fallback;
  }

  if (href === "/shopping") {
    const items = readStorageArray(storageKeys.shopping, initialShoppingItems);
    return `${items.filter((item) => !item.purchased).length} לקנייה`;
  }

  if (href === "/family") {
    const records = readStorageArray(storageKeys.family, initialFamilyRecords);
    return `${records.length} רשומות`;
  }

  return fallback;
}
