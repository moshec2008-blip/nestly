import { readAppSettings } from "@/lib/appPreferences";
import { defaultLanguage } from "@/i18n/config";
import { createAISuggestion, getActiveAIProviderLabel } from "@/services/ai/aiOrchestrator";
import type { AISuggestion } from "@/types/aiSuggestions";

type TextSuggestionContext = {
  sourceModule: AISuggestion["sourceModule"];
  sourceEntityType: string;
  sourceEntityId: string;
  text: string;
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function detectCategory(text: string) {
  if (includesAny(text, ["רכב", "טסט", "ביטוח", "מוסך", "vehicle", "car"])) {
    return "רכב";
  }

  if (includesAny(text, ["קנייה", "לקנות", "סופר", "חלב", "לחם", "shopping"])) {
    return "קניות";
  }

  if (includesAny(text, ["תשלום", "חשבון", "כסף", "בנק", "finance", "bill"])) {
    return "כספים";
  }

  if (includesAny(text, ["רופא", "בדיקה", "תרופה", "health", "doctor"])) {
    return "בריאות";
  }

  return "כללי";
}

function detectPriority(text: string) {
  if (includesAny(text, ["דחוף", "היום", "מחר", "urgent", "today"])) {
    return "high";
  }

  if (includesAny(text, ["כשיהיה זמן", "לא דחוף", "later"])) {
    return "low";
  }

  return "medium";
}

function detectDueDate(text: string) {
  const date = new Date();

  if (includesAny(text, ["מחר", "tomorrow"])) {
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  if (includesAny(text, ["שבוע הבא", "next week"])) {
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  return null;
}

function makeSuggestionId(context: TextSuggestionContext, type: string) {
  return [
    "suggestion",
    context.sourceModule,
    context.sourceEntityType,
    context.sourceEntityId,
    type,
    normalizeText(context.text).slice(0, 36),
  ]
    .join(":")
    .replace(/\s+/g, "-");
}

function canSuggest(kind: "text" | "document" = "text") {
  if (typeof window === "undefined") {
    return false;
  }

  const settings = readAppSettings(defaultLanguage);
  if (!settings.aiSuggestionsEnabled) {
    return false;
  }

  if (kind === "text" && !settings.aiNoteAnalysis) {
    return false;
  }

  if (kind === "document" && !settings.aiDocumentAnalysis) {
    return false;
  }

  return true;
}

export function suggestTaskFields(context: TextSuggestionContext) {
  if (!canSuggest("text")) return [];

  const text = normalizeText(context.text);
  if (text.length < 4) return [];

  const providerInfo = getActiveAIProviderLabel();
  const proposedValues = {
    title: text.length > 52 ? `${text.slice(0, 49)}...` : text,
    category: detectCategory(text),
    priority: detectPriority(text),
    dueDate: detectDueDate(text),
  };

  return [
    createAISuggestion({
      id: makeSuggestionId(context, "task_fields"),
      sourceModule: context.sourceModule,
      sourceEntityType: context.sourceEntityType,
      sourceEntityId: context.sourceEntityId,
      suggestionType: "extracted_fields",
      title: "מצאנו כמה פרטים שכדאי לבדוק",
      explanation:
        "ההצעה נוצרה לפי הטקסט שהזנת. שום שינוי לא יישמר בלי אישור שלך.",
      proposedValues,
      confidence: proposedValues.dueDate ? 0.76 : 0.64,
      confidenceLevel: proposedValues.dueDate ? "medium" : "medium",
      fieldConfidence: {
        title: 0.9,
        category: 0.72,
        priority: 0.66,
        dueDate: proposedValues.dueDate ? 0.62 : 0.2,
      },
      warnings: proposedValues.dueDate ? [] : ["לא זוהה תאריך ברור."],
      missingFields: proposedValues.dueDate ? [] : ["dueDate"],
      provider: providerInfo.provider,
      metadata: {
        requestId: makeSuggestionId(context, "request"),
        reasonCode: "local_text_rules",
        locale: "he",
      },
    }),
  ];
}

export function suggestKnowledgeFields(context: TextSuggestionContext) {
  if (!canSuggest("text")) return [];

  const text = normalizeText(context.text);
  if (text.length < 8) return [];

  const providerInfo = getActiveAIProviderLabel();
  const words = text.split(" ").filter(Boolean);
  const tags = words
    .filter((word) => word.length >= 3)
    .slice(0, 4)
    .map((word) => word.replace(/[,.]/g, ""));
  const category = detectCategory(text);

  return [
    createAISuggestion({
      id: makeSuggestionId(context, "knowledge_fields"),
      sourceModule: context.sourceModule,
      sourceEntityType: context.sourceEntityType,
      sourceEntityId: context.sourceEntityId,
      suggestionType: "suggested_knowledge_item",
      title: "הצעה לסידור המידע",
      explanation:
        "אפשר להשתמש בכותרת, קטגוריה ותגיות כהתחלה, ולערוך לפני שמירה.",
      proposedValues: {
        title: text.length > 44 ? `${text.slice(0, 41)}...` : text,
        category,
        tags,
      },
      confidence: 0.68,
      confidenceLevel: "medium",
      fieldConfidence: { title: 0.76, category: 0.68, tags: 0.58 },
      warnings: [],
      missingFields: [],
      provider: providerInfo.provider,
      metadata: {
        requestId: makeSuggestionId(context, "request"),
        reasonCode: "local_knowledge_rules",
        locale: "he",
      },
    }),
  ];
}

export function parseShoppingText(context: TextSuggestionContext) {
  if (!canSuggest("text")) return [];

  const text = normalizeText(context.text);
  if (text.length < 3) return [];

  const parts = text
    .split(/[,،\n]+| ו(?=\S)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (parts.length <= 1) return [];

  const items = parts.map((part) => {
    const quantityMatch = part.match(/^(\d+)\s+(.+)$/);
    return {
      title: quantityMatch?.[2]?.trim() ?? part,
      quantity: quantityMatch?.[1] ?? "1",
    };
  });

  const providerInfo = getActiveAIProviderLabel();

  return [
    createAISuggestion({
      id: makeSuggestionId(context, "shopping_items"),
      sourceModule: context.sourceModule,
      sourceEntityType: context.sourceEntityType,
      sourceEntityId: context.sourceEntityId,
      suggestionType: "suggested_shopping_item",
      title: "אפשר להפוך את זה לכמה פריטים",
      explanation:
        "זיהינו כמה מוצרים בטקסט. אפשר להוסיף אותם בנפרד אחרי בדיקה.",
      proposedValues: { items: JSON.stringify(items) },
      confidence: 0.72,
      confidenceLevel: "medium",
      fieldConfidence: { items: 0.72 },
      warnings: [],
      missingFields: [],
      provider: providerInfo.provider,
      metadata: {
        requestId: makeSuggestionId(context, "request"),
        reasonCode: "local_shopping_split",
        locale: "he",
      },
    }),
  ];
}
