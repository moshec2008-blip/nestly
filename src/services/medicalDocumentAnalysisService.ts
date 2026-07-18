import { getAIProviderForInput } from "@/lib/ai";
import {
  validateAIRequestFiles,
  validateAnalyzeResult,
} from "@/lib/ai/validation/ai-response.validation";
import type {
  AnalyzeMedicalDocumentInput,
  AnalyzeMedicalDocumentResult,
} from "@/lib/ai/types";

export async function analyzeMedicalDocumentService(
  input: AnalyzeMedicalDocumentInput
): Promise<AnalyzeMedicalDocumentResult> {
  const requestError = validateAIRequestFiles(input.files);

  if (requestError) {
    throw requestError;
  }

  const provider = getAIProviderForInput(input);
  const result = await provider.analyzeMedicalDocument(input);
  const resultError = validateAnalyzeResult(result);

  if (resultError) {
    throw resultError;
  }

  return result;
}
