import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import { createKnowledgeItem } from "@/services/familyKnowledge";
import type {
  CaptureSource,
  CaptureSuggestion,
  CaptureSuggestionType,
  SmartCapture,
} from "@/types/capture";
import { isSmartCapture } from "@/types/capture";
import type { AppRoute } from "@/types/navigation";
import type { ShoppingItem } from "@/types/shopping";
import { readStorageArray, writeStorage } from "@/utils/storage";
import type { FamilyTask } from "@/data/tasks";
import { createUuid } from "@/utils/ids";

export type CreateCaptureInput = {
  source: CaptureSource;
  content: string;
  title?: string;
};

export type CaptureConversionResult = {
  created: number;
  skipped: number;
};

export type ProcessedReceiptCaptureInput = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  transactionId: string;
  documentId: string;
};

const taskWords = [
  "צריך",
  "לעשות",
  "להתקשר",
  "לקבוע",
  "להזמין",
  "לבדוק",
  "לתאם",
  "task",
  "call",
  "schedule",
  "check",
  "book",
];

const shoppingWords = [
  "לקנות",
  "קנייה",
  "קניות",
  "חלב",
  "לחם",
  "ביצים",
  "סופר",
  "buy",
  "shopping",
  "milk",
  "bread",
  "eggs",
];

const healthWords = ["רופא", "תרופה", "בדיקה", "תור", "doctor", "medicine", "health"];
const vehicleWords = ["רכב", "טסט", "ביטוח", "מוסך", "car", "vehicle", "insurance"];
const documentWords = ["מסמך", "קובץ", "ביטוח", "חשבונית", "document", "file", "invoice"];
const financeWords = ["תשלום", "חשבון", "כסף", "החזר", "payment", "bill", "refund"];
const eventWords = ["יום הולדת", "אירוע", "חתונה", "אזכרה", "birthday", "event"];

function nowIso() {
  return new Date().toISOString();
}

function nextWeekIso() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function includesAny(text: string, words: string[]) {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function makeSuggestion(
  type: CaptureSuggestionType,
  title: string,
  description: string,
  confidence: number,
  href: AppRoute,
  category?: string,
  dueDate?: string
): CaptureSuggestion {
  return {
    id: createUuid(),
    type,
    title,
    description,
    confidence,
    href,
    category,
    dueDate,
    accepted: true,
    ignored: false,
  };
}

function inferTitle(content: string) {
  const firstLine = content.split(/\r?\n/).find(Boolean)?.trim() ?? "";
  return firstLine.slice(0, 64) || "Capture";
}

function splitBrainDump(content: string) {
  return content
    .split(/\n|,|;|\.| ו(?=ל|צריך|לקנות|להתקשר|לקבוע|לבדוק|להזמין)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2)
    .slice(0, 8);
}

export function analyzeCaptureContent(
  content: string,
  source: CaptureSource
): CaptureSuggestion[] {
  const parts = source === "brain_dump" ? splitBrainDump(content) : [content];
  const suggestions: CaptureSuggestion[] = [];

  if (source === "receipt_scan") {
    return [
      makeSuggestion(
        "finance_follow_up",
        inferTitle(content),
        "Receipt expense was reviewed and saved",
        0.9,
        "/finance",
        "קבלה"
      ),
      makeSuggestion(
        "document",
        inferTitle(content),
        "Receipt document metadata was saved",
        0.86,
        "/documents",
        "קבלה"
      ),
    ];
  }

  parts.forEach((part) => {
    if (source === "quick_shopping" || includesAny(part, shoppingWords)) {
      suggestions.push(
        makeSuggestion(
          "shopping",
          part.replace(/^לקנות\s+/, "").slice(0, 48),
          "Suggested shopping item",
          0.82,
          "/shopping",
          "כללי"
        )
      );
      return;
    }

    if (source === "quick_reminder") {
      suggestions.push(
        makeSuggestion(
          "reminder",
          part.slice(0, 56),
          "Suggested reminder",
          0.78,
          "/tasks",
          "תזכורת",
          nextWeekIso()
        )
      );
      return;
    }

    if (includesAny(part, healthWords)) {
      suggestions.push(
        makeSuggestion(
          "health_reminder",
          part.slice(0, 56),
          "Suggested health reminder",
          0.76,
          "/health",
          "בריאות",
          nextWeekIso()
        )
      );
      return;
    }

    if (includesAny(part, vehicleWords)) {
      suggestions.push(
        makeSuggestion(
          "vehicle_reminder",
          part.slice(0, 56),
          "Suggested vehicle reminder",
          0.76,
          "/vehicles",
          "רכב",
          nextWeekIso()
        )
      );
      return;
    }

    if (includesAny(part, financeWords)) {
      suggestions.push(
        makeSuggestion(
          "finance_follow_up",
          part.slice(0, 56),
          "Suggested finance follow-up",
          0.7,
          "/finance",
          "כספים",
          nextWeekIso()
        )
      );
      return;
    }

    if (includesAny(part, documentWords)) {
      suggestions.push(
        makeSuggestion(
          "document",
          part.slice(0, 56),
          "Suggested document to organize",
          0.68,
          "/documents",
          "מסמכים"
        )
      );
      return;
    }

    if (includesAny(part, eventWords)) {
      suggestions.push(
        makeSuggestion(
          "family_event",
          part.slice(0, 56),
          "Suggested family event",
          0.68,
          "/birthdays",
          "אירועים",
          nextWeekIso()
        )
      );
      return;
    }

    if (includesAny(part, taskWords) || source === "quick_task") {
      suggestions.push(
        makeSuggestion(
          "task",
          part.slice(0, 56),
          "Suggested task",
          0.74,
          "/tasks",
          "כללי",
          nextWeekIso()
        )
      );
    }
  });

  if (suggestions.length === 0 && content.trim()) {
    suggestions.push(
      makeSuggestion(
        "family_knowledge",
        inferTitle(content),
        "Saved as family knowledge for later search",
        0.55,
        "/documents",
        "ידע משפחתי"
      )
    );
  }

  return suggestions.slice(0, 6);
}

export function readCaptures() {
  return readStorageArray<SmartCapture>(
    storageKeys.smartCaptures,
    [],
    isSmartCapture
  ).sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export function writeCaptures(captures: SmartCapture[]) {
  return writeStorage(storageKeys.smartCaptures, captures);
}

export function createCapture(input: CreateCaptureInput) {
  const timestamp = nowIso();
  const capture: SmartCapture = {
    id: createUuid(),
    source: input.source,
    title: input.title?.trim() || inferTitle(input.content),
    content: input.content.trim(),
    status: "new",
    createdAt: timestamp,
    updatedAt: timestamp,
    suggestions: analyzeCaptureContent(input.content, input.source),
  };

  writeCaptures([capture, ...readCaptures()]);
  return capture;
}

export function updateCapture(updatedCapture: SmartCapture) {
  const captures = readCaptures().map((capture) =>
    capture.id === updatedCapture.id
      ? { ...updatedCapture, updatedAt: nowIso() }
      : capture
  );
  writeCaptures(captures);
}

export function createProcessedReceiptCapture(input: ProcessedReceiptCaptureInput) {
  const amountLabel = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(input.amount);
  const capture = createCapture({
    source: "receipt_scan",
    title: `קבלה · ${input.merchant}`,
    content: [
      `קבלה שאושרה מ-${input.merchant}`,
      `סכום: ${amountLabel}`,
      `תאריך: ${input.date}`,
      `קטגוריה: ${input.category}`,
      `פעולה בכספים: ${input.transactionId}`,
      `מסמך: ${input.documentId}`,
    ].join("\n"),
  });
  const convertedCapture: SmartCapture = {
    ...capture,
    status: "converted",
    suggestions: capture.suggestions.map((suggestion) => ({
      ...suggestion,
      accepted: true,
      ignored: false,
    })),
  };
  updateCapture(convertedCapture);
  return convertedCapture;
}

function suggestionToTask(suggestion: CaptureSuggestion): FamilyTask {
  return {
    id: `capture-task-${createUuid()}`,
    title: suggestion.title,
    description: suggestion.description ?? "",
    owner: "הבית",
    category: suggestion.category ?? "כללי",
    priority: "medium",
    status: "open",
    dueDate: suggestion.dueDate ?? nextWeekIso(),
  };
}

function suggestionToShoppingItem(suggestion: CaptureSuggestion): ShoppingItem {
  return {
    id: `capture-shopping-${createUuid()}`,
    listName: "רשימת קניות",
    title: suggestion.title,
    quantity: "1",
    department: suggestion.category ?? "כללי",
    estimatedPrice: 0,
    buyer: "הבית",
    notes: suggestion.description ?? "",
    purchased: false,
  };
}

export function convertCapture(capture: SmartCapture): CaptureConversionResult {
  const acceptedSuggestions = capture.suggestions.filter(
    (suggestion) => suggestion.accepted && !suggestion.ignored
  );
  let created = 0;
  let skipped = 0;

  acceptedSuggestions.forEach((suggestion) => {
    if (suggestion.type === "task" || suggestion.type === "reminder") {
      const tasks = readStorageArray(storageKeys.tasks, initialFamilyTasks);
      writeStorage(storageKeys.tasks, [suggestionToTask(suggestion), ...tasks]);
      created += 1;
      return;
    }

    if (suggestion.type === "shopping") {
      const items = readStorageArray(storageKeys.shopping, initialShoppingItems);
      writeStorage(storageKeys.shopping, [suggestionToShoppingItem(suggestion), ...items]);
      created += 1;
      return;
    }

    if (suggestion.type === "family_knowledge") {
      createKnowledgeItem({
        title: suggestion.title,
        content: capture.content,
        category: suggestion.category ?? "אחר",
        tags: [suggestion.category ?? "ידע משפחתי"],
        linkedModule: "general",
        sourceNoteId: capture.id,
      });
      created += 1;
      return;
    }

    skipped += 1;
  });

  updateCapture({
    ...capture,
    status: created > 0 ? "converted" : "reviewed",
    suggestions: capture.suggestions,
  });

  return { created, skipped };
}
