import {
  assertAIAccess,
  assertAIRequestSecurity,
  createAnalyzeInput,
  jsonError,
  jsonSuccess,
  readAnalyzeRequest,
} from "@/app/api/ai/_shared";
import { analyzeBillService } from "@/services/billAnalysisService";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertAIRequestSecurity(request);
    const raw = await readAnalyzeRequest(request);
    assertAIAccess(raw, "bill");
    const baseInput = createAnalyzeInput(raw);
    const analysis = await analyzeBillService({
      ...baseInput,
      providerHint: raw.providerHint,
    });

    return jsonSuccess(analysis);
  } catch (error) {
    return jsonError(error);
  }
}
