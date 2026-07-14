import type {
  AIFileInput,
  AISafeError,
  AnyAnalyzeResult,
  ConfidenceLevel,
  SupportedDocumentMimeType,
} from "@/lib/ai/types";
import { getAIConfig } from "@/lib/ai/config";

const allowedMimeTypes: SupportedDocumentMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export function createAIError(
  code: AISafeError["code"],
  message: string,
  status = 400
): AISafeError {
  return { code, message, status };
}

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.86) {
    return "high";
  }

  if (confidence >= 0.62) {
    return "medium";
  }

  return "low";
}

export function validateAIFileInput(
  file: Partial<AIFileInput>,
  index: number
): AISafeError | null {
  const config = getAIConfig();

  if (!file.fileName || !file.mimeType || typeof file.size !== "number") {
    return createAIError(
      "invalid_request",
      `קובץ ${index + 1} חסר שם, סוג או גודל.`
    );
  }

  if (!allowedMimeTypes.includes(file.mimeType as SupportedDocumentMimeType)) {
    return createAIError("unsupported_file", "סוג הקובץ אינו נתמך.");
  }

  if (file.size > config.maxFileSizeBytes) {
    return createAIError("file_too_large", "הקובץ גדול מדי לניתוח.");
  }

  if (!file.base64 && !file.secureFileRef) {
    return createAIError("missing_file", "לא נמצא תוכן קובץ לניתוח.");
  }

  return null;
}

export function validateAIRequestFiles(files: Partial<AIFileInput>[]) {
  const config = getAIConfig();

  if (!Array.isArray(files) || files.length === 0) {
    return createAIError("missing_file", "צריך לצרף קובץ אחד לפחות.");
  }

  if (files.length > config.maxFiles) {
    return createAIError("invalid_request", "צורפו יותר מדי קבצים.");
  }

  for (let index = 0; index < files.length; index += 1) {
    const error = validateAIFileInput(files[index], index);

    if (error) {
      return error;
    }
  }

  return null;
}

export function validateAnalyzeResult(result: AnyAnalyzeResult) {
  if (
    typeof result.requestId !== "string" ||
    typeof result.confidence !== "number" ||
    typeof result.confidenceLevel !== "string" ||
    result.requiresUserReview !== true ||
    !Array.isArray(result.suggestedActions) ||
    !Array.isArray(result.warnings) ||
    !Array.isArray(result.missingFields) ||
    !result.sourceMetadata ||
    !Array.isArray(result.sourceMetadata.fileNames)
  ) {
    return createAIError(
      "malformed_ai_response",
      "תוצאת הניתוח לא תקינה. לא נשמרו שינויים.",
      502
    );
  }

  if (
    result.confidenceLevel !== "high" &&
    result.confidenceLevel !== "medium" &&
    result.confidenceLevel !== "low"
  ) {
    return createAIError(
      "malformed_ai_response",
      "רמת הביטחון שהתקבלה אינה תקינה.",
      502
    );
  }

  if (result.confidence < 0 || result.confidence > 1) {
    return createAIError(
      "malformed_ai_response",
      "רמת הביטחון שהתקבלה אינה תקינה.",
      502
    );
  }

  const unsafeSuggestedAction = result.suggestedActions.find(
    (action) =>
      !action ||
      typeof action !== "object" ||
      action.requiresConfirmation !== true ||
      typeof action.id !== "string" ||
      typeof action.label !== "string" ||
      typeof action.description !== "string"
  );

  if (unsafeSuggestedAction) {
    return createAIError(
      "malformed_ai_response",
      "תוצאת הניתוח כללה פעולה לא בטוחה. לא נשמרו שינויים.",
      502
    );
  }

  return null;
}
