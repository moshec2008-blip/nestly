import type {
  AiProviderId,
  DocumentAnalysisInput,
  DocumentAnalysisResult,
} from "@/types/documentAnalysis";

export type DocumentAnalysisProvider = {
  id: AiProviderId;
  label: string;
  mode: "mock" | "live";
  analyzeDocument: (
    input: DocumentAnalysisInput
  ) => Promise<DocumentAnalysisResult>;
};

export function createMissingProviderError(providerId: AiProviderId) {
  return new Error(
    `AI provider "${providerId}" is not configured. Use the mock provider until API keys and server-side adapters are added.`
  );
}
