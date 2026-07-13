import type { AIProvider } from "@/lib/ai/providers/ai-provider.interface";
import type {
  AnalyzeBillInput,
  AnalyzeBillResult,
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  AnalyzeMedicalDocumentInput,
  AnalyzeMedicalDocumentResult,
  AnalyzeReceiptInput,
  AnalyzeReceiptResult,
  BaseAnalyzeResult,
  AnalysisType,
  MoneyAmount,
} from "@/lib/ai/types";
import { addDaysIso } from "@/lib/ai/normalization/date";
import { getConfidenceLevel } from "@/lib/ai/validation/ai-response.validation";

function money(value: number, currency = "ILS"): MoneyAmount {
  return {
    value,
    minorUnits: Math.round(value * 100),
    currency,
  };
}

function baseResult<A extends AnalysisType>(
  input:
    | AnalyzeDocumentInput
    | AnalyzeReceiptInput
    | AnalyzeBillInput
    | AnalyzeMedicalDocumentInput,
  analysisType: A,
  confidence: number
): BaseAnalyzeResult & { analysisType: A } {
  return {
    requestId: input.requestId,
    provider: "mock",
    mode: "mock",
    analysisType,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    fieldConfidence: {},
    warnings: [
      {
        code: "mock-mode",
        message:
          "זהו ניתוח הדגמה. יש לבדוק את הפרטים לפני אישור ושמירה.",
      },
    ],
    missingFields: [],
    requiresUserReview: true,
    suggestedActions: [],
    sourceMetadata: {
      fileNames: input.files.map((file) => file.fileName),
      processedAt: new Date().toISOString(),
      providerModel: "nestly-mock-v1",
    },
  };
}

function getScenarioText(input: AnalyzeDocumentInput | AnalyzeReceiptInput) {
  return [
    input.mockScenario,
    input.text,
    ...input.files.map((file) => file.fileName),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export const mockAIProvider: AIProvider = {
  id: "mock",
  label: "Nestly mock AI",

  async analyzeDocument(input) {
    const text = getScenarioText(input);
    const confidence = text.includes("low") ? 0.42 : 0.78;
    const result: AnalyzeDocumentResult = {
      ...baseResult(input, "document", confidence),
      documentType: text.includes("medical")
        ? "medical_referral"
        : text.includes("receipt")
          ? "receipt"
          : "utility_bill",
      title: text.includes("medical")
        ? "הפניה רפואית לבדיקה"
        : text.includes("receipt")
          ? "קבלה מסופרמרקט"
          : "חשבון מים",
      summary:
        "זוהו פרטים עיקריים ונוצרה הצעה לבדיקה. שום פעולה לא תישמר בלי אישור.",
      detectedLanguage: "he",
      date: addDaysIso(new Date(), -3),
      providerName: text.includes("medical") ? "קופת חולים" : "ספק שירות",
      referenceNumber: "MOCK-REF-2026",
      amount: text.includes("medical") ? undefined : money(190),
      dueDate: text.includes("medical") ? undefined : addDaysIso(new Date(), 9),
      billingPeriod: { label: "החודש האחרון" },
      category: text.includes("medical") ? "בריאות" : "חשבונות",
      suggestedFolder: text.includes("medical") ? "בריאות" : "חשבונות בית",
      fieldConfidence: {
        providerName: 0.84,
        amount: 0.8,
        dueDate: 0.76,
      },
      suggestedActions: [
        {
          id: "save-document",
          type: "save_document",
          label: "שמירת מסמך",
          description: "שמירת המסמך במרכז המסמכים לאחר בדיקה.",
          requiresConfirmation: true,
          enabledByDefault: true,
        },
      ],
    };

    if (result.amount) {
      result.suggestedActions.push({
        id: "add-expense",
        type: "add_expense",
        label: "הוספת הוצאה",
        description: "יצירת הוצאה בכספים לאחר אישור הפרטים.",
        requiresConfirmation: true,
        enabledByDefault: false,
      });
    }

    return result;
  },

  async analyzeReceipt(input) {
    if (input.mockScenario === "error") {
      throw new Error("mock-provider-error");
    }

    const lowConfidence = input.mockScenario === "low_confidence";
    const total = money(400);
    const household = money(280);
    const reimbursement = money(120);

    return {
      ...baseResult(
        input,
        "receipt",
        lowConfidence ? 0.46 : 0.91
      ),
      merchantName: "סופר משפחתי",
      purchaseDate: addDaysIso(new Date(), -1),
      totalAmount: total,
      paymentMethod: "כרטיס אשראי",
      categorySuggestion: "מזון",
      householdAmount: household,
      reimbursementAmount: reimbursement,
      tax: money(57.2),
      items: [
        { name: "חלב", quantity: 2, amount: money(13.8) },
        { name: "לחם", quantity: 1, amount: money(8.9) },
        { name: "מוצרים עבור אחר", quantity: 1, amount: reimbursement },
      ],
      notes:
        "חלק מהקנייה נראה כשייך לאדם אחר. אפשר לערוך את הסכומים לפני שמירה.",
      fieldConfidence: {
        merchantName: 0.94,
        purchaseDate: 0.88,
        totalAmount: 0.96,
        householdAmount: 0.74,
      },
      warnings: lowConfidence
        ? [
            {
              code: "low-confidence",
              message: "לא הצלחנו לזהות את כל הפרטים בוודאות.",
            },
          ]
        : [
            {
              code: "review-required",
              message: "יש לבדוק את הסכום המשפחתי לפני שמירה.",
            },
          ],
      missingFields: lowConfidence ? ["paymentMethod"] : [],
      suggestedActions: [
        {
          id: "add-expense",
          type: "add_expense",
          label: "אישור ושמירה",
          description: "הוספת ההוצאה לכספים אחרי אישור המשתמש.",
          requiresConfirmation: true,
          enabledByDefault: true,
          payload: {
            title: "סופר משפחתי",
            category: "מזון",
            amount: household.minorUnits,
          },
        },
        {
          id: "archive-document",
          type: "archive_document",
          label: "תיוק הקבלה",
          description: "שמירת מטא-דאטה של הקבלה במסמכים.",
          requiresConfirmation: true,
          enabledByDefault: true,
        },
      ],
    };
  },

  async analyzeBill(input) {
    return {
      ...baseResult(input, "bill", 0.86),
      providerName: "תאגיד מים",
      billType: "חשבון מים",
      amount: money(190),
      issueDate: addDaysIso(new Date(), -4),
      dueDate: addDaysIso(new Date(), 8),
      billingPeriodStart: addDaysIso(new Date(), -35),
      billingPeriodEnd: addDaysIso(new Date(), -5),
      referenceNumber: "MOCK-WATER-2026",
      accountNumberMasked: "****1234",
      paymentStatus: "unpaid",
      categorySuggestion: "חשבונות",
      suggestedArchiveFolder: "חשבונות בית",
      suggestedExpense: { title: "חשבון מים", amount: 190, category: "חשבונות" },
      suggestedReminder: { title: "לשלם חשבון מים", daysBefore: 2 },
      fieldConfidence: {
        providerName: 0.9,
        amount: 0.91,
        dueDate: 0.84,
      },
      suggestedActions: [
        {
          id: "add-expense",
          type: "add_expense",
          label: "הוספת הוצאה",
          description: "הוספת החשבון לכספים אחרי אישור.",
          requiresConfirmation: true,
          enabledByDefault: true,
        },
        {
          id: "create-reminder",
          type: "create_reminder",
          label: "תזכורת לתשלום",
          description: "יצירת תזכורת יומיים לפני התאריך האחרון.",
          requiresConfirmation: true,
          enabledByDefault: true,
        },
      ],
    };
  },

  async analyzeMedicalDocument(input) {
    return {
      ...baseResult(
        input,
        "medical_document",
        0.8
      ),
      documentType: "medical_referral",
      doctorName: "ד״ר לוי",
      providerOrganization: "קופת חולים",
      patientName: "בן משפחה",
      documentDate: addDaysIso(new Date(), -2),
      appointmentDate: addDaysIso(new Date(), 14),
      referralNumber: "MOCK-MED-2026",
      specialty: "אורתופדיה",
      requestedTests: ["בדיקת דם", "צילום"],
      requiredDocuments: ["תעודה מזהה", "הפניה"],
      preparationInstructions: ["להגיע 10 דקות לפני התור"],
      followUpInstructions: ["לקבוע ביקורת אחרי קבלת התוצאות"],
      suggestedTasks: [
        { title: "לקבוע תור לאורתופד", dueDate: addDaysIso(new Date(), 3) },
      ],
      suggestedAppointments: [
        {
          title: "תור אורתופדיה",
          date: addDaysIso(new Date(), 14),
          providerOrganization: "קופת חולים",
          specialty: "אורתופדיה",
        },
      ],
      suggestedChecklist: [
        { title: "להביא תעודה מזהה", required: true },
        { title: "להביא הפניה", required: true },
      ],
      medicalCaseSuggestion: {
        title: "מעקב אורתופדיה",
        patientName: "בן משפחה",
        specialty: "אורתופדיה",
      },
      warnings: [
        {
          code: "not-medical-advice",
          message:
            "הניתוח מיועד לארגון מידע בלבד ואינו מחליף ייעוץ רפואי.",
        },
      ],
      suggestedActions: [
        {
          id: "create-checklist",
          type: "create_checklist",
          label: "יצירת רשימת הכנה",
          description: "יצירת משימות הכנה רק לאחר אישור.",
          requiresConfirmation: true,
          enabledByDefault: false,
        },
      ],
    };
  },
};
