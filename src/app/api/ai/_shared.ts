import { NextResponse } from "next/server";
import { getAIConfig, getAISetupMessage } from "@/lib/ai/config";
import { getCapabilityForAnalysis } from "@/lib/ai/capabilities";
import type { AIUserMode, AnalysisType, AISafeError } from "@/lib/ai/types";
import {
  buildBaseAnalyzeInput,
  type RawAnalyzeRequest,
} from "@/services/aiRequestFactory";
import { toSafeAIError } from "@/services/documentAnalysisService";

export const aiRouteMaxDuration = 60;

function getUserMode(raw: RawAnalyzeRequest): AIUserMode {
  return raw.userMode || "basic";
}

export async function readAnalyzeRequest(request: Request) {
  const rawBody = await request.text().catch(() => "");

  if (rawBody.length > 8_000_000) {
    throw {
      code: "file_too_large",
      message: "הקובץ גדול מדי לניתוח.",
      status: 413,
    } satisfies AISafeError;
  }

  return JSON.parse(rawBody || "{}") as RawAnalyzeRequest;
}

export function createAnalyzeInput(raw: RawAnalyzeRequest) {
  return buildBaseAnalyzeInput(raw);
}

export function assertAIAccess(raw: RawAnalyzeRequest, analysisType: AnalysisType) {
  const config = getAIConfig();

  if (!config.enabled) {
    throw {
      code: "ai_disabled",
      message: getAISetupMessage(config),
      status: 503,
    } satisfies AISafeError;
  }

  const capability = getCapabilityForAnalysis(getUserMode(raw), analysisType);

  if (!capability.allowed) {
    throw {
      code: "ai_disabled",
      message: capability.reason || "הסריקה אינה זמינה במצב הנוכחי.",
      status: capability.requiresAuth ? 401 : 403,
    } satisfies AISafeError;
  }
}

export function jsonSuccess<T>(analysis: T) {
  return NextResponse.json({
    ok: true,
    analysis,
    message: "הניתוח מוכן לבדיקה. לא נשמרו שינויים.",
  });
}

export function jsonError(error: unknown) {
  const safeError = toSafeAIError(error);

  return NextResponse.json(
    {
      ok: false,
      error: safeError.code,
      message: safeError.message,
    },
    { status: safeError.status }
  );
}
