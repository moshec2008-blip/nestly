"use client";

import { isDemoModeActive } from "@/lib/demoMode";
import {
  suggestDocumentClassification,
  type DocumentAiSuggestion,
} from "@/services/documentAi";
import type {
  DocumentAnalysisFile,
  DocumentAnalysisResult,
} from "@/types/documentAnalysis";

// שירות צד-לקוח לניתוח מסמכים: מכווץ תמונות, שולח לשרת, ונופל חזרה
// ל-mock המקומי בכל תקלה — כך שהחוויה אף פעם לא נתקעת.

export const aiAccessCodeStorageKey = "nestly-ai-access-code";

const maxImageDimension = 1500;
const compressedJpegQuality = 0.82;

export type AiServiceStatus = {
  mode: "live" | "mock";
  requiresAccessCode: boolean;
};

export function getStoredAiAccessCode() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(aiAccessCodeStorageKey) ?? "";
}

export function setStoredAiAccessCode(code: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (code.trim()) {
    window.localStorage.setItem(aiAccessCodeStorageKey, code.trim());
  } else {
    window.localStorage.removeItem(aiAccessCodeStorageKey);
  }
}

export async function fetchAiServiceStatus(): Promise<AiServiceStatus | null> {
  try {
    const response = await fetch("/api/ai/document-classification", {
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      mode?: string;
      requiresAccessCode?: boolean;
    };

    return {
      mode: payload.mode === "live" ? "live" : "mock",
      requiresAccessCode: Boolean(payload.requiresAccessCode),
    };
  } catch {
    return null;
  }
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image-load-failed"));
    };
    image.src = objectUrl;
  });
}

// מכווץ תמונה לפני שליחה — חוסך עלות, רוחב פס וזמן תגובה.
async function compressImageToBase64(file: File) {
  const image = await loadImageFromFile(file);
  const scale = Math.min(
    1,
    maxImageDimension / Math.max(image.width, image.height)
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("canvas-unavailable");
  }

  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", compressedJpegQuality);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function toAnalysisFile(file: File): Promise<DocumentAnalysisFile> {
  const baseFile: DocumentAnalysisFile = {
    name: file.name,
    type: file.type || "לא ידוע",
    size: file.size,
  };

  try {
    if (file.type.startsWith("image/")) {
      return {
        ...baseFile,
        type: "image/jpeg",
        data: await compressImageToBase64(file),
      };
    }

    if (file.type === "application/pdf" && file.size <= 2_500_000) {
      return { ...baseFile, data: await readFileAsBase64(file) };
    }
  } catch {
    // אם הכיווץ נכשל שולחים בלי תוכן — הניתוח ייפול ל-mock.
  }

  return baseFile;
}

function toSuggestion(analysis: DocumentAnalysisResult): DocumentAiSuggestion {
  return {
    title: analysis.extracted.documentType,
    category: analysis.extracted.suggestedCategory,
    summary: analysis.extracted.summary,
    tags: analysis.extracted.tags,
    confidence: analysis.extracted.confidence,
    analysis,
  };
}

export type SmartAnalysisInput = {
  title: string;
  description: string;
  files: File[];
};

// הניתוח המלא: במצב דמו או בכשל — mock מקומי; אחרת ניתוח אמיתי בשרת.
export async function analyzeDocumentSmart(
  input: SmartAnalysisInput
): Promise<DocumentAiSuggestion> {
  const localFallback = () =>
    suggestDocumentClassification({
      title: input.title,
      description: input.description,
      files: input.files.map((file) => ({
        name: file.name,
        type: file.type || "לא ידוע",
      })),
    });

  // מצב דמו לעולם לא קורא ל-AI בתשלום.
  if (isDemoModeActive()) {
    return localFallback();
  }

  try {
    const analysisFiles = await Promise.all(input.files.map(toAnalysisFile));

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    const accessCode = getStoredAiAccessCode();

    if (accessCode) {
      headers["x-nestly-access-code"] = accessCode;
    }

    const response = await fetch("/api/ai/document-classification", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        files: analysisFiles,
      }),
    });

    if (response.status === 401) {
      throw new Error("invalid-access-code");
    }

    if (!response.ok) {
      return localFallback();
    }

    const payload = (await response.json()) as {
      analysis?: DocumentAnalysisResult;
    };

    if (!payload.analysis) {
      return localFallback();
    }

    return toSuggestion(payload.analysis);
  } catch (error) {
    if (error instanceof Error && error.message === "invalid-access-code") {
      throw error;
    }

    return localFallback();
  }
}
