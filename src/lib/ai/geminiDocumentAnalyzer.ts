import { getSuggestedActions } from "@/lib/ai/mockDocumentAnalyzer";
import { parseStructuredJson } from "@/lib/ai/parsers/structured-output.parser";
import type {
  DocumentAnalysisInput,
  DocumentAnalysisResult,
  ExtractedDocumentData,
} from "@/types/documentAnalysis";

// מנתח מסמכים אמיתי מבוסס Gemini — רץ בשרת בלבד. המפתח לעולם לא מגיע ללקוח.
// קריאה ישירה ל-REST API של Google, ללא תלות בחבילה חיצונית.

const geminiApiBase = "https://generativelanguage.googleapis.com/v1beta/models";
const analysisTimeoutMs = 45_000;

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
}

const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const systemPrompt = [
  "אתה מנוע ניתוח מסמכים של Nestly — מערכת הפעלה משפחתית.",
  "המשתמש סורק מסמכים משפחתיים בעברית (חשבונות, קבלות, מסמכים רפואיים, ביטוחים).",
  "נתח את המסמך המצורף וחלץ את השדות המבוקשים בדיוק מרבי.",
  "אל תמציא ערכים: אם שדה לא מופיע במסמך החזר מחרוזת ריקה (או 0 לסכום).",
  "תאריכים תמיד בפורמט YYYY-MM-DD. הסיכום תמיד בעברית, ידידותי וקצר.",
  "החזר JSON בלבד, ללא טקסט נוסף.",
].join(" ");

const extractionPrompt = `
החזר JSON במבנה הבא בדיוק:
{
  "documentType": "סוג המסמך בעברית, למשל: חשבון חשמל, קבלה, פוליסת ביטוח, הפניה רפואית",
  "providerName": "שם הספק/הארגון שהנפיק את המסמך, או מחרוזת ריקה",
  "issueDate": "תאריך הנפקה YYYY-MM-DD או מחרוזת ריקה",
  "dueDate": "תאריך אחרון לתשלום/תוקף YYYY-MM-DD או מחרוזת ריקה",
  "amount": מספר הסכום לתשלום, או 0 אם אין,
  "currency": "ILS/USD/EUR או מחרוזת ריקה",
  "accountNumber": "מספר חשבון/לקוח אם מופיע, או מחרוזת ריקה",
  "referenceNumber": "מספר אסמכתא/חשבונית אם מופיע, או מחרוזת ריקה",
  "billingPeriod": "תקופת החיוב בעברית אם מופיעה, או מחרוזת ריקה",
  "isRecurringCandidate": true אם זה חשבון שחוזר באופן קבוע (חשמל, מים, ארנונה),
  "suggestedCategory": "חשבונות / כספים / ביטוח / בריאות / רכב / חינוך / מסמכים",
  "summary": "סיכום קצר וברור בעברית (משפט או שניים) של מהות המסמך ומה כדאי לעשות",
  "tags": ["2-4 תגיות קצרות בעברית"],
  "confidence": מספר בין 0 ל-1
}`;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
};

export function hasAnalyzableGeminiFileData(input: DocumentAnalysisInput) {
  return input.files.some(
    (file) => Boolean(file.data) && supportedMimeTypes.has(file.type)
  );
}

function normalizeOptionalString(value: unknown) {
  const cleanValue = typeof value === "string" ? value.trim() : "";
  return cleanValue ? cleanValue : undefined;
}

function normalizeExtracted(raw: Partial<ExtractedDocumentData>): ExtractedDocumentData {
  const amount = typeof raw.amount === "number" ? raw.amount : Number(raw.amount);

  return {
    documentType:
      normalizeOptionalString(raw.documentType) ?? "מסמך כללי",
    providerName: normalizeOptionalString(raw.providerName),
    issueDate: normalizeOptionalString(raw.issueDate),
    dueDate: normalizeOptionalString(raw.dueDate),
    amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
    currency: normalizeOptionalString(raw.currency),
    accountNumber: normalizeOptionalString(raw.accountNumber),
    referenceNumber: normalizeOptionalString(raw.referenceNumber),
    billingPeriod: normalizeOptionalString(raw.billingPeriod),
    isRecurringCandidate: raw.isRecurringCandidate === true,
    suggestedCategory:
      normalizeOptionalString(raw.suggestedCategory) ?? "מסמכים",
    summary:
      normalizeOptionalString(raw.summary) ??
      "המסמך נותח. מומלץ לעבור על השדות לפני שמירה.",
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6)
      : [],
    confidence:
      typeof raw.confidence === "number" &&
      raw.confidence >= 0 &&
      raw.confidence <= 1
        ? raw.confidence
        : 0.5,
  };
}

function buildUserParts(input: DocumentAnalysisInput) {
  const parts: Array<Record<string, unknown>> = [];

  for (const file of input.files) {
    if (file.data && supportedMimeTypes.has(file.type)) {
      parts.push({
        inline_data: { mime_type: file.type, data: file.data },
      });
    }
  }

  const contextLines = [
    extractionPrompt,
    input.title?.trim() ? `כותרת שהמשתמש נתן: ${input.title.trim()}` : "",
    input.description?.trim() ? `תיאור: ${input.description.trim()}` : "",
    input.files.length
      ? `שמות קבצים: ${input.files.map((file) => file.name).join(", ")}`
      : "",
    "נתח את המסמך וחלץ את השדות.",
  ].filter(Boolean);

  parts.push({ text: contextLines.join("\n") });

  return parts;
}

export async function analyzeDocumentWithGemini(
  input: DocumentAnalysisInput,
  apiKey: string
): Promise<DocumentAnalysisResult> {
  const model = getGeminiModel();

  const response = await fetch(`${geminiApiBase}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: buildUserParts(input) }],
      generationConfig: { response_mime_type: "application/json" },
    }),
    signal: AbortSignal.timeout(analysisTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`gemini-request-failed-${response.status}`);
  }

  const payload = (await response.json()) as GeminiResponse;

  if (payload.promptFeedback?.blockReason) {
    throw new Error("analysis-refused");
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("empty-analysis-response");
  }

  const extracted = normalizeExtracted(
    parseStructuredJson(text) as Partial<ExtractedDocumentData>
  );

  return {
    provider: "gemini",
    mode: "live",
    extracted,
    suggestedActions: getSuggestedActions(extracted),
    warnings: ["הניתוח בוצע על ידי AI — יש לאמת את השדות לפני אישור."],
    rawTextPreview: undefined,
  };
}
