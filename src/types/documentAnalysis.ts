import type { AppRoute } from "@/types/navigation";

export type AiProviderId = "mock" | "openai" | "gemini" | "anthropic";

export type DocumentAnalysisFile = {
  name: string;
  type: string;
  size?: number;
  textPreview?: string;
};

export type DocumentAnalysisInput = {
  title?: string;
  description?: string;
  files: DocumentAnalysisFile[];
};

export type ExtractedDocumentData = {
  documentType: string;
  providerName?: string;
  issueDate?: string;
  amount?: number;
  currency?: "ILS" | "USD" | "EUR" | string;
  dueDate?: string;
  accountNumber?: string;
  referenceNumber?: string;
  billingPeriod?: string;
  isRecurringCandidate?: boolean;
  suggestedCategory: string;
  summary: string;
  tags: string[];
  confidence: number;
};

export type SuggestedDocumentActionType =
  | "save-document"
  | "add-finance-expense"
  | "create-payment-task"
  | "create-reminder"
  | "mark-recurring"
  | "attach-document";

export type SuggestedDocumentAction = {
  id: string;
  type: SuggestedDocumentActionType;
  label: string;
  description: string;
  targetRoute: AppRoute;
  enabledByDefault: boolean;
  requiresConfirmation: true;
};

export type DocumentAnalysisResult = {
  provider: AiProviderId;
  mode: "mock" | "live";
  extracted: ExtractedDocumentData;
  suggestedActions: SuggestedDocumentAction[];
  warnings: string[];
  rawTextPreview?: string;
};
