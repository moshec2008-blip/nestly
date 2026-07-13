import type { AIProvider } from "@/lib/ai/providers/ai-provider.interface";
import type {
  AnalyzeBillInput,
  AnalyzeDocumentInput,
  AnalyzeMedicalDocumentInput,
  AnalyzeReceiptInput,
} from "@/lib/ai/types";
import { createAIError } from "@/lib/ai/validation/ai-response.validation";
import { mockAIProvider } from "@/lib/ai/providers/mock-provider";

export const geminiAIProvider: AIProvider = {
  id: "gemini",
  label: "Google Gemini",

  async analyzeDocument(input: AnalyzeDocumentInput) {
    if (!process.env.GEMINI_API_KEY) {
      throw createAIError(
        "missing_api_key",
        "חסר GEMINI_API_KEY. הניתוח האמיתי לא הופעל.",
        503
      );
    }

    // Server-side Gemini adapter placeholder.
    // Install a Gemini SDK later and map its structured JSON output through
    // src/lib/ai/validation before returning it to product code.
    const result = await mockAIProvider.analyzeDocument(input);
    return { ...result, provider: "gemini" as const, mode: "mock" as const };
  },

  async analyzeReceipt(input: AnalyzeReceiptInput) {
    if (!process.env.GEMINI_API_KEY) {
      throw createAIError(
        "missing_api_key",
        "חסר GEMINI_API_KEY. הניתוח האמיתי לא הופעל.",
        503
      );
    }

    const result = await mockAIProvider.analyzeReceipt(input);
    return { ...result, provider: "gemini" as const, mode: "mock" as const };
  },

  async analyzeBill(input: AnalyzeBillInput) {
    if (!process.env.GEMINI_API_KEY) {
      throw createAIError(
        "missing_api_key",
        "חסר GEMINI_API_KEY. הניתוח האמיתי לא הופעל.",
        503
      );
    }

    const result = await mockAIProvider.analyzeBill(input);
    return { ...result, provider: "gemini" as const, mode: "mock" as const };
  },

  async analyzeMedicalDocument(input: AnalyzeMedicalDocumentInput) {
    if (!process.env.GEMINI_API_KEY) {
      throw createAIError(
        "missing_api_key",
        "חסר GEMINI_API_KEY. הניתוח האמיתי לא הופעל.",
        503
      );
    }

    const result = await mockAIProvider.analyzeMedicalDocument(input);
    return { ...result, provider: "gemini" as const, mode: "mock" as const };
  },
};
