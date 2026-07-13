import {
  assertAIAccess,
  assertAIRequestSecurity,
  createAnalyzeInput,
  jsonError,
  jsonSuccess,
  readAnalyzeRequest,
} from "@/app/api/ai/_shared";
import { analyzeReceiptService } from "@/services/receiptAnalysisService";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertAIRequestSecurity(request);
    const raw = await readAnalyzeRequest(request);
    assertAIAccess(raw, "receipt");
    const baseInput = createAnalyzeInput(raw);
    const analysis = await analyzeReceiptService({
      ...baseInput,
      categoryHint: raw.categoryHint,
    });

    return jsonSuccess(analysis);
  } catch (error) {
    return jsonError(error);
  }
}
