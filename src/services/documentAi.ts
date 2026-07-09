import {
  analyzeDocument,
  documentAnalysisStatus,
} from "@/services/documentAnalysis";
import { analyzeDocumentWithMock } from "@/lib/ai";
import type {
  DocumentAnalysisInput,
  DocumentAnalysisResult,
} from "@/types/documentAnalysis";

export type DocumentAiFile = {
  name: string;
  type: string;
};

export type DocumentAiInput = {
  title: string;
  description: string;
  files: DocumentAiFile[];
};

export type DocumentAiSuggestion = {
  title: string;
  category: string;
  summary: string;
  tags: string[];
  confidence: number;
  analysis: DocumentAnalysisResult;
};

export const documentAiStatus = documentAnalysisStatus;

function getBaseTitle(input: DocumentAiInput) {
  const title = input.title.trim();
  if (title) return title;

  const firstFileName = input.files[0]?.name;
  if (!firstFileName) return "מסמך חדש";

  return firstFileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

function toAnalysisInput(input: DocumentAiInput): DocumentAnalysisInput {
  return {
    title: input.title,
    description: input.description,
    files: input.files,
  };
}

export async function analyzeDocumentForReview(input: DocumentAiInput) {
  return analyzeDocument(toAnalysisInput(input));
}

export function suggestDocumentClassification(
  input: DocumentAiInput
): DocumentAiSuggestion {
  const fallbackAnalysis: DocumentAnalysisResult = analyzeDocumentWithMock(
    toAnalysisInput(input)
  );

  return {
    title: getBaseTitle(input),
    category: fallbackAnalysis.extracted.suggestedCategory,
    summary: fallbackAnalysis.extracted.summary,
    tags: fallbackAnalysis.extracted.tags,
    confidence: fallbackAnalysis.extracted.confidence,
    analysis: fallbackAnalysis,
  };
}
