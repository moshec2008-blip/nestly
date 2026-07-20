import { initialBirthdays } from "@/data/birthdays";
import {
  getFinanceStats,
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import {
  initialDocumentRecords,
  initialHealthRecords,
  initialVehicleRecords,
} from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { getTaskStats, initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import type { AppLanguage } from "@/i18n/config";
import { storageKeys } from "@/lib/storageKeys";
import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";
import type { BirthdayPerson } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import { getDaysUntilBirthday } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";
import { getLocale } from "@/i18n/locale";

export type IntelligenceTone = "good" | "info" | "warning" | "danger";

export type TodayAttentionItem = {
  id: string;
  title: string;
  description: string;
  href: AppRoute;
  icon: AppIconName;
  tone: IntelligenceTone;
  priority: number;
  statusLabel: string;
};

export type DailyFocus = {
  title: string;
  description: string;
  href: AppRoute;
  actionLabel: string;
  icon: AppIconName;
  tone: IntelligenceTone;
};

export type FamilyActivity = {
  id: string;
  title: string;
  description: string;
  href: AppRoute;
  icon: AppIconName;
  date: string;
};

export type OrganizationScore = {
  score: number;
  label: string;
  description: string;
  tone: IntelligenceTone;
};

type IntelligenceSnapshot = {
  tasks: FamilyTask[];
  transactions: FinanceTransaction[];
  health: ModuleRecord[];
  documents: ModuleRecord[];
  vehicles: ModuleRecord[];
  birthdays: BirthdayPerson[];
  shopping: ShoppingItem[];
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function formatCurrency(amount: number, language: AppLanguage) {
  return new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string, language: AppLanguage) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    day: "numeric",
    month: "short",
  }).format(parsedDate);
}

function daysUntil(date: string) {
  const current = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.round((target.getTime() - current.getTime()) / 86_400_000);
}

function readSnapshot(): IntelligenceSnapshot {
  return {
    tasks: readStorageArray(storageKeys.tasks, initialFamilyTasks),
    transactions: readStorageArray(
      storageKeys.finance,
      initialFinanceTransactions
    ),
    health: readStorageArray(storageKeys.health, initialHealthRecords),
    documents: readStorageArray(storageKeys.documents, initialDocumentRecords),
    vehicles: readStorageArray(storageKeys.vehicles, initialVehicleRecords),
    birthdays: readStorageArray(storageKeys.birthdays, initialBirthdays),
    shopping: readStorageArray(storageKeys.shopping, initialShoppingItems),
  };
}

function copy(language: AppLanguage) {
  return language === "en"
    ? {
        today: "Today",
        soon: "Soon",
        overdue: "Overdue",
        upcoming: "Upcoming",
        done: "Done",
        openTasks: (count: number) =>
          `${count} open ${count === 1 ? "task" : "tasks"}`,
        taskDue: (date: string) => `Due ${date}`,
        shopping: (count: number) =>
          `${count} ${count === 1 ? "shopping item" : "shopping items"} left`,
        shoppingDescription: "Your next shopping trip is still open",
        payment: (amount: string) => `${amount} payment needs attention`,
        document: (date: string) => `Document reminder · ${date}`,
        vehicle: (date: string) => `Vehicle reminder · ${date}`,
        health: (date: string) => `Health reminder · ${date}`,
        birthday: (name: string, days: number) =>
          days === 0 ? `${name} celebrates today` : `${name} in ${days} days`,
        calmTitle: "Everything is under control",
        calmDescription: "Nothing needs urgent attention today.",
        openTasksFocus: "Start with the most important task",
        openTasksFocusDescription: "One clear action is easier than a long list.",
        paymentFocus: "Review the pending payment",
        paymentFocusDescription: "A quick check can prevent a late bill.",
        shoppingFocus: "Complete today's shopping",
        shoppingFocusDescription: "Finish the open shopping list while it is fresh.",
        eventFocus: "Prepare for the next family event",
        eventFocusDescription: "A small reminder now saves stress later.",
        open: "Open",
        scoreGood: "Calm",
        scoreWarning: "Needs attention",
        scoreDanger: "Busy day",
        scoreDescription: (open: number, attention: number) =>
          `${open} open items, ${attention} need attention today.`,
      }
    : {
        today: "היום",
        soon: "בקרוב",
        overdue: "באיחור",
        upcoming: "בהמשך",
        done: "בוצע",
        openTasks: (count: number) => `${count} משימות פתוחות`,
        taskDue: (date: string) => `יעד ${date}`,
        shopping: (count: number) => `${count} פריטים לקנייה`,
        shoppingDescription: "רשימת הקניות עדיין פתוחה",
        payment: (amount: string) => `תשלום של ${amount} דורש תשומת לב`,
        document: (date: string) => `תזכורת מסמך · ${date}`,
        vehicle: (date: string) => `תזכורת רכב · ${date}`,
        health: (date: string) => `תזכורת בריאות · ${date}`,
        birthday: (name: string, days: number) =>
          days === 0 ? `${name} חוגג/ת היום` : `${name} בעוד ${days} ימים`,
        calmTitle: "הכול בשליטה",
        calmDescription: "אין משהו דחוף שדורש טיפול היום.",
        openTasksFocus: "להתחיל מהמשימה החשובה",
        openTasksFocusDescription: "פעולה אחת ברורה עדיפה על רשימה ארוכה.",
        paymentFocus: "לבדוק את התשלום הממתין",
        paymentFocusDescription: "בדיקה קצרה יכולה למנוע איחור בתשלום.",
        shoppingFocus: "לסיים את הקניות",
        shoppingFocusDescription: "הרשימה פתוחה וכדאי לסגור אותה כשהיא טרייה.",
        eventFocus: "להתכונן לאירוע המשפחתי הבא",
        eventFocusDescription: "תזכורת קטנה עכשיו חוסכת לחץ אחר כך.",
        open: "פתח",
        scoreGood: "רגוע",
        scoreWarning: "דורש תשומת לב",
        scoreDanger: "יום עמוס",
        scoreDescription: (open: number, attention: number) =>
          `${open} פריטים פתוחים, ${attention} דורשים תשומת לב היום.`,
      };
}

export function getTodayAttentionItems(
  language: AppLanguage = "he"
): TodayAttentionItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const text = copy(language);
  const snapshot = readSnapshot();
  const items: TodayAttentionItem[] = [];
  const today = todayIso();

  const urgentTask = [...snapshot.tasks]
    .filter((task) => task.status === "open" && task.dueDate <= today)
    .sort((first, second) => {
      if (first.priority !== second.priority) {
        return first.priority === "high" ? -1 : 1;
      }

      return first.dueDate.localeCompare(second.dueDate);
    })[0];

  if (urgentTask) {
    const overdue = urgentTask.dueDate < today;
    items.push({
      id: `task-${urgentTask.id}`,
      title: urgentTask.title,
      description: text.taskDue(formatDate(urgentTask.dueDate, language)),
      href: "/tasks",
      icon: "check",
      tone: overdue ? "danger" : "warning",
      priority: overdue ? 10 : 8,
      statusLabel: overdue ? text.overdue : text.today,
    });
  }

  const pendingPayment = [...snapshot.transactions]
    .filter((transaction) => transaction.status === "pending")
    .sort((first, second) => first.date.localeCompare(second.date))[0];

  if (pendingPayment) {
    const overdue = pendingPayment.date < today;
    items.push({
      id: `finance-${pendingPayment.id}`,
      title: pendingPayment.title,
      description: text.payment(formatCurrency(pendingPayment.amount, language)),
      href: "/finance",
      icon: "finance",
      tone: overdue ? "danger" : "warning",
      priority: overdue ? 9 : 7,
      statusLabel: overdue ? text.overdue : text.soon,
    });
  }

  const openShoppingCount = snapshot.shopping.filter(
    (item) => !item.purchased
  ).length;

  if (openShoppingCount > 0) {
    items.push({
      id: "shopping-open",
      title: text.shopping(openShoppingCount),
      description: text.shoppingDescription,
      href: "/shopping",
      icon: "shopping",
      tone: "info",
      priority: 4,
      statusLabel: text.upcoming,
    });
  }

  const upcomingBirthday = [...snapshot.birthdays]
    .map((birthday) => ({
      birthday,
      days: getDaysUntilBirthday({
        gregorianDate: birthday.gregorianDate,
        calendarType: birthday.calendarType ?? "hebrew",
      }),
    }))
    .filter(({ days }) => Number.isFinite(days) && days <= 14)
    .sort((first, second) => first.days - second.days)[0];

  if (upcomingBirthday) {
    items.push({
      id: `birthday-${upcomingBirthday.birthday.id}`,
      title: text.birthday(upcomingBirthday.birthday.name, upcomingBirthday.days),
      description: upcomingBirthday.birthday.relationship,
      href: "/birthdays",
      icon: "calendar",
      tone: upcomingBirthday.days === 0 ? "good" : "info",
      priority: upcomingBirthday.days === 0 ? 8 : 5,
      statusLabel: upcomingBirthday.days === 0 ? text.today : text.soon,
    });
  }

  const moduleSources: Array<{
    records: ModuleRecord[];
    href: AppRoute;
    icon: AppIconName;
    label: (date: string) => string;
    prefix: string;
  }> = [
    {
      records: snapshot.documents,
      href: "/documents",
      icon: "document",
      label: text.document,
      prefix: "document",
    },
    {
      records: snapshot.vehicles,
      href: "/vehicles",
      icon: "car",
      label: text.vehicle,
      prefix: "vehicle",
    },
    {
      records: snapshot.health,
      href: "/health",
      icon: "health",
      label: text.health,
      prefix: "health",
    },
  ];

  moduleSources.forEach((source) => {
    const record = [...source.records]
      .filter((item) => item.status === "open" && daysUntil(item.date) <= 14)
      .sort((first, second) => first.date.localeCompare(second.date))[0];

    if (!record) {
      return;
    }

    const days = daysUntil(record.date);
    items.push({
      id: `${source.prefix}-${record.id}`,
      title: record.title,
      description: source.label(formatDate(record.date, language)),
      href: source.href,
      icon: source.icon,
      tone: days < 0 ? "danger" : days <= 3 ? "warning" : "info",
      priority: days < 0 ? 8 : days <= 3 ? 6 : 3,
      statusLabel: days < 0 ? text.overdue : days === 0 ? text.today : text.soon,
    });
  });

  return items.sort((first, second) => second.priority - first.priority).slice(0, 5);
}

export function getDailyFocus(language: AppLanguage = "he"): DailyFocus {
  const text = copy(language);
  const items = getTodayAttentionItems(language);
  const primary = items[0];

  if (!primary) {
    return {
      title: text.calmTitle,
      description: text.calmDescription,
      href: "/",
      actionLabel: text.open,
      icon: "spark",
      tone: "good",
    };
  }

  if (primary.href === "/tasks") {
    return {
      title: text.openTasksFocus,
      description: primary.title,
      href: primary.href,
      actionLabel: text.open,
      icon: primary.icon,
      tone: primary.tone,
    };
  }

  if (primary.href === "/finance") {
    return {
      title: text.paymentFocus,
      description: primary.title,
      href: primary.href,
      actionLabel: text.open,
      icon: primary.icon,
      tone: primary.tone,
    };
  }

  if (primary.href === "/shopping") {
    return {
      title: text.shoppingFocus,
      description: text.shoppingFocusDescription,
      href: primary.href,
      actionLabel: text.open,
      icon: primary.icon,
      tone: primary.tone,
    };
  }

  if (primary.href === "/birthdays") {
    return {
      title: text.eventFocus,
      description: primary.title,
      href: primary.href,
      actionLabel: text.open,
      icon: primary.icon,
      tone: primary.tone,
    };
  }

  return {
    title: primary.title,
    description: primary.description,
    href: primary.href,
    actionLabel: text.open,
    icon: primary.icon,
    tone: primary.tone,
  };
}

export function getFamilyActivityFeed(
  language: AppLanguage = "he"
): FamilyActivity[] {
  if (typeof window === "undefined") {
    return [];
  }

  const snapshot = readSnapshot();
  const done = language === "en" ? "Completed" : "בוצע";
  const added = language === "en" ? "Added" : "נוסף";
  const scanned = language === "en" ? "Scanned" : "נסרק";

  return [
    ...snapshot.tasks
      .filter((task) => task.status === "done")
      .map((task) => ({
        id: `task-${task.id}`,
        title: `${done}: ${task.title}`,
        description: task.owner,
        href: "/tasks" as const,
        icon: "check" as const,
        date: task.dueDate,
      })),
    ...snapshot.transactions.slice(-4).map((transaction) => ({
      id: `finance-${transaction.id}`,
      title:
        transaction.source === "receipt_scan"
          ? `${scanned}: ${transaction.title}`
          : transaction.title,
      description: formatCurrency(transaction.amount, language),
      href: "/finance" as const,
      icon: "finance" as const,
      date: transaction.date,
    })),
    ...snapshot.documents.slice(-4).map((document) => ({
      id: `document-${document.id}`,
      title: `${added}: ${document.title}`,
      description: document.category,
      href: "/documents" as const,
      icon: "document" as const,
      date: document.date,
    })),
    ...snapshot.vehicles
      .filter((vehicle) => vehicle.status === "done")
      .map((vehicle) => ({
        id: `vehicle-${vehicle.id}`,
        title: `${done}: ${vehicle.title}`,
        description: vehicle.category,
        href: "/vehicles" as const,
        icon: "car" as const,
        date: vehicle.date,
      })),
  ]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 6);
}

export function getOrganizationScore(
  language: AppLanguage = "he"
): OrganizationScore {
  const text = copy(language);
  const snapshot = readSnapshot();
  const taskStats = getTaskStats(snapshot.tasks);
  const financeStats = getFinanceStats(snapshot.transactions);
  const openRecords =
    snapshot.health.filter((item) => item.status === "open").length +
    snapshot.documents.filter((item) => item.status === "open").length +
    snapshot.vehicles.filter((item) => item.status === "open").length;
  const attentionItems = getTodayAttentionItems(language);
  const totalOpen =
    taskStats.openTasks +
    financeStats.pendingPayments +
    openRecords +
    snapshot.shopping.filter((item) => !item.purchased).length;
  const score = Math.max(35, Math.min(96, 96 - attentionItems.length * 9 - totalOpen * 2));
  const tone: IntelligenceTone =
    score >= 80 ? "good" : score >= 60 ? "warning" : "danger";

  return {
    score,
    label:
      tone === "good"
        ? text.scoreGood
        : tone === "warning"
          ? text.scoreWarning
          : text.scoreDanger,
    description: text.scoreDescription(totalOpen, attentionItems.length),
    tone,
  };
}
