import {
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import { initialBirthdays } from "@/data/birthdays";
import { initialHealthRecords, initialVehicleRecords } from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import type { AppRoute } from "@/types/navigation";
import { storageKeys } from "@/lib/storageKeys";
import { getDaysUntilBirthday } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  href: AppRoute;
  tone: "info" | "warning" | "danger";
};

function isUpcoming(date: string, daysAhead = 30) {
  const today = new Date();
  const targetDate = new Date(date);
  const diff = targetDate.getTime() - today.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);

  return diffDays >= -1 && diffDays <= daysAhead;
}

export function getAppNotifications(): AppNotification[] {
  const tasks = readStorageArray<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  );
  const financeTransactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const healthRecords = readStorageArray<ModuleRecord>(
    storageKeys.health,
    initialHealthRecords
  );
  const vehicleRecords = readStorageArray<ModuleRecord>(
    storageKeys.vehicles,
    initialVehicleRecords
  );
  const birthdays = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );
  const shoppingItems = readStorageArray<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  );

  const highPriorityTasks = tasks
    .filter((task) => task.status === "open" && task.priority === "high")
    .slice(0, 2)
    .map((task) => ({
      id: `task-${task.id}`,
      title: "משימה בעדיפות גבוהה",
      description: `${task.title} · יעד ${task.dueDate}`,
      href: "/tasks" as const,
      tone: "warning" as const,
    }));

  const pendingPayments = financeTransactions
    .filter((transaction) => transaction.status === "pending")
    .slice(0, 2)
    .map((transaction) => ({
      id: `finance-${transaction.id}`,
      title: "תשלום ממתין",
      description: `${transaction.title} · ${transaction.amount.toLocaleString(
        "he-IL"
      )} ש"ח`,
      href: "/finance" as const,
      tone: "warning" as const,
    }));

  const healthNotifications = healthRecords
    .filter((record) => record.status === "open" && isUpcoming(record.date))
    .slice(0, 2)
    .map((record) => ({
      id: `health-${record.id}`,
      title: "בריאות: תאריך קרוב",
      description: `${record.title} · ${record.date}`,
      href: "/health" as const,
      tone: "info" as const,
    }));

  const vehicleNotifications = vehicleRecords
    .filter((record) => record.status === "open" && isUpcoming(record.date, 60))
    .slice(0, 2)
    .map((record) => ({
      id: `vehicle-${record.id}`,
      title: "רכב: טיפול או תזכורת",
      description: `${record.title} · ${record.date}`,
      href: "/vehicles" as const,
      tone: "info" as const,
    }));

  const birthdayNotifications = birthdays
    .filter((birthday) => {
      const days = getDaysUntilBirthday({
        gregorianDate: birthday.gregorianDate,
        calendarType: birthday.calendarType ?? "hebrew",
      });
      return days === 7 || days === 1;
    })
    .slice(0, 2)
    .map((birthday) => ({
      id: `birthday-${birthday.id}`,
      title: "יום הולדת קרוב",
      description: `${birthday.name} · ${birthday.hebrewDate}`,
      href: "/birthdays" as const,
      tone: "info" as const,
    }));

  const shoppingNotifications = shoppingItems
    .filter((item) => !item.purchased)
    .slice(0, 2)
    .map((item) => ({
      id: `shopping-${item.id}`,
      title: "פריט קניות פתוח",
      description: `${item.title} · ${item.listName}`,
      href: "/shopping" as const,
      tone: "info" as const,
    }));

  return [
    ...highPriorityTasks,
    ...pendingPayments,
    ...healthNotifications,
    ...vehicleNotifications,
    ...birthdayNotifications,
    ...shoppingNotifications,
  ].slice(0, 6);
}
