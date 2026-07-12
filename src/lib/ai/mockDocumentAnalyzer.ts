import type { DocumentAnalysisProvider } from "@/lib/ai/documentAnalysisProvider";
import type {
  DocumentAnalysisInput,
  ExtractedDocumentData,
  SuggestedDocumentAction,
} from "@/types/documentAnalysis";

function normalize(value = "") {
  return value.toLowerCase();
}

function getSearchableText(input: DocumentAnalysisInput) {
  return normalize(
    [
      input.title,
      input.description,
      ...input.files.map((file) => `${file.name} ${file.type} ${file.textPreview ?? ""}`),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getBaseTitle(input: DocumentAnalysisInput) {
  const title = input.title?.trim();
  if (title) return title;

  const firstFileName = input.files[0]?.name;
  if (!firstFileName) return "מסמך חדש";

  return firstFileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function inferExtractedData(input: DocumentAnalysisInput): ExtractedDocumentData {
  const text = getSearchableText(input);
  const title = getBaseTitle(input);

  if (
    text.includes("electric") ||
    text.includes("electricity") ||
    text.includes("iec") ||
    text.includes("חשמל")
  ) {
    return {
      documentType: "חשבון חשמל",
      providerName: "חברת החשמל",
      amount: 430,
      currency: "ILS",
      issueDate: addDays(new Date(), -5),
      dueDate: addDays(new Date(), 10),
      accountNumber: "לא זוהה במצב mock",
      referenceNumber: "MOCK-IEC-2026",
      isRecurringCandidate: true,
      billingPeriod: "החודש האחרון",
      suggestedCategory: "חשבונות",
      summary: "נראה כמו חשבון חשמל. כדאי לבדוק סכום ותאריך לתשלום לפני שמירה.",
      tags: ["חשמל", "חשבונות", "תשלום"],
      confidence: 0.82,
    };
  }

  if (text.includes("water") || text.includes("מים")) {
    return {
      documentType: "חשבון מים",
      providerName: "תאגיד מים",
      amount: 190,
      currency: "ILS",
      issueDate: addDays(new Date(), -4),
      dueDate: addDays(new Date(), 12),
      referenceNumber: "MOCK-WATER-2026",
      isRecurringCandidate: true,
      billingPeriod: "החודש האחרון",
      suggestedCategory: "חשבונות",
      summary: "נראה כמו חשבון מים עם תשלום קרוב.",
      tags: ["מים", "חשבונות", "תשלום"],
      confidence: 0.78,
    };
  }

  if (
    text.includes("insurance") ||
    text.includes("policy") ||
    text.includes("ביטוח")
  ) {
    return {
      documentType: "פוליסת ביטוח",
      providerName: "ספק ביטוח",
      issueDate: addDays(new Date(), -2),
      dueDate: addDays(new Date(), 30),
      referenceNumber: "MOCK-POLICY",
      isRecurringCandidate: true,
      suggestedCategory: "ביטוח",
      summary: "נראה כמו מסמך ביטוח. כדאי לשמור במסמכים ולהגדיר תזכורת לחידוש.",
      tags: ["ביטוח", "פוליסה", "חידוש"],
      confidence: 0.76,
    };
  }

  if (
    text.includes("invoice") ||
    text.includes("receipt") ||
    text.includes("חשבונית") ||
    text.includes("קבלה")
  ) {
    return {
      documentType: "חשבונית / קבלה",
      amount: 250,
      currency: "ILS",
      suggestedCategory: "כספים",
      summary: "נראה כמו מסמך כספי. כדאי לבדוק אם להוסיף כהוצאה.",
      tags: ["כספים", "חשבונית", "קבלה"],
      confidence: 0.72,
    };
  }

  return {
    documentType: "מסמך כללי",
    suggestedCategory: "מסמכים",
    summary: `${title} נותח במצב mock. בעת חיבור ספק AI אמיתי יופעל OCR וחילוץ שדות מלא.`,
    tags: ["מסמך", "לבדיקה"],
    confidence: input.files.length > 0 ? 0.58 : 0.42,
  };
}

export function getSuggestedActions(
  extracted: ExtractedDocumentData
): SuggestedDocumentAction[] {
  const actions: SuggestedDocumentAction[] = [
    {
      id: "save-document",
      type: "save-document",
      label: "שמירת המסמך",
      description: "לשמור את הקובץ והנתונים במודול המסמכים.",
      targetRoute: "/documents",
      enabledByDefault: true,
      requiresConfirmation: true,
    },
  ];

  if (typeof extracted.amount === "number") {
    actions.push({
      id: "add-finance-expense",
      type: "add-finance-expense",
      label: "הוספת הוצאה",
      description: `להציע הוצאה בקטגוריית ${extracted.suggestedCategory}.`,
      targetRoute: "/finance",
      enabledByDefault: false,
      requiresConfirmation: true,
    });
  }

  if (extracted.dueDate) {
    actions.push(
      {
        id: "create-payment-task",
        type: "create-payment-task",
        label: "יצירת משימת תשלום",
        description: "להכין משימה לבדיקה ותשלום לפני התאריך האחרון.",
        targetRoute: "/tasks",
        enabledByDefault: false,
        requiresConfirmation: true,
      },
      {
        id: "create-reminder",
        type: "create-reminder",
        label: "תזכורת יומיים לפני",
        description: `להציע תזכורת לפני ${extracted.dueDate}.`,
        targetRoute: "/tasks",
        enabledByDefault: false,
        requiresConfirmation: true,
      }
    );
  }

  if (extracted.isRecurringCandidate) {
    actions.push({
      id: "mark-recurring",
      type: "mark-recurring",
      label: "סימון כתשלום חוזר",
      description: "להציע מעקב עתידי לחשבון שחוזר באופן קבוע.",
      targetRoute: "/finance",
      enabledByDefault: false,
      requiresConfirmation: true,
    });
  }

  return actions;
}

export const mockDocumentAnalysisProvider: DocumentAnalysisProvider = {
  id: "mock",
  label: "Mock local analyzer",
  mode: "mock",
  async analyzeDocument(input) {
    return analyzeDocumentWithMock(input);
  },
};

export function analyzeDocumentWithMock(input: DocumentAnalysisInput) {
  const extracted = inferExtractedData(input);

  return {
    provider: "mock" as const,
    mode: "mock" as const,
    extracted,
    suggestedActions: getSuggestedActions(extracted),
    warnings: [
      "זהו ניתוח mock מקומי. יש לאמת את כל השדות לפני שמירה.",
      "לא בוצעה קריאת OCR או AI חיצונית.",
    ],
    rawTextPreview: getSearchableText(input).slice(0, 280),
  };
}
