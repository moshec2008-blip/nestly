export type AIProviderId = "disabled" | "mock" | "gemini" | "future";

export type AIMode = "disabled" | "mock" | "live";

export type AIUserMode = "demo" | "basic" | "authenticated";

export type AnalysisType = "document" | "receipt" | "bill" | "medical_document";

export type DocumentSourceType = "upload" | "camera" | "email" | "manual";

export type SupportedDocumentMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

export type NormalizedDocumentType =
  | "receipt"
  | "invoice"
  | "utility_bill"
  | "bank_document"
  | "insurance_document"
  | "medical_referral"
  | "appointment_document"
  | "medical_result"
  | "prescription"
  | "vehicle_document"
  | "government_document"
  | "family_document"
  | "unknown";

export type CurrencyCode = "ILS" | "USD" | "EUR" | string;

export type ConfidenceLevel = "high" | "medium" | "low";

export type AIWarning = {
  code: string;
  message: string;
  field?: string;
};

export type FieldConfidence = Record<string, number>;

export type MoneyAmount = {
  value: number;
  minorUnits: number;
  currency: CurrencyCode;
};

export type AIFileInput = {
  fileName: string;
  mimeType: SupportedDocumentMimeType;
  size: number;
  sourceType: DocumentSourceType;
  familySpaceId?: string;
  userId?: string;
  locale: string;
  language?: string;
  documentCategoryHint?: string;
  base64?: string;
  secureFileRef?: string;
  metadata?: Record<string, string>;
};

export type BaseAnalyzeInput = {
  requestId: string;
  userId?: string;
  familySpaceId?: string;
  locale: string;
  preferredResponseLanguage: "he" | "en" | "yi";
  files: AIFileInput[];
  text?: string;
  mockScenario?: MockScenarioId;
};

export type AnalyzeDocumentInput = BaseAnalyzeInput & {
  categoryHint?: string;
};

export type AnalyzeReceiptInput = BaseAnalyzeInput & {
  categoryHint?: string;
};

export type AnalyzeBillInput = BaseAnalyzeInput & {
  providerHint?: string;
};

export type AnalyzeMedicalDocumentInput = BaseAnalyzeInput & {
  patientHint?: string;
};

export type AISuggestedActionType =
  | "save_document"
  | "add_expense"
  | "create_payment_task"
  | "create_reminder"
  | "archive_document"
  | "connect_to_finance"
  | "create_checklist"
  | "create_appointment"
  | "connect_to_medical_case";

export type AISuggestedAction = {
  id: string;
  type: AISuggestedActionType;
  label: string;
  description: string;
  requiresConfirmation: true;
  enabledByDefault: boolean;
  payload?: Record<string, unknown>;
};

export type BaseAnalyzeResult = {
  requestId: string;
  provider: AIProviderId;
  mode: AIMode;
  analysisType: AnalysisType;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  fieldConfidence: FieldConfidence;
  warnings: AIWarning[];
  missingFields: string[];
  requiresUserReview: true;
  suggestedActions: AISuggestedAction[];
  sourceMetadata: {
    fileNames: string[];
    processedAt: string;
    providerModel?: string;
  };
};

export type AnalyzeDocumentResult = BaseAnalyzeResult & {
  analysisType: "document";
  documentType: NormalizedDocumentType;
  title: string;
  summary: string;
  detectedLanguage?: string;
  date?: string;
  providerName?: string;
  referenceNumber?: string;
  amount?: MoneyAmount;
  dueDate?: string;
  billingPeriod?: {
    start?: string;
    end?: string;
    label?: string;
  };
  category?: string;
  suggestedFolder?: string;
  extractedText?: string;
};

export type ReceiptItem = {
  name: string;
  quantity?: number;
  amount?: MoneyAmount;
};

export type AnalyzeReceiptResult = BaseAnalyzeResult & {
  analysisType: "receipt";
  merchantName?: string;
  purchaseDate?: string;
  totalAmount?: MoneyAmount;
  paymentMethod?: string;
  categorySuggestion?: string;
  items?: ReceiptItem[];
  tax?: MoneyAmount;
  reimbursementAmount?: MoneyAmount;
  householdAmount?: MoneyAmount;
  notes?: string;
};

export type AnalyzeBillResult = BaseAnalyzeResult & {
  analysisType: "bill";
  providerName?: string;
  billType?: string;
  amount?: MoneyAmount;
  issueDate?: string;
  dueDate?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  referenceNumber?: string;
  accountNumberMasked?: string;
  paymentStatus: "unknown" | "unpaid" | "paid";
  categorySuggestion?: string;
  suggestedExpense?: Record<string, unknown>;
  suggestedReminder?: Record<string, unknown>;
  suggestedArchiveFolder?: string;
};

export type MedicalTaskSuggestion = {
  title: string;
  dueDate?: string;
  notes?: string;
};

export type MedicalAppointmentSuggestion = {
  title: string;
  date?: string;
  providerOrganization?: string;
  specialty?: string;
};

export type MedicalChecklistItem = {
  title: string;
  required: boolean;
};

export type MedicalCase = {
  id?: string;
  title: string;
  patientName?: string;
  specialty?: string;
};

export type MedicalDocument = {
  documentType: NormalizedDocumentType;
  doctorName?: string;
  providerOrganization?: string;
  patientName?: string;
  documentDate?: string;
};

export type AnalyzeMedicalDocumentResult = BaseAnalyzeResult & {
  analysisType: "medical_document";
  documentType: NormalizedDocumentType;
  doctorName?: string;
  providerOrganization?: string;
  patientName?: string;
  documentDate?: string;
  appointmentDate?: string;
  referralNumber?: string;
  specialty?: string;
  requestedTests?: string[];
  requiredDocuments?: string[];
  preparationInstructions?: string[];
  followUpInstructions?: string[];
  suggestedTasks?: MedicalTaskSuggestion[];
  suggestedAppointments?: MedicalAppointmentSuggestion[];
  suggestedChecklist?: MedicalChecklistItem[];
  medicalCaseSuggestion?: MedicalCase;
};

export type AnyAnalyzeInput =
  | AnalyzeDocumentInput
  | AnalyzeReceiptInput
  | AnalyzeBillInput
  | AnalyzeMedicalDocumentInput;

export type AnyAnalyzeResult =
  | AnalyzeDocumentResult
  | AnalyzeReceiptResult
  | AnalyzeBillResult
  | AnalyzeMedicalDocumentResult;

export type AIErrorCode =
  | "ai_disabled"
  | "missing_api_key"
  | "unsupported_file"
  | "file_too_large"
  | "missing_file"
  | "invalid_image"
  | "unreadable_scan"
  | "provider_timeout"
  | "provider_rate_limited"
  | "malformed_ai_response"
  | "network_failure"
  | "user_cancelled"
  | "low_confidence"
  | "invalid_request";

export type AISafeError = {
  code: AIErrorCode;
  message: string;
  status: number;
};

export type MockScenarioId =
  | "supermarket_receipt"
  | "water_bill"
  | "medical_referral"
  | "appointment_document"
  | "partial"
  | "low_confidence"
  | "error";

export type AIAuditRecord = {
  requestId: string;
  userId?: string;
  familySpaceId?: string;
  provider: AIProviderId;
  analysisType: AnalysisType;
  createdAt: string;
  status: "suggested" | "accepted" | "corrected" | "cancelled" | "failed";
  confidence?: number;
  acceptedByUser: boolean;
  correctedByUser: boolean;
  savedEntityIds: string[];
  errorCode?: AIErrorCode;
};

export type AICorrectionRecord = {
  requestId: string;
  field: string;
  originalValue: unknown;
  correctedValue: unknown;
  analysisType: AnalysisType;
  documentType?: NormalizedDocumentType;
  timestamp: string;
};
