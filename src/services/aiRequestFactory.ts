import type {
  AIFileInput,
  AIUserMode,
  BaseAnalyzeInput,
  MockScenarioId,
  SupportedDocumentMimeType,
} from "@/lib/ai/types";
import { normalizeFileName, normalizeLocale } from "@/lib/ai/normalization/text";

type RawAIFile = {
  fileName?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  size?: number;
  sourceType?: AIFileInput["sourceType"];
  base64?: string;
  secureFileRef?: string;
};

export type RawAnalyzeRequest = {
  requestId?: string;
  userId?: string;
  familySpaceId?: string;
  locale?: string;
  preferredResponseLanguage?: "he" | "en" | "yi";
  userMode?: AIUserMode;
  files?: RawAIFile[];
  text?: string;
  mockScenario?: MockScenarioId;
  categoryHint?: string;
  providerHint?: string;
  patientHint?: string;
};

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `ai-${Date.now()}`;
}

function normalizeMimeType(value: string | undefined) {
  const mimeType = value || "application/pdf";

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp" ||
    mimeType === "application/pdf"
  ) {
    return mimeType satisfies SupportedDocumentMimeType;
  }

  return mimeType as SupportedDocumentMimeType;
}

export function buildBaseAnalyzeInput(
  raw: RawAnalyzeRequest
): BaseAnalyzeInput {
  return {
    requestId: raw.requestId || createRequestId(),
    userId: raw.userId,
    familySpaceId: raw.familySpaceId,
    locale: normalizeLocale(raw.locale),
    preferredResponseLanguage: raw.preferredResponseLanguage || "he",
    userMode: raw.userMode,
    files: (raw.files ?? []).map((file) => ({
      fileName: normalizeFileName(file.fileName || file.name || "document"),
      mimeType: normalizeMimeType(file.mimeType || file.type),
      size: file.size ?? 0,
      sourceType: file.sourceType || "upload",
      userId: raw.userId,
      familySpaceId: raw.familySpaceId,
      locale: normalizeLocale(raw.locale),
      base64: file.base64,
      secureFileRef: file.secureFileRef,
    })),
    text: raw.text,
    mockScenario: raw.mockScenario,
  };
}
