import type {
  AnalyzeBillInput,
  AnalyzeBillResult,
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  AnalyzeMedicalDocumentInput,
  AnalyzeMedicalDocumentResult,
  AnalyzeReceiptInput,
  AnalyzeReceiptResult,
  AIProviderId,
} from "@/lib/ai/types";

export interface AIProvider {
  id: AIProviderId;
  label: string;
  analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentResult>;
  analyzeReceipt(input: AnalyzeReceiptInput): Promise<AnalyzeReceiptResult>;
  analyzeBill(input: AnalyzeBillInput): Promise<AnalyzeBillResult>;
  analyzeMedicalDocument(
    input: AnalyzeMedicalDocumentInput
  ): Promise<AnalyzeMedicalDocumentResult>;
}
