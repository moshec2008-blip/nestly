import Anthropic from "@anthropic-ai/sdk";
import { getSuggestedActions } from "@/lib/ai/mockDocumentAnalyzer";
import type {
  DocumentAnalysisInput,
  DocumentAnalysisResult,
  ExtractedDocumentData,
} from "@/types/documentAnalysis";

// מנתח מסמכים אמיתי — רץ בשרת בלבד (route handler). המפתח לעולם לא מגיע ללקוח.

const analysisModel = "claude-opus-4-8";

type SupportedImageType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const supportedImageTypes = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function isSupportedImageType(value: string): value is SupportedImageType {
  return supportedImageTypes.has(value);
}

// סכימה ל-structured outputs: כל השדות חובה, ערכים ריקים מסמנים "לא זוהה"
// (איחודי טיפוסים ואילוצי טווח אינם נתמכים בסכימת הפלט).
const extractionSchema = {
  type: "object",
  properties: {
    documentType: {
      type: "string",
      description: "סוג המסמך בעברית, למשל: חשבון חשמל, קבלה, פוליסת ביטוח, הפניה רפואית",
    },
    providerName: {
      type: "string",
      description: "שם הספק/הארגון שהנפיק את המסמך, או מחרוזת ריקה אם לא זוהה",
    },
    issueDate: {
      type: "string",
      description: "תאריך הנפקה בפורמט YYYY-MM-DD, או מחרוזת ריקה",
    },
    dueDate: {
      type: "string",
      description: "תאריך אחרון לתשלום/תוקף בפורמט YYYY-MM-DD, או מחרוזת ריקה",
    },
    amount: {
      type: "number",
      description: "הסכום לתשלום במסמך, או 0 אם אין סכום",
    },
    currency: {
      type: "string",
      description: "קוד מטבע כגון ILS/USD/EUR, או מחרוזת ריקה",
    },
    accountNumber: {
      type: "string",
      description: "מספר חשבון/לקוח אם מופיע, או מחרוזת ריקה",
    },
    referenceNumber: {
      type: "string",
      description: "מספר אסמכתא/חשבונית אם מופיע, או מחרוזת ריקה",
    },
    billingPeriod: {
      type: "string",
      description: "תקופת החיוב בעברית אם מופיעה, או מחרוזת ריקה",
    },
    isRecurringCandidate: {
      type: "boolean",
      description: "האם זה חשבון שסביר שחוזר באופן קבוע (חשמל, מים, ארנונה וכו')",
    },
    suggestedCategory: {
      type: "string",
      description: "קטגוריה מוצעת בעברית: חשבונות / כספים / ביטוח / בריאות / רכב / חינוך / מסמכים",
    },
    summary: {
      type: "string",
      description: "סיכום קצר וברור בעברית (משפט או שניים) של מהות המסמך ומה כדאי לעשות",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "2-4 תגיות קצרות בעברית",
    },
    confidence: {
      type: "number",
      description: "רמת ביטחון בניתוח בין 0 ל-1",
    },
  },
  required: [
    "documentType",
    "providerName",
    "issueDate",
    "dueDate",
    "amount",
    "currency",
    "accountNumber",
    "referenceNumber",
    "billingPeriod",
    "isRecurringCandidate",
    "suggestedCategory",
    "summary",
    "tags",
    "confidence",
  ],
  additionalProperties: false,
} as const;

const systemPrompt = [
  "אתה מנוע ניתוח מסמכים של Nestly — מערכת הפעלה משפחתית.",
  "המשתמש סורק מסמכים משפחתיים בעברית (חשבונות, קבלות, מסמכים רפואיים, ביטוחים).",
  "נתח את המסמך המצורף וחלץ את השדות המבוקשים בדיוק מרבי.",
  "אל תמציא ערכים: אם שדה לא מופיע במסמך החזר מחרוזת ריקה (או 0 לסכום).",
  "תאריכים תמיד בפורמט YYYY-MM-DD. הסיכום תמיד בעברית, ידידותי וקצר.",
].join(" ");

function normalizeOptionalString(value: string) {
  const cleanValue = value.trim();
  return cleanValue ? cleanValue : undefined;
}

function normalizeExtracted(raw: ExtractedDocumentData): ExtractedDocumentData {
  return {
    documentType: raw.documentType.trim() || "מסמך כללי",
    providerName: normalizeOptionalString(raw.providerName ?? ""),
    issueDate: normalizeOptionalString(raw.issueDate ?? ""),
    dueDate: normalizeOptionalString(raw.dueDate ?? ""),
    amount:
      typeof raw.amount === "number" && Number.isFinite(raw.amount) && raw.amount > 0
        ? raw.amount
        : undefined,
    currency: normalizeOptionalString(raw.currency ?? ""),
    accountNumber: normalizeOptionalString(raw.accountNumber ?? ""),
    referenceNumber: normalizeOptionalString(raw.referenceNumber ?? ""),
    billingPeriod: normalizeOptionalString(raw.billingPeriod ?? ""),
    isRecurringCandidate: raw.isRecurringCandidate === true,
    suggestedCategory: raw.suggestedCategory.trim() || "מסמכים",
    summary: raw.summary.trim() || "המסמך נותח. מומלץ לעבור על השדות לפני שמירה.",
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6)
      : [],
    confidence:
      typeof raw.confidence === "number" && raw.confidence >= 0 && raw.confidence <= 1
        ? raw.confidence
        : 0.5,
  };
}

function buildUserContent(
  input: DocumentAnalysisInput
): Anthropic.Messages.ContentBlockParam[] {
  const blocks: Anthropic.Messages.ContentBlockParam[] = [];

  for (const file of input.files) {
    if (!file.data) {
      continue;
    }

    if (isSupportedImageType(file.type)) {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: file.type, data: file.data },
      });
    } else if (file.type === "application/pdf") {
      blocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: file.data,
        },
      });
    }
  }

  const contextLines = [
    input.title?.trim() ? `כותרת שהמשתמש נתן: ${input.title.trim()}` : "",
    input.description?.trim() ? `תיאור: ${input.description.trim()}` : "",
    input.files.length
      ? `שמות קבצים: ${input.files.map((file) => file.name).join(", ")}`
      : "",
    "נתח את המסמך וחלץ את השדות.",
  ].filter(Boolean);

  blocks.push({ type: "text", text: contextLines.join("\n") });

  return blocks;
}

export function hasAnalyzableFileData(input: DocumentAnalysisInput) {
  return input.files.some(
    (file) =>
      Boolean(file.data) &&
      (isSupportedImageType(file.type) || file.type === "application/pdf")
  );
}

export async function analyzeDocumentWithAnthropic(
  input: DocumentAnalysisInput,
  apiKey: string
): Promise<DocumentAnalysisResult> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: analysisModel,
    max_tokens: 2048,
    system: systemPrompt,
    output_config: {
      format: {
        type: "json_schema",
        schema: extractionSchema,
      },
    },
    messages: [
      {
        role: "user",
        content: buildUserContent(input),
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("analysis-refused");
  }

  const textBlock = response.content.find((block) => block.type === "text");

  if (!textBlock || textBlock.type !== "text") {
    throw new Error("empty-analysis-response");
  }

  const extracted = normalizeExtracted(
    JSON.parse(textBlock.text) as ExtractedDocumentData
  );

  return {
    provider: "anthropic",
    mode: "live",
    extracted,
    suggestedActions: getSuggestedActions(extracted),
    warnings: ["הניתוח בוצע על ידי AI — יש לאמת את השדות לפני אישור."],
    rawTextPreview: undefined,
  };
}
