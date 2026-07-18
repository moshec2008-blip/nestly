import type { AIProvider } from "@/lib/ai/providers/ai-provider.interface";
import type {
  AIFileInput,
  AISuggestedAction,
  AnalyzeBillInput,
  AnalyzeBillResult,
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  AnalyzeMedicalDocumentInput,
  AnalyzeMedicalDocumentResult,
  AnalyzeReceiptInput,
  AnalyzeReceiptResult,
  AnalysisType,
  BaseAnalyzeInput,
  BaseAnalyzeResult,
  FieldConfidence,
  MedicalAppointmentSuggestion,
  MedicalChecklistItem,
  MedicalTaskSuggestion,
  MoneyAmount,
  NormalizedDocumentType,
  ReceiptItem,
} from "@/lib/ai/types";
import { getAIConfig } from "@/lib/ai/config";
import { parseStructuredJson } from "@/lib/ai/parsers/structured-output.parser";
import {
  createAIError,
  getConfidenceLevel,
} from "@/lib/ai/validation/ai-response.validation";

// ספק Gemini אמיתי — רץ בשרת בלבד (route handlers). המפתח לעולם לא מגיע ללקוח.
// קריאה ישירה ל-REST API של Google, ללא תלות בחבילה חיצונית.

const geminiApiBase = "https://generativelanguage.googleapis.com/v1beta/models";

function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
}

const systemPrompt = [
  "אתה מנוע ניתוח מסמכים של Nestly — מערכת הפעלה משפחתית.",
  "המשתמש סורק מסמכים משפחתיים, לרוב בעברית (חשבונות, קבלות, מסמכים רפואיים).",
  "נתח את הקובץ המצורף וחלץ את השדות המבוקשים בדיוק מרבי.",
  "אל תמציא ערכים: שדה שלא מופיע במסמך יוחזר כ-null.",
  "תאריכים תמיד בפורמט YYYY-MM-DD. סכומים כמספרים בלבד, בלי סימני מטבע.",
  "החזר JSON בלבד, בדיוק במבנה המבוקש, ללא טקסט נוסף.",
].join(" ");

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

function buildFileParts(files: AIFileInput[]) {
  return files
    .filter((file) => Boolean(file.base64))
    .map((file) => ({
      inline_data: {
        mime_type: file.mimeType,
        data: file.base64 as string,
      },
    }));
}

export function hasAnalyzableGeminiInput(input: BaseAnalyzeInput) {
  return input.files.some((file) => Boolean(file.base64));
}

async function callGeminiJson(
  input: BaseAnalyzeInput,
  taskPrompt: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw createAIError(
      "missing_api_key",
      "חסר GEMINI_API_KEY בצד השרת. הניתוח האמיתי לא הופעל.",
      503
    );
  }

  const fileParts = buildFileParts(input.files);

  if (fileParts.length === 0) {
    throw createAIError("missing_file", "לא נמצא תוכן קובץ לניתוח.", 400);
  }

  const languageNames: Record<string, string> = {
    he: "עברית",
    en: "אנגלית",
    yi: "יידיש",
  };
  const responseLanguage =
    languageNames[input.preferredResponseLanguage] ?? "עברית";

  const contextLines = [
    taskPrompt,
    `טקסט חופשי (סיכומים, כותרות, הערות) יוחזר ב${responseLanguage}.`,
    input.text?.trim() ? `הקשר שסיפק המשתמש: ${input.text.trim()}` : "",
    `שמות קבצים: ${input.files.map((file) => file.fileName).join(", ")}`,
  ].filter(Boolean);

  const config = getAIConfig();
  const model = getGeminiModel();

  let response: Response;

  try {
    response = await fetch(`${geminiApiBase}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [...fileParts, { text: contextLines.join("\n") }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw createAIError(
        "provider_timeout",
        "הניתוח לקח יותר מדי זמן — נסו שוב.",
        504
      );
    }

    throw createAIError(
      "network_failure",
      "לא הצלחנו להתחבר לשירות הניתוח. בדקו את החיבור ונסו שוב.",
      502
    );
  }

  if (response.status === 429) {
    throw createAIError(
      "provider_rate_limited",
      "שירות הניתוח עמוס כרגע — נסו שוב בעוד דקה.",
      429
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw createAIError(
      "missing_api_key",
      "מפתח ה-Gemini שהוגדר אינו תקף. בדקו את GEMINI_API_KEY.",
      503
    );
  }

  if (!response.ok) {
    throw createAIError(
      "network_failure",
      "שירות הניתוח החזיר שגיאה. נסו שוב מאוחר יותר.",
      502
    );
  }

  const payload = (await response.json()) as GeminiResponse;

  if (payload.promptFeedback?.blockReason) {
    throw createAIError(
      "unreadable_scan",
      "לא ניתן לנתח את הקובץ הזה. נסו קובץ אחר או צילום ברור יותר.",
      422
    );
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw createAIError(
      "malformed_ai_response",
      "התקבלה תשובה ריקה משירות הניתוח. נסו שוב.",
      502
    );
  }

  try {
    const parsed = parseStructuredJson(text);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not-an-object");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw createAIError(
      "malformed_ai_response",
      "תשובת הניתוח לא הייתה תקינה. נסו שוב.",
      502
    );
  }
}

// --- נרמול הגנתי: אף שדה מהמודל לא נכנס לתוצאה בלי בדיקת טיפוס ---

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const clean = value.trim();
  return clean && clean.toLowerCase() !== "null" ? clean : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asIsoDate(value: unknown): string | undefined {
  const text = asString(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function asMoney(
  amountValue: unknown,
  currencyValue: unknown
): MoneyAmount | undefined {
  const amount = asNumber(amountValue);

  if (amount === undefined || amount <= 0) {
    return undefined;
  }

  return {
    value: amount,
    minorUnits: Math.round(amount * 100),
    currency: asString(currencyValue) || "ILS",
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
}

function asFieldConfidence(value: unknown): FieldConfidence {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: FieldConfidence = {};

  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const num = asNumber(raw);

    if (num !== undefined && num >= 0 && num <= 1) {
      result[key] = num;
    }
  }

  return result;
}

function clampConfidence(value: unknown): number {
  const num = asNumber(value);

  if (num === undefined) {
    return 0.55;
  }

  return Math.min(Math.max(num, 0), 1);
}

const knownDocumentTypes: NormalizedDocumentType[] = [
  "receipt",
  "invoice",
  "utility_bill",
  "bank_document",
  "insurance_document",
  "medical_referral",
  "appointment_document",
  "medical_result",
  "prescription",
  "vehicle_document",
  "government_document",
  "family_document",
];

function asDocumentType(value: unknown): NormalizedDocumentType {
  const text = asString(value);
  return knownDocumentTypes.includes(text as NormalizedDocumentType)
    ? (text as NormalizedDocumentType)
    : "unknown";
}

function baseLiveResult<A extends AnalysisType>(
  input: BaseAnalyzeInput,
  analysisType: A,
  raw: Record<string, unknown>
): BaseAnalyzeResult & { analysisType: A } {
  const confidence = clampConfidence(raw.confidence);

  return {
    requestId: input.requestId,
    provider: "gemini",
    mode: "live",
    analysisType,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    fieldConfidence: asFieldConfidence(raw.fieldConfidence),
    warnings: [
      {
        code: "ai-review-required",
        message: "הניתוח בוצע על ידי AI — יש לבדוק את הפרטים לפני אישור ושמירה.",
      },
    ],
    missingFields: [],
    requiresUserReview: true,
    suggestedActions: [],
    sourceMetadata: {
      fileNames: input.files.map((file) => file.fileName),
      processedAt: new Date().toISOString(),
      providerModel: getGeminiModel(),
    },
  };
}

function action(
  id: string,
  type: AISuggestedAction["type"],
  label: string,
  description: string,
  enabledByDefault: boolean,
  payload?: Record<string, unknown>
): AISuggestedAction {
  return {
    id,
    type,
    label,
    description,
    requiresConfirmation: true,
    enabledByDefault,
    payload,
  };
}

function collectMissingFields(
  fields: Record<string, unknown>
): string[] {
  return Object.entries(fields)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key);
}

const documentFieldsPrompt = `
נתח את המסמך והחזר JSON במבנה הבא בדיוק:
{
  "documentType": "אחד מ: receipt | invoice | utility_bill | bank_document | insurance_document | medical_referral | appointment_document | medical_result | prescription | vehicle_document | government_document | family_document | unknown",
  "title": "כותרת קצרה למסמך",
  "summary": "סיכום קצר של משפט או שניים: מה המסמך ומה כדאי לעשות",
  "detectedLanguage": "קוד שפת המסמך, למשל he או en",
  "date": "תאריך המסמך YYYY-MM-DD או null",
  "providerName": "שם הספק/הארגון או null",
  "referenceNumber": "מספר אסמכתא או null",
  "amount": מספר הסכום לתשלום או null,
  "currency": "ILS/USD/EUR או null",
  "dueDate": "תאריך אחרון לתשלום YYYY-MM-DD או null",
  "billingPeriodStart": "YYYY-MM-DD או null",
  "billingPeriodEnd": "YYYY-MM-DD או null",
  "billingPeriodLabel": "תיאור תקופת החיוב או null",
  "category": "קטגוריה מוצעת: חשבונות / כספים / ביטוח / בריאות / רכב / חינוך / מסמכים",
  "suggestedFolder": "שם תיקייה מוצע לתיוק",
  "confidence": מספר בין 0 ל-1,
  "fieldConfidence": { "שם שדה": מספר בין 0 ל-1 }
}`;

const receiptFieldsPrompt = `
נתח את הקבלה והחזר JSON במבנה הבא בדיוק:
{
  "merchantName": "שם בית העסק או null",
  "purchaseDate": "YYYY-MM-DD או null",
  "totalAmount": מספר הסכום הכולל או null,
  "currency": "ILS/USD/EUR או null",
  "paymentMethod": "אמצעי תשלום או null",
  "categorySuggestion": "קטגוריה מוצעת, למשל מזון",
  "items": [ { "name": "שם פריט", "quantity": מספר או null, "amount": מספר או null } ],
  "taxAmount": מספר המע\"מ או null,
  "notes": "הערה קצרה למשתמש או null",
  "confidence": מספר בין 0 ל-1,
  "fieldConfidence": { "שם שדה": מספר בין 0 ל-1 }
}`;

const billFieldsPrompt = `
נתח את החשבון והחזר JSON במבנה הבא בדיוק:
{
  "providerName": "שם הספק (חברת חשמל, תאגיד מים וכו') או null",
  "billType": "סוג החשבון, למשל חשבון חשמל",
  "amount": מספר הסכום לתשלום או null,
  "currency": "ILS/USD/EUR או null",
  "issueDate": "YYYY-MM-DD או null",
  "dueDate": "תאריך אחרון לתשלום YYYY-MM-DD או null",
  "billingPeriodStart": "YYYY-MM-DD או null",
  "billingPeriodEnd": "YYYY-MM-DD או null",
  "referenceNumber": "מספר חשבונית/אסמכתא או null",
  "accountNumberMasked": "מספר חשבון כשרק 4 ספרות אחרונות גלויות, למשל ****1234, או null",
  "paymentStatus": "unpaid או paid או unknown",
  "categorySuggestion": "קטגוריה מוצעת, למשל חשבונות",
  "confidence": מספר בין 0 ל-1,
  "fieldConfidence": { "שם שדה": מספר בין 0 ל-1 }
}`;

const medicalFieldsPrompt = `
נתח את המסמך הרפואי והחזר JSON במבנה הבא בדיוק:
{
  "documentType": "אחד מ: medical_referral | appointment_document | medical_result | prescription | unknown",
  "doctorName": "שם הרופא או null",
  "providerOrganization": "קופת חולים / בית חולים / מכון או null",
  "patientName": "שם המטופל או null",
  "documentDate": "YYYY-MM-DD או null",
  "appointmentDate": "תאריך תור YYYY-MM-DD או null",
  "referralNumber": "מספר הפניה או null",
  "specialty": "תחום רפואי או null",
  "requestedTests": ["בדיקות מבוקשות"],
  "requiredDocuments": ["מסמכים שצריך להביא"],
  "preparationInstructions": ["הוראות הכנה"],
  "followUpInstructions": ["הוראות המשך"],
  "suggestedTasks": [ { "title": "משימה מוצעת", "dueDate": "YYYY-MM-DD או null", "notes": "או null" } ],
  "suggestedAppointments": [ { "title": "תור מוצע", "date": "YYYY-MM-DD או null", "providerOrganization": "או null", "specialty": "או null" } ],
  "suggestedChecklist": [ { "title": "פריט הכנה", "required": true או false } ],
  "medicalCaseTitle": "כותרת מוצעת למעקב הרפואי או null",
  "confidence": מספר בין 0 ל-1,
  "fieldConfidence": { "שם שדה": מספר בין 0 ל-1 }
}`;

export const geminiAIProvider: AIProvider = {
  id: "gemini",
  label: "Google Gemini",

  async analyzeDocument(
    input: AnalyzeDocumentInput
  ): Promise<AnalyzeDocumentResult> {
    const hint = input.categoryHint?.trim()
      ? `רמז קטגוריה מהמשתמש: ${input.categoryHint.trim()}`
      : "";
    const raw = await callGeminiJson(
      input,
      [documentFieldsPrompt, hint].filter(Boolean).join("\n")
    );

    const amount = asMoney(raw.amount, raw.currency);
    const dueDate = asIsoDate(raw.dueDate);
    const fields = {
      title: asString(raw.title),
      date: asIsoDate(raw.date),
      providerName: asString(raw.providerName),
      referenceNumber: asString(raw.referenceNumber),
      amount,
      dueDate,
    };

    const result: AnalyzeDocumentResult = {
      ...baseLiveResult(input, "document", raw),
      documentType: asDocumentType(raw.documentType),
      title: fields.title || "מסמך שנסרק",
      summary:
        asString(raw.summary) ||
        "המסמך נותח. מומלץ לעבור על השדות לפני שמירה.",
      detectedLanguage: asString(raw.detectedLanguage),
      date: fields.date,
      providerName: fields.providerName,
      referenceNumber: fields.referenceNumber,
      amount,
      dueDate,
      billingPeriod: {
        start: asIsoDate(raw.billingPeriodStart),
        end: asIsoDate(raw.billingPeriodEnd),
        label: asString(raw.billingPeriodLabel),
      },
      category: asString(raw.category),
      suggestedFolder: asString(raw.suggestedFolder),
      missingFields: collectMissingFields(fields),
      suggestedActions: [
        action(
          "save-document",
          "save_document",
          "שמירת מסמך",
          "שמירת המסמך במרכז המסמכים לאחר בדיקה.",
          true
        ),
      ],
    };

    if (amount) {
      result.suggestedActions.push(
        action(
          "add-expense",
          "add_expense",
          "הוספת הוצאה",
          "יצירת הוצאה בכספים לאחר אישור הפרטים.",
          false
        )
      );
    }

    if (dueDate) {
      result.suggestedActions.push(
        action(
          "create-reminder",
          "create_reminder",
          "תזכורת לתשלום",
          "יצירת תזכורת לפני התאריך האחרון לתשלום.",
          false
        )
      );
    }

    return result;
  },

  async analyzeReceipt(
    input: AnalyzeReceiptInput
  ): Promise<AnalyzeReceiptResult> {
    const raw = await callGeminiJson(input, receiptFieldsPrompt);

    const totalAmount = asMoney(raw.totalAmount, raw.currency);
    const items: ReceiptItem[] = Array.isArray(raw.items)
      ? (raw.items as unknown[])
          .map((item): ReceiptItem | null => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const record = item as Record<string, unknown>;
            const name = asString(record.name);

            if (!name) {
              return null;
            }

            return {
              name,
              quantity: asNumber(record.quantity),
              amount: asMoney(record.amount, raw.currency),
            };
          })
          .filter((item): item is ReceiptItem => item !== null)
          .slice(0, 60)
      : [];

    const fields = {
      merchantName: asString(raw.merchantName),
      purchaseDate: asIsoDate(raw.purchaseDate),
      totalAmount,
      paymentMethod: asString(raw.paymentMethod),
    };

    return {
      ...baseLiveResult(input, "receipt", raw),
      merchantName: fields.merchantName,
      purchaseDate: fields.purchaseDate,
      totalAmount,
      paymentMethod: fields.paymentMethod,
      categorySuggestion: asString(raw.categorySuggestion) || "מזון",
      items,
      tax: asMoney(raw.taxAmount, raw.currency),
      householdAmount: totalAmount,
      notes: asString(raw.notes),
      missingFields: collectMissingFields(fields),
      suggestedActions: [
        action(
          "add-expense",
          "add_expense",
          "אישור ושמירה",
          "הוספת ההוצאה לכספים אחרי אישור המשתמש.",
          true,
          totalAmount
            ? {
                title: fields.merchantName || "קנייה",
                category: asString(raw.categorySuggestion) || "מזון",
                amount: totalAmount.minorUnits,
              }
            : undefined
        ),
        action(
          "archive-document",
          "archive_document",
          "תיוק הקבלה",
          "שמירת פרטי הקבלה במרכז המסמכים.",
          true
        ),
      ],
    };
  },

  async analyzeBill(input: AnalyzeBillInput): Promise<AnalyzeBillResult> {
    const hint = input.providerHint?.trim()
      ? `רמז ספק מהמשתמש: ${input.providerHint.trim()}`
      : "";
    const raw = await callGeminiJson(
      input,
      [billFieldsPrompt, hint].filter(Boolean).join("\n")
    );

    const amount = asMoney(raw.amount, raw.currency);
    const dueDate = asIsoDate(raw.dueDate);
    const providerName = asString(raw.providerName);
    const paymentStatusText = asString(raw.paymentStatus);
    const fields = {
      providerName,
      amount,
      issueDate: asIsoDate(raw.issueDate),
      dueDate,
      referenceNumber: asString(raw.referenceNumber),
    };

    return {
      ...baseLiveResult(input, "bill", raw),
      providerName,
      billType: asString(raw.billType),
      amount,
      issueDate: fields.issueDate,
      dueDate,
      billingPeriodStart: asIsoDate(raw.billingPeriodStart),
      billingPeriodEnd: asIsoDate(raw.billingPeriodEnd),
      referenceNumber: fields.referenceNumber,
      accountNumberMasked: asString(raw.accountNumberMasked),
      paymentStatus:
        paymentStatusText === "paid" || paymentStatusText === "unpaid"
          ? paymentStatusText
          : "unknown",
      categorySuggestion: asString(raw.categorySuggestion) || "חשבונות",
      suggestedArchiveFolder: "חשבונות בית",
      suggestedExpense: amount
        ? {
            title: asString(raw.billType) || providerName || "חשבון",
            amount: amount.value,
            category: asString(raw.categorySuggestion) || "חשבונות",
          }
        : undefined,
      suggestedReminder: dueDate
        ? {
            title: `לשלם ${asString(raw.billType) || "חשבון"}`,
            dueDate,
            daysBefore: 2,
          }
        : undefined,
      missingFields: collectMissingFields(fields),
      suggestedActions: [
        action(
          "add-expense",
          "add_expense",
          "הוספת הוצאה",
          "הוספת החשבון לכספים אחרי אישור.",
          true
        ),
        ...(dueDate
          ? [
              action(
                "create-reminder",
                "create_reminder",
                "תזכורת לתשלום",
                "יצירת תזכורת יומיים לפני התאריך האחרון.",
                true
              ),
            ]
          : []),
        action(
          "archive-document",
          "archive_document",
          "תיוק החשבון",
          "שמירת המסמך במרכז המסמכים.",
          false
        ),
      ],
    };
  },

  async analyzeMedicalDocument(
    input: AnalyzeMedicalDocumentInput
  ): Promise<AnalyzeMedicalDocumentResult> {
    const hint = input.patientHint?.trim()
      ? `רמז מטופל מהמשתמש: ${input.patientHint.trim()}`
      : "";
    const raw = await callGeminiJson(
      input,
      [medicalFieldsPrompt, hint].filter(Boolean).join("\n")
    );

    const suggestedTasks: MedicalTaskSuggestion[] = Array.isArray(
      raw.suggestedTasks
    )
      ? (raw.suggestedTasks as unknown[])
          .map((item): MedicalTaskSuggestion | null => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const record = item as Record<string, unknown>;
            const title = asString(record.title);

            return title
              ? {
                  title,
                  dueDate: asIsoDate(record.dueDate),
                  notes: asString(record.notes),
                }
              : null;
          })
          .filter((item): item is MedicalTaskSuggestion => item !== null)
          .slice(0, 8)
      : [];

    const suggestedAppointments: MedicalAppointmentSuggestion[] = Array.isArray(
      raw.suggestedAppointments
    )
      ? (raw.suggestedAppointments as unknown[])
          .map((item): MedicalAppointmentSuggestion | null => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const record = item as Record<string, unknown>;
            const title = asString(record.title);

            return title
              ? {
                  title,
                  date: asIsoDate(record.date),
                  providerOrganization: asString(record.providerOrganization),
                  specialty: asString(record.specialty),
                }
              : null;
          })
          .filter(
            (item): item is MedicalAppointmentSuggestion => item !== null
          )
          .slice(0, 6)
      : [];

    const suggestedChecklist: MedicalChecklistItem[] = Array.isArray(
      raw.suggestedChecklist
    )
      ? (raw.suggestedChecklist as unknown[])
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const record = item as Record<string, unknown>;
            const title = asString(record.title);

            return title
              ? { title, required: record.required === true }
              : null;
          })
          .filter((item): item is MedicalChecklistItem => item !== null)
          .slice(0, 12)
      : [];

    const patientName = asString(raw.patientName);
    const specialty = asString(raw.specialty);
    const fields = {
      doctorName: asString(raw.doctorName),
      providerOrganization: asString(raw.providerOrganization),
      patientName,
      documentDate: asIsoDate(raw.documentDate),
    };

    const base = baseLiveResult(input, "medical_document", raw);

    return {
      ...base,
      documentType: asDocumentType(raw.documentType),
      doctorName: fields.doctorName,
      providerOrganization: fields.providerOrganization,
      patientName,
      documentDate: fields.documentDate,
      appointmentDate: asIsoDate(raw.appointmentDate),
      referralNumber: asString(raw.referralNumber),
      specialty,
      requestedTests: asStringArray(raw.requestedTests),
      requiredDocuments: asStringArray(raw.requiredDocuments),
      preparationInstructions: asStringArray(raw.preparationInstructions),
      followUpInstructions: asStringArray(raw.followUpInstructions),
      suggestedTasks,
      suggestedAppointments,
      suggestedChecklist,
      medicalCaseSuggestion: asString(raw.medicalCaseTitle)
        ? {
            title: asString(raw.medicalCaseTitle) as string,
            patientName,
            specialty,
          }
        : undefined,
      missingFields: collectMissingFields(fields),
      warnings: [
        ...base.warnings,
        {
          code: "not-medical-advice",
          message: "הניתוח מיועד לארגון מידע בלבד ואינו מחליף ייעוץ רפואי.",
        },
      ],
      suggestedActions: [
        ...(suggestedChecklist.length
          ? [
              action(
                "create-checklist",
                "create_checklist",
                "יצירת רשימת הכנה",
                "יצירת משימות הכנה רק לאחר אישור.",
                false
              ),
            ]
          : []),
        ...(suggestedAppointments.length
          ? [
              action(
                "create-appointment",
                "create_appointment",
                "הוספת תור",
                "הוספת התור ליומן הבריאות לאחר אישור.",
                false
              ),
            ]
          : []),
        action(
          "save-document",
          "save_document",
          "שמירת מסמך",
          "שמירת המסמך במרכז המסמכים לאחר בדיקה.",
          true
        ),
      ],
    };
  },
};
