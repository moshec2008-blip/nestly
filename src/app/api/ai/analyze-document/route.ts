import {
  assertAIAccess,
  assertAIRequestSecurity,
  createAnalyzeInput,
  jsonError,
  jsonSuccess,
  readAnalyzeRequest,
} from "@/app/api/ai/_shared";
import { analyzeDocumentService } from "@/services/documentAnalysisService";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertAIRequestSecurity(request);
    const raw = await readAnalyzeRequest(request);
    assertAIAccess(raw, "document");
    const baseInput = createAnalyzeInput(raw);
    const analysis = await analyzeDocumentService({
      ...baseInput,
      categoryHint: raw.categoryHint,
    });

    return jsonSuccess(analysis);
  } catch (error) {
    return jsonError(error);
  }
}
