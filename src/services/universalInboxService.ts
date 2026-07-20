import { initialFinanceTransactions } from "@/data/finance";
import { initialDocumentRecords, initialVehicleRecords } from "@/data/modules";
import { initialShoppingItems } from "@/data/shopping";
import { initialFamilyTasks, type FamilyTask } from "@/data/tasks";
import { storageKeys } from "@/lib/storageKeys";
import { createRelation } from "@/services/entityRelationsService";
import { createKnowledgeItem } from "@/services/familyKnowledge";
import { getActiveLifeEvents } from "@/services/lifeEventsService";
import { createCustomTimelineItem } from "@/services/timelineService";
import type { FinanceTransaction } from "@/data/finance";
import type { ModuleRecord } from "@/types/modules";
import type { ShoppingItem } from "@/types/shopping";
import {
  isUniversalInboxItem,
  type UniversalInboxActionType,
  type UniversalInboxClassification,
  type UniversalInboxDetectedEntity,
  type UniversalInboxFile,
  type UniversalInboxInputSource,
  type UniversalInboxItem,
  type UniversalInboxRelationshipSuggestion,
  type UniversalInboxSuggestedAction,
} from "@/types/universalInbox";
import { readStorageArray, writeStorage } from "@/utils/storage";
import { createUuid } from "@/utils/ids";
import { nowIso } from "@/utils/dateTime";

export type UniversalInboxCreateInput = {
  source: UniversalInboxInputSource;
  text: string;
  files?: UniversalInboxFile[];
};

export type UniversalInboxSaveResult = {
  created: number;
  relationships: number;
  skipped: number;
};

const stageLabels = {
  receive: "קלט התקבל",
  normalize: "נרמול",
  extract: "חילוץ מידע",
  classify: "סיווג AI",
  detect_entities: "זיהוי ישויות",
  suggest_relationships: "הצעת קשרים",
  plan_actions: "תכנון פעולות",
  review: "ממתין לאישור",
  persist: "שמירה",
} as const;

const classificationKeywords: Record<
  UniversalInboxClassification,
  string[]
> = {
  receipt: ["קבלה", "receipt", "סהכ", "total", "איקאה", "ikea"],
  document: ["מסמך", "document", "pdf", "פוליסה", "קובץ"],
  invoice: ["חשבונית", "invoice"],
  warranty: ["אחריות", "warranty"],
  medical: ["רופא", "בדיקה", "תרופה", "medical", "doctor"],
  shopping: ["לקנות", "קניות", "חלב", "shopping", "buy", "ikea"],
  task: ["צריך", "לעשות", "לקבוע", "לבדוק", "task", "todo"],
  reminder: ["תזכורת", "להזכיר", "מחר", "שבוע הבא", "reminder"],
  vehicle: ["רכב", "טסט", "מוסך", "ביטוח רכב", "car", "vehicle"],
  property: ["דירה", "בית", "מטבח", "שיפוץ", "property", "renovation"],
  finance: ["תשלום", "כסף", "תקציב", "הוצאה", "finance", "payment"],
  note: ["פתק", "note", "רעיון"],
  photo: ["תמונה", "צילום", "photo", "image", "jpg", "png"],
  unknown: [],
};

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${createUuid()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function nextWeekIso() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function inferTitle(text: string, files: UniversalInboxFile[]) {
  const firstLine = text.split(/\r?\n/).find(Boolean)?.trim();
  if (firstLine) {
    return firstLine.slice(0, 72);
  }

  return files[0]?.name ?? "פריט חדש";
}

function normalizeText(text: string, files: UniversalInboxFile[]) {
  const fileText = files
    .map((file) => `${file.name} ${file.type}`.trim())
    .filter(Boolean)
    .join("\n");

  return [text.trim(), fileText].filter(Boolean).join("\n").replace(/\s+/g, " ");
}

function summarize(text: string, files: UniversalInboxFile[]) {
  if (text.trim()) {
    return text.trim().replace(/\s+/g, " ").slice(0, 180);
  }

  if (files.length > 0) {
    return `${files.length} קבצים התקבלו לבדיקה: ${files
      .map((file) => file.name)
      .slice(0, 3)
      .join(", ")}`;
  }

  return "מידע חדש ממתין לסיווג.";
}

function classify(
  normalizedText: string,
  files: UniversalInboxFile[]
): UniversalInboxItem["classifications"] {
  const fileSignals = files.map((file) => `${file.name} ${file.type}`).join(" ");
  const haystack = `${normalizedText} ${fileSignals}`;
  const classifications = Object.entries(classificationKeywords)
    .filter(([type]) => type !== "unknown")
    .map(([type, keywords]) => {
      const matches = keywords.filter((keyword) =>
        haystack.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      const fileBoost =
        type === "document" && files.some((file) => file.type.includes("pdf"))
          ? 0.14
          : 0;

      return {
        type: type as UniversalInboxClassification,
        confidence: Math.min(0.52 + matches * 0.13 + fileBoost, 0.96),
        explanation:
          matches > 0
            ? "נמצאו מילים ודפוסים שמתאימים לסוג הזה."
            : "זוהה לפי מאפייני הקובץ או ההקשר.",
      };
    })
    .filter((classification) => classification.confidence >= 0.64)
    .sort((a, b) => b.confidence - a.confidence);

  return classifications.length > 0
    ? classifications.slice(0, 4)
    : [
        {
          type: "unknown",
          confidence: 0.42,
          explanation: "אין מספיק סימנים ברורים. עדיף לשמור כפתק לבדיקה.",
        },
      ];
}

function detectAmount(text: string) {
  const match = text.match(/(?:₪|ils|nis)?\s*(\d{2,6})(?:[.,](\d{1,2}))?/i);
  if (!match) {
    return null;
  }

  return Number(`${match[1]}.${match[2] ?? "0"}`);
}

function detectEntities(
  text: string,
  classifications: UniversalInboxItem["classifications"]
): UniversalInboxDetectedEntity[] {
  const entities: UniversalInboxDetectedEntity[] = [];
  const activeLifeEvent = getActiveLifeEvents().find((event) =>
    event.tags.some((tag) => text.toLowerCase().includes(tag.toLowerCase()))
  );

  if (activeLifeEvent) {
    entities.push({
      id: `life-${activeLifeEvent.id}`,
      entityType: "life_event",
      entityId: activeLifeEvent.id,
      label: activeLifeEvent.title,
      description: "סיפור חיים פעיל שנראה קשור למידע הזה.",
      confidence: 0.84,
      duplicateRisk: "low",
      href: "/life",
    });
  }

  if (
    classifications.some((classification) => classification.type === "vehicle")
  ) {
    const vehicleRecord = initialVehicleRecords[0];
    entities.push({
      id: `vehicle-${vehicleRecord.id}`,
      entityType: "vehicle_reminder",
      entityId: vehicleRecord.id,
      label: vehicleRecord.title,
      description: "זוהה הקשר לרכב או לתזכורת רכב קיימת.",
      confidence: 0.78,
      duplicateRisk: "medium",
      href: "/vehicles",
    });
  }

  if (text.toLowerCase().includes("ikea") || text.includes("איקאה")) {
    entities.push({
      id: "org-ikea",
      entityType: "custom_record",
      label: "IKEA",
      description: "ארגון/חנות שזוהה מתוך הטקסט או שם הקובץ.",
      confidence: 0.88,
      duplicateRisk: "medium",
    });
  }

  return entities;
}

function planRelationships(
  inboxItemId: string,
  entities: UniversalInboxDetectedEntity[]
): UniversalInboxRelationshipSuggestion[] {
  return entities
    .filter((entity) => entity.entityType === "life_event" && entity.entityId)
    .map((entity) => ({
      id: makeId("inbox-relation"),
      sourceEntityType: "life_event",
      sourceEntityId: entity.entityId as string,
      targetEntityType: "smart_inbox_item",
      targetEntityId: inboxItemId,
      relationshipType: "part_of_life_event",
      title: `לשייך אל ${entity.label}`,
      reason: "המידע החדש כולל מילים שמתאימות לסיפור חיים פעיל.",
      confidence: entity.confidence,
      accepted: entity.confidence >= 0.8,
    }));
}

function makeAction(
  type: UniversalInboxActionType,
  title: string,
  description: string,
  href: UniversalInboxSuggestedAction["href"],
  confidence: number,
  explanation: string,
  fields: UniversalInboxSuggestedAction["fields"] = {}
): UniversalInboxSuggestedAction {
  return {
    id: makeId("inbox-action"),
    type,
    title,
    description,
    href,
    confidence,
    explanation,
    fields,
    accepted: confidence >= 0.68,
  };
}

function planActions(
  itemTitle: string,
  text: string,
  classifications: UniversalInboxItem["classifications"],
  files: UniversalInboxFile[],
  relationships: UniversalInboxRelationshipSuggestion[]
) {
  const types = new Set(classifications.map((classification) => classification.type));
  const actions: UniversalInboxSuggestedAction[] = [];
  const amount = detectAmount(text);

  if (types.has("task") || types.has("reminder")) {
    actions.push(
      makeAction(
        types.has("reminder") ? "create_reminder" : "create_task",
        itemTitle,
        "יצירת משימה או תזכורת מתוך המידע.",
        "/tasks",
        0.82,
        "יש ניסוח של פעולה עתידית או משהו שצריך לחזור אליו.",
        { dueDate: nextWeekIso(), category: "כללי" }
      )
    );
  }

  if (types.has("shopping")) {
    actions.push(
      makeAction(
        "add_shopping_item",
        itemTitle,
        "הוספת פריט לרשימת הקניות.",
        "/shopping",
        0.78,
        "זוהה ניסוח של קנייה או שם חנות.",
        { quantity: "1", department: "כללי" }
      )
    );
  }

  if (types.has("receipt") || types.has("invoice") || types.has("finance")) {
    actions.push(
      makeAction(
        "add_transaction",
        itemTitle,
        "יצירת פעולה כספית לבדיקה.",
        "/finance",
        amount ? 0.8 : 0.62,
        amount
          ? "נמצא סכום שנראה כמו הוצאה או חשבונית."
          : "יש סימנים כספיים, אבל חסר סכום ברור.",
        { amount: amount ?? 0, category: "כללי" }
      )
    );
  }

  if (
    types.has("document") ||
    types.has("invoice") ||
    types.has("warranty") ||
    types.has("medical") ||
    files.length > 0
  ) {
    actions.push(
      makeAction(
        "store_document",
        itemTitle,
        "שמירה כפריט במרכז המסמכים.",
        "/documents",
        files.length > 0 ? 0.86 : 0.72,
        "קיים קובץ או סימנים למסמך שצריך תיוק.",
        { category: types.has("medical") ? "בריאות" : "מסמכים" }
      )
    );
  }

  relationships.forEach((relationship) => {
    actions.push(
      makeAction(
        "attach_to_life_event",
        relationship.title,
        "חיבור הפריט לסיפור חיים קיים.",
        "/life",
        relationship.confidence,
        relationship.reason,
        { relationshipId: relationship.id }
      )
    );
  });

  if (actions.length === 0 || types.has("note") || types.has("unknown")) {
    actions.push(
      makeAction(
        "save_as_knowledge",
        itemTitle,
        "שמירה כידע משפחתי לחיפוש עתידי.",
        "/knowledge",
        0.64,
        "אין יעד ברור יותר, אז עדיף לשמור בזיכרון המשפחתי ולא לאבד.",
        { category: "כללי" }
      )
    );
  }

  return actions.slice(0, 6);
}

function createStages(): UniversalInboxItem["stages"] {
  return (
    [
      "receive",
      "normalize",
      "extract",
      "classify",
      "detect_entities",
      "suggest_relationships",
      "plan_actions",
      "review",
      "persist",
    ] as const
  ).map((id) => ({
    id,
    label: stageLabels[id],
    status: id === "review" ? "needs_review" : id === "persist" ? "pending" : "complete",
    detail:
      id === "review"
        ? "שום דבר לא נשמר עד אישור המשתמש."
        : id === "persist"
          ? "יופעל רק אחרי אישור."
          : "הושלם בצינור האחיד.",
  }));
}

export function readUniversalInboxItems() {
  return readStorageArray<UniversalInboxItem>(
    storageKeys.universalInbox,
    [],
    isUniversalInboxItem
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function writeUniversalInboxItems(items: UniversalInboxItem[]) {
  return writeStorage(storageKeys.universalInbox, items);
}

export function createUniversalInboxItem(
  input: UniversalInboxCreateInput
): UniversalInboxItem {
  const timestamp = nowIso();
  const files = input.files ?? [];
  const normalizedText = normalizeText(input.text, files);
  const classifications = classify(normalizedText, files);
  const entities = detectEntities(normalizedText, classifications);
  const id = makeId("universal-inbox");
  const relationships = planRelationships(id, entities);
  const title = inferTitle(input.text || normalizedText, files);
  const item: UniversalInboxItem = {
    id,
    source: input.source,
    title,
    rawText: input.text,
    normalizedText,
    files,
    summary: summarize(input.text, files),
    classifications,
    entities,
    relationships,
    actions: planActions(title, normalizedText, classifications, files, relationships),
    stages: createStages(),
    status: "new",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeUniversalInboxItems([item, ...readUniversalInboxItems()]);
  return item;
}

export function updateUniversalInboxItem(updatedItem: UniversalInboxItem) {
  const items = readUniversalInboxItems().map((item) =>
    item.id === updatedItem.id ? { ...updatedItem, updatedAt: nowIso() } : item
  );

  writeUniversalInboxItems(items);
}

function saveTask(action: UniversalInboxSuggestedAction, item: UniversalInboxItem) {
  const tasks = readStorageArray<FamilyTask>(storageKeys.tasks, initialFamilyTasks);
  const task: FamilyTask = {
    id: makeId("inbox-task"),
    title: action.title,
    description: item.summary,
    owner: "הבית",
    category: String(action.fields.category ?? "כללי"),
    priority: "medium",
    status: "open",
    dueDate: String(action.fields.dueDate ?? nextWeekIso()),
  };

  writeStorage(storageKeys.tasks, [task, ...tasks]);
  return task.id;
}

function saveShoppingItem(action: UniversalInboxSuggestedAction, item: UniversalInboxItem) {
  const items = readStorageArray<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  );
  const shoppingItem: ShoppingItem = {
    id: makeId("inbox-shopping"),
    listName: "רשימת קניות",
    title: action.title,
    quantity: String(action.fields.quantity ?? "1"),
    department: String(action.fields.department ?? "כללי"),
    estimatedPrice: 0,
    buyer: "הבית",
    notes: item.summary,
    purchased: false,
  };

  writeStorage(storageKeys.shopping, [shoppingItem, ...items]);
  return shoppingItem.id;
}

function saveDocument(action: UniversalInboxSuggestedAction, item: UniversalInboxItem) {
  const documents = readStorageArray<ModuleRecord>(
    storageKeys.documents,
    initialDocumentRecords
  );
  const document: ModuleRecord = {
    id: makeId("inbox-document"),
    title: action.title,
    description: item.summary,
    owner: "הבית",
    category: String(action.fields.category ?? "מסמכים"),
    date: new Date().toISOString().slice(0, 10),
    status: "open",
  };

  writeStorage(storageKeys.documents, [document, ...documents]);
  return document.id;
}

function saveFinanceTransaction(
  action: UniversalInboxSuggestedAction,
  item: UniversalInboxItem
) {
  const transactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    initialFinanceTransactions
  );
  const amount =
    typeof action.fields.amount === "number" && action.fields.amount > 0
      ? action.fields.amount
      : 1;
  const transaction: FinanceTransaction = {
    id: makeId("inbox-finance"),
    title: action.title,
    category: String(action.fields.category ?? "כללי"),
    amount,
    type: "expense",
    date: new Date().toISOString().slice(0, 10),
    status: "pending",
    notes: item.summary,
  };

  writeStorage(storageKeys.finance, [transaction, ...transactions]);
  return transaction.id;
}

function saveKnowledge(action: UniversalInboxSuggestedAction, item: UniversalInboxItem) {
  return createKnowledgeItem({
    title: action.title,
    content: item.rawText || item.summary,
    category: String(action.fields.category ?? "כללי"),
    tags: item.classifications.map((classification) => classification.type),
    linkedModule: "general",
    sourceNoteId: item.id,
  }).id;
}

export function confirmUniversalInboxItem(
  item: UniversalInboxItem
): UniversalInboxSaveResult {
  let created = 0;
  let relationships = 0;
  let skipped = 0;

  const acceptedActions = item.actions.filter((action) => action.accepted);
  const savedActions = acceptedActions.map((action) => {
    let savedEntityId: string | undefined;

    if (action.type === "create_task" || action.type === "create_reminder") {
      savedEntityId = saveTask(action, item);
      created += 1;
    } else if (action.type === "add_shopping_item") {
      savedEntityId = saveShoppingItem(action, item);
      created += 1;
    } else if (action.type === "store_document") {
      savedEntityId = saveDocument(action, item);
      created += 1;
    } else if (action.type === "add_transaction") {
      savedEntityId = saveFinanceTransaction(action, item);
      created += 1;
    } else if (action.type === "save_as_knowledge") {
      savedEntityId = saveKnowledge(action, item);
      created += 1;
    } else if (action.type === "attach_to_life_event") {
      skipped += 1;
    } else {
      skipped += 1;
    }

    return { ...action, savedEntityId };
  });

  item.relationships
    .filter((relationship) => relationship.accepted)
    .forEach((relationship) => {
      const result = createRelation({
        sourceEntityType: relationship.sourceEntityType,
        sourceEntityId: relationship.sourceEntityId,
        targetEntityType: relationship.targetEntityType,
        targetEntityId: relationship.targetEntityId,
        relationshipType: relationship.relationshipType,
        direction: "bidirectional",
        source: "AI_suggestion",
        confidence: relationship.confidence,
        reason: relationship.reason,
        status: "active",
        visibility: "family",
        metadata: {
          universalInboxItemId: item.id,
          title: relationship.title,
        },
      });

      if (result.ok) {
        relationships += 1;
      }
    });

  createCustomTimelineItem({
    title: `נשמר דרך Universal Inbox: ${item.title}`,
    description: item.summary,
    occurredAt: nowIso(),
    sourceModule: "smart_inbox",
  });

  updateUniversalInboxItem({
    ...item,
    status: "saved",
    actions: item.actions.map((action) => {
      const savedAction = savedActions.find((candidate) => candidate.id === action.id);
      return savedAction ?? action;
    }),
    stages: item.stages.map((stage) =>
      stage.id === "persist"
        ? { ...stage, status: "complete", detail: "נשמר לאחר אישור המשתמש." }
        : stage.id === "review"
          ? { ...stage, status: "complete", detail: "המשתמש אישר את הפעולות." }
          : stage
    ),
  });

  return { created, relationships, skipped };
}
