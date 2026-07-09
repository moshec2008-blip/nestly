import {
  anthropicDocumentAnalysisProvider,
  createMissingProviderError,
  geminiDocumentAnalysisProvider,
  mockDocumentAnalysisProvider,
  openAiDocumentAnalysisProvider,
  type DocumentAnalysisProvider,
} from "@/lib/ai";
import type {
  AiProviderId,
  DocumentAnalysisInput,
  DocumentAnalysisResult,
} from "@/types/documentAnalysis";

const configuredProviderId: AiProviderId = "mock";

const providers: Record<AiProviderId, DocumentAnalysisProvider | null> = {
  mock: mockDocumentAnalysisProvider,
  openai: openAiDocumentAnalysisProvider,
  gemini: geminiDocumentAnalysisProvider,
  anthropic: anthropicDocumentAnalysisProvider,
};

export const documentAnalysisStatus = {
  provider: configuredProviderId,
  mode: "mock",
  description:
    "Document analysis is prepared with a replaceable provider interface. Current mode is local mock only; no paid AI calls are made.",
  futureProviders: ["openai", "gemini", "anthropic"] satisfies AiProviderId[],
} as const;

export function getDocumentAnalysisProvider(
  providerId: AiProviderId = configuredProviderId
) {
  const provider = providers[providerId];

  if (!provider) {
    throw createMissingProviderError(providerId);
  }

  return provider;
}

export async function analyzeDocument(
  input: DocumentAnalysisInput,
  providerId: AiProviderId = configuredProviderId
): Promise<DocumentAnalysisResult> {
  const provider = getDocumentAnalysisProvider(providerId);
  return provider.analyzeDocument(input);
}
