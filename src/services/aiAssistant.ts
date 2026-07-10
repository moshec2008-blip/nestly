import { initialBirthdays } from "@/data/birthdays";
import { initialFinanceTransactions } from "@/data/finance";
import { initialDocumentRecords, initialHealthRecords, initialVehicleRecords } from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import type { FinanceTransaction } from "@/data/finance";
import type { FamilyTask } from "@/data/tasks";
import type {
  AiAssistantCapability,
  AiAssistantContext,
  AiDailyBriefing,
  AiFamilyInsight,
} from "@/types/aiAssistant";
import type { FamilyEvent } from "@/types/birthdays";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import { getDaysUntilFamilyEvent, normalizeFamilyEvent } from "@/utils/birthdayCalendar";
import { readStorageArray } from "@/utils/storage";

type FamilyAiData = {
  events: FamilyEvent[];
  financeTransactions: FinanceTransaction[];
  shoppingItems: ShoppingItem[];
  tasks: FamilyTask[];
  vehicleRecords: ModuleRecord[];
  healthRecords: ModuleRecord[];
  documentRecords: ModuleRecord[];
};

export const aiAssistantCapabilities: AiAssistantCapability[] = [
  {
    domain: "documents",
    label: "מסמכים חכמים",
    status: "ready-local",
    description: "סיווג, תיוג וחילוץ שדות במצב mock מקומי.",
  },
  {
    domain: "dashboard",
    label: "סקירה יומית",
    status: "ready-local",
    description: "זיהוי שקט של מה שחשוב למשפחה היום.",
  },
  {
    domain: "finance",
    label: "תובנות כספים",
    status: "prepared",
    description: "זיהוי חריגות, כפילויות ותשלומים פתוחים.",
  },
  {
    domain: "shopping",
    label: "קניות חכמות",
    status: "prepared",
    description: "הכנה להצעות קבועות ומוצרים שחסרים בדרך כלל.",
  },
  {
    domain: "search",
    label: "חיפוש משפחתי",
    status: "future",
    description: "שאלות טבעיות שמובילות לתשובה או לעמוד הנכון.",
  },
];

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getDaysUntilDate(date: string | undefined, referenceDate: Date) {
  if (!date) return 9999;

  const targetDate = startOfDay(new Date(date));
  const today = startOfDay(referenceDate);

  if (Number.isNaN(targetDate.getTime())) return 9999;

  return Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getRelativeDayLabel(days: number) {
  if (days === 0) return "היום";
  if (days === 1) return "מחר";
  if (days > 1 && days <= 7) return `בעוד ${days} ימים`;
  if (days > 7 && days <= 31) return "בהמשך החודש";
  if (days < 0) return "באיחור";
  return "";
}

function createAction(
  insight: Pick<AiFamilyInsight, "id" | "targetRoute" | "actionLabel">,
  description: string
) {
  return [
    {
      id: `${insight.id}-review`,
      type: "review" as const,
      label: insight.actionLabel,
      description,
      targetRoute: insight.targetRoute,
      requiresConfirmation: true as const,
    },
  ];
}

function getEventName(event: FamilyEvent) {
  const name = event.person || event.name || event.title || "אירוע משפחתי";

  if (event.eventType === "anniversary") return `יום הנישואין של ${name}`;
  if (event.eventType === "memorial") return `יארצייט של ${name}`;
  if (event.eventType === "custom") return event.title || name;
  return `יום ההולדת של ${name}`;
}

function readFamilyAiData(): FamilyAiData {
  return {
    events: readStorageArray<FamilyEvent>(
      storageKeys.birthdays,
      initialBirthdays
    ).map(normalizeFamilyEvent),
    financeTransactions: readStorageArray<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions
    ),
    shoppingItems: readStorageArray<ShoppingItem>(
      storageKeys.shopping,
      initialShoppingItems
    ),
    tasks: readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks),
    vehicleRecords: readStorageArray<ModuleRecord>(
      storageKeys.vehicles,
      initialVehicleRecords
    ),
    healthRecords: readStorageArray<ModuleRecord>(
      storageKeys.health,
      initialHealthRecords
    ),
    documentRecords: readStorageArray<ModuleRecord>(
      storageKeys.documents,
      initialDocumentRecords
    ),
  };
}

function getEventInsights(data: FamilyAiData, now: Date): AiFamilyInsight[] {
  return data.events
    .map((event) => ({ event, days: getDaysUntilFamilyEvent(event, now) }))
    .filter(({ days }) => days <= 14)
    .slice(0, 2)
    .map(({ event, days }) => {
      const title = getEventName(event);
      const hasReminder = event.reminders.length > 0;
      const id = `ai-event-${event.id}`;

      return {
        id,
        domain: "family-events",
        title,
        message: hasReminder
          ? `${title} ${getRelativeDayLabel(days)}. התזכורת כבר מוכנה.`
          : `${title} ${getRelativeDayLabel(days)}. כדאי להוסיף תזכורת קצרה.`,
        tone: hasReminder ? "calm" : "warning",
        priority: Math.max(days, 0) + (hasReminder ? 8 : 2),
        targetRoute: "/birthdays",
        actionLabel: "פתח אירועים",
        actions: createAction(
          { id, targetRoute: "/birthdays", actionLabel: "בדוק תזכורת" },
          "פתיחת מרכז האירועים לאישור תזכורת או תכנון."
        ),
        createdAt: now.toISOString(),
      } satisfies AiFamilyInsight;
    });
}

function getFinanceInsights(data: FamilyAiData, now: Date): AiFamilyInsight[] {
  const pendingPayment = data.financeTransactions
    .filter((transaction) => transaction.status === "pending")
    .sort(
      (first, second) =>
        getDaysUntilDate(first.reminderDate || first.date, now) -
        getDaysUntilDate(second.reminderDate || second.date, now)
    )[0];
  const uncategorizedExpense = data.financeTransactions.find(
    (transaction) =>
      transaction.type === "expense" &&
      (!transaction.category || transaction.category.trim() === "")
  );
  const insights: AiFamilyInsight[] = [];

  if (pendingPayment) {
    const days = getDaysUntilDate(pendingPayment.reminderDate || pendingPayment.date, now);
    const id = `ai-finance-payment-${pendingPayment.id}`;

    insights.push({
      id,
      domain: "finance",
      title: pendingPayment.title,
      message: `${pendingPayment.title} ${getRelativeDayLabel(days) || "פתוח לתשלום"} · ${pendingPayment.amount.toLocaleString("he-IL")} ₪`,
      tone: days <= 1 ? "urgent" : "warning",
      priority: Math.max(days, 0) + 1,
      targetRoute: "/finance",
      actionLabel: "פתח כספים",
      actions: createAction(
        { id, targetRoute: "/finance", actionLabel: "בדוק תשלום" },
        "בדיקת התשלום לפני יצירת משימה או תזכורת."
      ),
      createdAt: now.toISOString(),
    });
  }

  if (uncategorizedExpense) {
    const id = `ai-finance-category-${uncategorizedExpense.id}`;

    insights.push({
      id,
      domain: "finance",
      title: "הוצאה בלי קטגוריה",
      message: "מצאתי הוצאה בלי קטגוריה. סידור קטן עכשיו ישפר את הדוחות בהמשך.",
      tone: "calm",
      priority: 22,
      targetRoute: "/finance",
      actionLabel: "סדר קטגוריה",
      actions: createAction(
        { id, targetRoute: "/finance", actionLabel: "פתח כספים" },
        "פתיחת הכספים לאישור קטגוריה. אין שינוי אוטומטי."
      ),
      createdAt: now.toISOString(),
    });
  }

  return insights;
}

function getShoppingInsights(data: FamilyAiData, now: Date): AiFamilyInsight[] {
  const uncheckedItems = data.shoppingItems.filter((item) => !item.purchased);

  if (uncheckedItems.length < 4) return [];

  const id = "ai-shopping-open-items";

  return [
    {
      id,
      domain: "shopping",
      title: "רשימת הקניות מוכנה",
      message: `יש ${uncheckedItems.length} פריטים פתוחים. אפשר לצאת לקנייה בלי לעבור על הכל מחדש.`,
      tone: "calm",
      priority: 18,
      targetRoute: "/shopping",
      actionLabel: "פתח קניות",
      actions: createAction(
        { id, targetRoute: "/shopping", actionLabel: "פתח קניות" },
        "פתיחת רשימת הקניות. הצעות נוספות יוצגו רק לאחר אישור."
      ),
      createdAt: now.toISOString(),
    },
  ];
}

function getTaskInsights(data: FamilyAiData, now: Date): AiFamilyInsight[] {
  const overdueTasks = data.tasks.filter(
    (task) =>
      task.status === "open" && getDaysUntilDate(task.dueDate, now) < 0
  );
  const highPriorityTasks = data.tasks.filter(
    (task) => task.status === "open" && task.priority === "high"
  );

  if (overdueTasks.length === 0 && highPriorityTasks.length === 0) return [];

  const id = overdueTasks.length > 0 ? "ai-tasks-overdue" : "ai-tasks-important";

  return [
    {
      id,
      domain: "tasks",
      title:
        overdueTasks.length > 0
          ? `${overdueTasks.length} משימות באיחור`
          : `${highPriorityTasks.length} משימות חשובות`,
      message:
        overdueTasks.length > 0
          ? "יש משימות שעברו את התאריך. כדאי לבחור אחת ולסגור אותה."
          : "יש משימות חשובות פתוחות. כדאי לשים אחת בראש היום.",
      tone: overdueTasks.length > 0 ? "warning" : "calm",
      priority: overdueTasks.length > 0 ? 7 : 16,
      targetRoute: "/tasks",
      actionLabel: "פתח משימות",
      actions: createAction(
        { id, targetRoute: "/tasks", actionLabel: "פתח משימות" },
        "פתיחת המשימות לבחירה ידנית. אין שינוי אוטומטי."
      ),
      createdAt: now.toISOString(),
    },
  ];
}

function getModuleRecordInsights(
  records: ModuleRecord[],
  route: "/vehicles" | "/health" | "/documents",
  domain: "vehicles" | "health" | "documents",
  now: Date
): AiFamilyInsight[] {
  const nextRecord = records
    .filter((record) => record.status === "open")
    .map((record) => ({ record, days: getDaysUntilDate(record.date, now) }))
    .filter(({ days }) => days <= 30)
    .sort((first, second) => first.days - second.days)[0];

  if (!nextRecord) return [];

  const id = `ai-${domain}-${nextRecord.record.id}`;
  const actionLabel =
    route === "/vehicles"
      ? "פתח רכבים"
      : route === "/health"
        ? "פתח בריאות"
        : "פתח מסמכים";

  return [
    {
      id,
      domain,
      title: nextRecord.record.title,
      message: `${nextRecord.record.title} ${getRelativeDayLabel(nextRecord.days) || "מתקרב"}.`,
      tone: nextRecord.days <= 3 ? "warning" : "calm",
      priority: Math.max(nextRecord.days, 0) + 10,
      targetRoute: route,
      actionLabel,
      actions: createAction(
        { id, targetRoute: route, actionLabel },
        "פתיחת האזור הרלוונטי לבדיקה ואישור פעולה."
      ),
      createdAt: now.toISOString(),
    },
  ];
}

export function getAiFamilyInsights(
  context: AiAssistantContext = {}
): AiFamilyInsight[] {
  if (typeof window === "undefined") return [];

  const now = context.now ?? new Date();
  const maxItems = context.maxItems ?? 8;
  const data = readFamilyAiData();

  return [
    ...getFinanceInsights(data, now),
    ...getEventInsights(data, now),
    ...getTaskInsights(data, now),
    ...getShoppingInsights(data, now),
    ...getModuleRecordInsights(data.vehicleRecords, "/vehicles", "vehicles", now),
    ...getModuleRecordInsights(data.healthRecords, "/health", "health", now),
    ...getModuleRecordInsights(data.documentRecords, "/documents", "documents", now),
  ]
    .sort((first, second) => first.priority - second.priority)
    .slice(0, maxItems);
}

export function getAiDailyBriefing(
  context: AiAssistantContext = {}
): AiDailyBriefing {
  const now = context.now ?? new Date();
  const items = getAiFamilyInsights({
    ...context,
    now,
    maxItems: context.maxItems ?? 5,
  });

  return {
    greeting: "בוקר טוב. הנה מה שחשוב למשפחה היום.",
    items,
    suggestion: items.find((item) => item.tone !== "calm") ?? items[0] ?? null,
    mode: "local-rules",
    provider: "local",
  };
}
