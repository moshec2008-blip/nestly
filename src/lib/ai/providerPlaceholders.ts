import { createMissingProviderError } from "@/lib/ai/documentAnalysisProvider";
import type { DocumentAnalysisProvider } from "@/lib/ai/documentAnalysisProvider";

export const openAiDocumentAnalysisProvider: DocumentAnalysisProvider = {
  id: "openai",
  label: "OpenAI document analyzer",
  mode: "live",
  analyzeDocument() {
    throw createMissingProviderError("openai");
  },
};

export const geminiDocumentAnalysisProvider: DocumentAnalysisProvider = {
  id: "gemini",
  label: "Google Gemini document analyzer",
  mode: "live",
  analyzeDocument() {
    throw createMissingProviderError("gemini");
  },
};

export const anthropicDocumentAnalysisProvider: DocumentAnalysisProvider = {
  id: "anthropic",
  label: "Anthropic Claude document analyzer",
  mode: "live",
  analyzeDocument() {
    throw createMissingProviderError("anthropic");
  },
};
