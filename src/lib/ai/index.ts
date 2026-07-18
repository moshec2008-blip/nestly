export type { DocumentAnalysisProvider } from "@/lib/ai/documentAnalysisProvider";
export { createMissingProviderError } from "@/lib/ai/documentAnalysisProvider";
export {
  analyzeDocumentWithMock,
  mockDocumentAnalysisProvider,
} from "@/lib/ai/mockDocumentAnalyzer";
export {
  anthropicDocumentAnalysisProvider,
  geminiDocumentAnalysisProvider,
  openAiDocumentAnalysisProvider,
} from "@/lib/ai/providerPlaceholders";
export type { AIProvider } from "@/lib/ai/providers/ai-provider.interface";
export { mockAIProvider } from "@/lib/ai/providers/mock-provider";
export { geminiAIProvider } from "@/lib/ai/providers/gemini-provider";
export type * from "@/lib/ai/types";

import { getAIConfig } from "@/lib/ai/config";
import { geminiAIProvider } from "@/lib/ai/providers/gemini-provider";
import { mockAIProvider } from "@/lib/ai/providers/mock-provider";
import type { AIProvider } from "@/lib/ai/providers/ai-provider.interface";
import type { BaseAnalyzeInput } from "@/lib/ai/types";

export function getAIProvider(): AIProvider {
  const config = getAIConfig();

  if (config.enabled && config.provider === "gemini" && config.geminiConfigured) {
    return geminiAIProvider;
  }

  return mockAIProvider;
}

// מצב דמו לעולם לא קורא לספק AI בתשלום — תמיד mock, גם כשמפתח מוגדר.
export function getAIProviderForInput(input: BaseAnalyzeInput): AIProvider {
  if (input.userMode === "demo") {
    return mockAIProvider;
  }

  return getAIProvider();
}
