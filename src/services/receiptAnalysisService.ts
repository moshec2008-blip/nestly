import { getAIProvider } from "@/lib/ai";
import {
  validateAIRequestFiles,
  validateAnalyzeResult,
} from "@/lib/ai/validation/ai-response.validation";
import type {
  AnalyzeReceiptInput,
  AnalyzeReceiptResult,
  AICorrectionRecord,
} from "@/lib/ai/types";

export async function analyzeReceiptService(
  input: AnalyzeReceiptInput
): Promise<AnalyzeReceiptResult> {
  const requestError = validateAIRequestFiles(input.files);

  if (requestError) {
    throw requestError;
  }

  const provider = getAIProvider();
  const result = await provider.analyzeReceipt(input);
  const resultError = validateAnalyzeResult(result);

  if (resultError) {
    throw resultError;
  }

  return result;
}

export function createReceiptCorrection(
  requestId: string,
  field: string,
  originalValue: unknown,
  correctedValue: unknown
): AICorrectionRecord {
  return {
    requestId,
    field,
    originalValue,
    correctedValue,
    analysisType: "receipt",
    documentType: "receipt",
    timestamp: new Date().toISOString(),
  };
}
