import { appModules } from "@/data/dashboard";
import { initialBirthdays } from "@/data/birthdays";
import {
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import {
  initialDocumentRecords,
  initialFamilyRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import {
  initialPermissionUsers,
  roleLabels,
} from "@/data/permissions";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { FamilyPermissionUser } from "@/types/permissions";
import type { ShoppingItem } from "@/types/shopping";
import type { AppRoute } from "@/types/navigation";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray } from "@/utils/storage";

export type GlobalSearchResult = {
  id: string;
  title: string;
  description: string;
  module: string;
  href: AppRoute;
};

type DocumentSearchRecord = ModuleRecord & {
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(query: string, values: string[]) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return false;
  }

  return values.some((value) => normalize(value).includes(normalizedQuery));
}

function taskToResult(task: FamilyTask): GlobalSearchResult {
  return {
    id: `task-${task.id}`,
    title: task.title,
    description: `${task.category} · ${task.owner} · יעד ${task.dueDate}`,
    module: "משימות",
    href: "/tasks",
  };
}

function financeToResult(transaction: FinanceTransaction): GlobalSearchResult {
  return {
    id: `finance-${transaction.id}`,
    title: transaction.title,
    description: `${transaction.category} · ${transaction.amount.toLocaleString(
      "he-IL"
    )} ש"ח · ${transaction.date}`,
    module: "כספים",
    href: "/finance",
  };
}

function moduleRecordToResult(
  record: ModuleRecord,
  module: string,
  href: AppRoute
): GlobalSearchResult {
  return {
    id: `${href}-${record.id}`,
    title: record.title,
    description: `${record.category} · ${record.owner} · ${record.date}`,
    module,
    href,
  };
}

function birthdayToResult(person: BirthdayPerson): GlobalSearchResult {
  return {
    id: `birthday-${person.id}`,
    title: person.name,
    description: `${person.relationship} · ${person.hebrewDate} · ${person.gregorianDate}`,
    module: "ימי הולדת",
    href: "/birthdays",
  };
}

function shoppingToResult(item: ShoppingItem): GlobalSearchResult {
  return {
    id: `shopping-${item.id}`,
    title: item.title,
    description: `${item.listName} · ${item.department} · ${item.buyer}`,
    module: "קניות",
    href: "/shopping",
  };
}

function permissionToResult(user: FamilyPermissionUser): GlobalSearchResult {
  return {
    id: `permission-${user.id}`,
    title: user.name,
    description: `${roleLabels[user.role]} · ${user.note}`,
    module: "הרשאות",
    href: "/permissions",
  };
}

export function getGlobalSearchResults(query: string): GlobalSearchResult[] {
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
  const documentRecords = readStorageArray<DocumentSearchRecord>(
    storageKeys.documents,
    initialDocumentRecords
  );
  const vehicleRecords = readStorageArray<ModuleRecord>(
    storageKeys.vehicles,
    initialVehicleRecords
  );
  const familyRecords = readStorageArray<ModuleRecord>(
    storageKeys.family,
    initialFamilyRecords
  );
  const birthdays = readStorageArray<BirthdayPerson>(
    storageKeys.birthdays,
    initialBirthdays
  );
  const shoppingItems = readStorageArray<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  );
  const permissionUsers = readStorageArray<FamilyPermissionUser>(
    storageKeys.permissions,
    initialPermissionUsers
  );

  const results: GlobalSearchResult[] = [
    ...appModules
      .filter((module) =>
        matchesQuery(query, [module.label, module.description])
      )
      .map((module) => ({
        id: `module-${module.href}`,
        title: module.label,
        description: module.description,
        module: "מודולים",
        href: module.href,
      })),
    ...tasks
      .filter((task) =>
        matchesQuery(query, [
          task.title,
          task.description,
          task.owner,
          task.category,
          task.dueDate,
        ])
      )
      .map(taskToResult),
    ...financeTransactions
      .filter((transaction) =>
        matchesQuery(query, [
          transaction.title,
          transaction.category,
          transaction.date,
          transaction.amount.toString(),
        ])
      )
      .map(financeToResult),
    ...healthRecords
      .filter((record) =>
        matchesQuery(query, [
          record.title,
          record.description,
          record.owner,
          record.category,
          record.date,
        ])
      )
      .map((record) => moduleRecordToResult(record, "בריאות", "/health")),
    ...documentRecords
      .filter((record) =>
        matchesQuery(query, [
          record.title,
          record.description,
          record.owner,
          record.category,
          record.date,
          ...(record.attachments ?? []).map((file) => file.name),
        ])
      )
      .map((record) => moduleRecordToResult(record, "מסמכים", "/documents")),
    ...vehicleRecords
      .filter((record) =>
        matchesQuery(query, [
          record.title,
          record.description,
          record.owner,
          record.category,
          record.date,
        ])
      )
      .map((record) => moduleRecordToResult(record, "רכבים", "/vehicles")),
    ...familyRecords
      .filter((record) =>
        matchesQuery(query, [
          record.title,
          record.description,
          record.owner,
          record.category,
          record.date,
        ])
      )
      .map((record) => moduleRecordToResult(record, "משפחה", "/family")),
    ...birthdays
      .filter((person) =>
        matchesQuery(query, [
          person.name,
          person.relationship,
          person.gregorianDate,
          person.hebrewDate,
          person.notes,
        ])
      )
      .map(birthdayToResult),
    ...shoppingItems
      .filter((item) =>
        matchesQuery(query, [
          item.title,
          item.listName,
          item.department,
          item.buyer,
          item.notes,
          item.quantity,
          item.estimatedPrice.toString(),
        ])
      )
      .map(shoppingToResult),
    ...permissionUsers
      .filter((user) =>
        matchesQuery(query, [
          user.name,
          roleLabels[user.role],
          user.note,
          ...user.permissions.map((permission) => permission.label),
        ])
      )
      .map(permissionToResult),
  ];

  return results.slice(0, 8);
}
