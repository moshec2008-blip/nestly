import {
  assertAIAccess,
  createAnalyzeInput,
  jsonError,
  jsonSuccess,
  readAnalyzeRequest,
} from "@/app/api/ai/_shared";
import { analyzeMedicalDocumentService } from "@/services/medicalDocumentAnalysisService";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const raw = await readAnalyzeRequest(request);
    assertAIAccess(raw, "medical_document");
    const baseInput = createAnalyzeInput(raw);
    const analysis = await analyzeMedicalDocumentService({
      ...baseInput,
      patientHint: raw.patientHint,
    });

    return jsonSuccess(analysis);
  } catch (error) {
    return jsonError(error);
  }
}
