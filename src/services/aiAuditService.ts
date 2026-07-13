import type {
  AIAuditRecord,
  AICorrectionRecord,
  AnalysisType,
  AnyAnalyzeResult,
} from "@/lib/ai/types";

export function createAuditRecord(
  result: AnyAnalyzeResult,
  status: AIAuditRecord["status"] = "suggested"
): AIAuditRecord {
  return {
    requestId: result.requestId,
    provider: result.provider,
    analysisType: result.analysisType as AnalysisType,
    createdAt: new Date().toISOString(),
    status,
    confidence: result.confidence,
    acceptedByUser: status === "accepted",
    correctedByUser: status === "corrected",
    savedEntityIds: [],
  };
}

export function createCorrectionRecord(
  result: AnyAnalyzeResult,
  field: string,
  originalValue: unknown,
  correctedValue: unknown
): AICorrectionRecord {
  return {
    requestId: result.requestId,
    field,
    originalValue,
    correctedValue,
    analysisType: result.analysisType as AnalysisType,
    documentType:
      "documentType" in result ? result.documentType : undefined,
    timestamp: new Date().toISOString(),
  };
}
