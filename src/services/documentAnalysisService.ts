import { getAIProviderForInput } from "@/lib/ai";
import {
  createAIError,
  validateAIRequestFiles,
  validateAnalyzeResult,
} from "@/lib/ai/validation/ai-response.validation";
import type {
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  AISafeError,
} from "@/lib/ai/types";

export async function analyzeDocumentService(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentResult> {
  const requestError = validateAIRequestFiles(input.files);

  if (requestError) {
    throw requestError;
  }

  const provider = getAIProviderForInput(input);
  const result = await provider.analyzeDocument(input);
  const resultError = validateAnalyzeResult(result);

  if (resultError) {
    throw resultError;
  }

  return result;
}

export function toSafeAIError(error: unknown): AISafeError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    "status" in error
  ) {
    return error as AISafeError;
  }

  return createAIError(
    "network_failure",
    "שירות הסריקה אינו זמין כרגע. לא נשמרו שינויים.",
    500
  );
}
