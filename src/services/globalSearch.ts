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
import { initialPermissionUsers, roleLabels } from "@/data/permissions";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { storageKeys } from "@/lib/storageKeys";
import { toSmartDocumentView } from "@/services/smartDocuments";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { AppRoute } from "@/types/navigation";
import type { FamilyPermissionUser } from "@/types/permissions";
import type { ShoppingItem } from "@/types/shopping";
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
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "");
}

function matchesQuery(query: string, values: Array<string | number | undefined>) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return false;
  }

  return values.some((value) =>
    normalize(String(value ?? "")).includes(normalizedQuery)
  );
}

function formatCurrency(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function moduleNames(language: AppLanguage) {
  const dictionary = getDictionary(language);

  return {
    modules: language === "en" ? "Modules" : "מודולים",
    tasks: dictionary.nav.tasks,
    finance: dictionary.nav.finance,
    health: dictionary.nav.health,
    documents: dictionary.nav.documents,
    vehicles: dictionary.nav.vehicles,
    family: dictionary.nav.family,
    birthdays: dictionary.nav.birthdays,
    shopping: dictionary.nav.shopping,
    permissions: dictionary.nav.permissions,
  };
}

function taskToResult(
  task: FamilyTask,
  language: AppLanguage
): GlobalSearchResult {
  const names = moduleNames(language);
  const due = language === "en" ? "Due" : "יעד";

  return {
    id: `task-${task.id}`,
    title: task.title,
    description: `${task.category} · ${task.owner} · ${due} ${task.dueDate}`,
    module: names.tasks,
    href: "/tasks",
  };
}

function financeToResult(
  transaction: FinanceTransaction,
  language: AppLanguage
): GlobalSearchResult {
  const names = moduleNames(language);

  return {
    id: `finance-${transaction.id}`,
    title: transaction.title,
    description: `${transaction.category} · ${formatCurrency(transaction.amount, language)} · ${transaction.date}`,
    module: names.finance,
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

function birthdayToResult(
  person: BirthdayPerson,
  language: AppLanguage
): GlobalSearchResult {
  const names = moduleNames(language);

  return {
    id: `birthday-${person.id}`,
    title: person.name,
    description: `${person.relationship} · ${person.hebrewDate} · ${person.gregorianDate}`,
    module: names.birthdays,
    href: "/birthdays",
  };
}

function shoppingToResult(
  item: ShoppingItem,
  language: AppLanguage
): GlobalSearchResult {
  const names = moduleNames(language);

  return {
    id: `shopping-${item.id}`,
    title: item.title,
    description: `${item.listName} · ${item.department} · ${item.buyer}`,
    module: names.shopping,
    href: "/shopping",
  };
}

function permissionToResult(
  user: FamilyPermissionUser,
  language: AppLanguage
): GlobalSearchResult {
  const names = moduleNames(language);

  return {
    id: `permission-${user.id}`,
    title: user.name,
    description: `${roleLabels[user.role]} · ${user.note}`,
    module: names.permissions,
    href: "/permissions",
  };
}

export function getGlobalSearchResults(
  query: string,
  language: AppLanguage = "he"
): GlobalSearchResult[] {
  const names = moduleNames(language);
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
        matchesQuery(query, [module.label, module.description, module.href])
      )
      .map((module) => ({
        id: `module-${module.href}`,
        title: module.label,
        description: module.description,
        module: names.modules,
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
      .map((task) => taskToResult(task, language)),
    ...financeTransactions
      .filter((transaction) =>
        matchesQuery(query, [
          transaction.title,
          transaction.category,
          transaction.date,
          transaction.amount,
          transaction.notes,
        ])
      )
      .map((transaction) => financeToResult(transaction, language)),
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
      .map((record) => moduleRecordToResult(record, names.health, "/health")),
    ...documentRecords
      .map((record) => toSmartDocumentView(record))
      .filter((view) =>
        matchesQuery(query, [
          view.item.title,
          view.item.description,
          view.item.owner,
          view.item.category,
          view.item.date,
          view.typeLabel,
          view.summary,
          view.statusLabel,
          ...(view.item.tags ?? []),
          ...(view.item.attachments ?? []).map((file) => file.name),
          ...view.extractedMetadata.map(
            (entry) => `${entry.label} ${entry.value}`
          ),
          ...view.linkedModules.map(
            (link) => `${link.label} ${link.description}`
          ),
        ])
      )
      .map((view) =>
        moduleRecordToResult(view.item, names.documents, "/documents")
      ),
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
      .map((record) => moduleRecordToResult(record, names.vehicles, "/vehicles")),
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
      .map((record) => moduleRecordToResult(record, names.family, "/family")),
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
      .map((person) => birthdayToResult(person, language)),
    ...shoppingItems
      .filter((item) =>
        matchesQuery(query, [
          item.title,
          item.listName,
          item.department,
          item.buyer,
          item.notes,
          item.quantity,
          item.estimatedPrice,
        ])
      )
      .map((item) => shoppingToResult(item, language)),
    ...permissionUsers
      .filter((user) =>
        matchesQuery(query, [
          user.name,
          roleLabels[user.role],
          user.note,
          ...user.permissions.map((permission) => permission.label),
        ])
      )
      .map((user) => permissionToResult(user, language)),
  ];

  return results.slice(0, 8);
}
