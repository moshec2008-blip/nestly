import { getAIProvider } from "@/lib/ai";
import {
  validateAIRequestFiles,
  validateAnalyzeResult,
} from "@/lib/ai/validation/ai-response.validation";
import type { AnalyzeBillInput, AnalyzeBillResult } from "@/lib/ai/types";

export async function analyzeBillService(
  input: AnalyzeBillInput
): Promise<AnalyzeBillResult> {
  const requestError = validateAIRequestFiles(input.files);

  if (requestError) {
    throw requestError;
  }

  const provider = getAIProvider();
  const result = await provider.analyzeBill(input);
  const resultError = validateAnalyzeResult(result);

  if (resultError) {
    throw resultError;
  }

  return result;
}
