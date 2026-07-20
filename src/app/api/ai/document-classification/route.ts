import { NextResponse } from "next/server";
import {
  analyzeDocumentWithAnthropic,
  hasAnalyzableFileData,
} from "@/lib/ai/anthropicDocumentAnalyzer";
import { analyzeDocumentWithGemini } from "@/lib/ai/geminiDocumentAnalyzer";
import { analyzeDocumentWithMock } from "@/lib/ai";
import {
  getClientKeyFromRequest,
  isRateLimited,
} from "@/lib/ai/rateLimiter";
import type {
  DocumentAnalysisFile,
  DocumentAnalysisInput,
} from "@/types/documentAnalysis";

// ניתוח עם ראייה יכול לקחת יותר מ-10 שניות — מאריכים את מגבלת הפונקציה.
export const maxDuration = 60;

const maxFiles = 4;
const maxTextFieldLength = 2_000;
// base64 של תמונה מכווצת ~200-500K תווים; תקרה נדיבה אך בטוחה.
const maxTotalFileDataLength = 4_000_000;

function sanitizeFile(value: unknown): DocumentAnalysisFile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const file = value as Partial<DocumentAnalysisFile>;

  if (typeof file.name !== "string" || typeof file.type !== "string") {
    return null;
  }

  return {
    name: file.name.slice(0, 300),
    type: file.type.slice(0, 100),
    textPreview:
      typeof file.textPreview === "string"
        ? file.textPreview.slice(0, maxTextFieldLength)
        : undefined,
    data: typeof file.data === "string" ? file.data : undefined,
  };
}

function sanitizeInput(value: unknown): DocumentAnalysisInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Partial<DocumentAnalysisInput>;

  if (!Array.isArray(input.files) || input.files.length > maxFiles) {
    return null;
  }

  const files: DocumentAnalysisFile[] = [];

  for (const rawFile of input.files) {
    const file = sanitizeFile(rawFile);

    if (!file) {
      return null;
    }

    files.push(file);
  }

  const totalDataLength = files.reduce(
    (total, file) => total + (file.data?.length ?? 0),
    0
  );

  if (totalDataLength > maxTotalFileDataLength) {
    return null;
  }

  return {
    title:
      typeof input.title === "string"
        ? input.title.slice(0, maxTextFieldLength)
        : undefined,
    description:
      typeof input.description === "string"
        ? input.description.slice(0, maxTextFieldLength)
        : undefined,
    files,
  };
}

// Gemini הוא הספק הראשי; Anthropic נתמך כחלופה כשמוגדר רק המפתח שלו.
function getAiStatus() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const anthropicConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

  return {
    geminiConfigured,
    anthropicConfigured,
    aiConfigured: geminiConfigured || anthropicConfigured,
    requiresAccessCode: Boolean(process.env.NESTLY_AI_ACCESS_CODE),
  };
}

export async function GET() {
  const status = getAiStatus();

  return NextResponse.json({
    mode: status.aiConfigured ? "live" : "mock",
    requiresAccessCode: status.requiresAccessCode,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text().catch(() => "");

  if (rawBody.length > maxTotalFileDataLength + 100_000) {
    return NextResponse.json({ error: "payload-too-large" }, { status: 413 });
  }

  let parsedBody: unknown = null;

  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    parsedBody = null;
  }

  const input = sanitizeInput(parsedBody);

  if (!input) {
    return NextResponse.json(
      { error: "invalid-analysis-payload" },
      { status: 400 }
    );
  }

  const status = getAiStatus();
  const wantsLiveAnalysis = status.aiConfigured && hasAnalyzableFileData(input);

  if (!wantsLiveAnalysis) {
    return NextResponse.json({
      mode: "mock",
      analysis: analyzeDocumentWithMock(input),
    });
  }

  // מכאן והלאה — קריאת AI בתשלום: קוד גישה + הגבלת קצב.
  if (status.requiresAccessCode) {
    const providedCode = request.headers.get("x-nestly-access-code") ?? "";

    if (providedCode !== process.env.NESTLY_AI_ACCESS_CODE) {
      return NextResponse.json({ error: "invalid-access-code" }, { status: 401 });
    }
  }

  if (isRateLimited(getClientKeyFromRequest(request))) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  try {
    const analysis = status.geminiConfigured
      ? await analyzeDocumentWithGemini(
          input,
          process.env.GEMINI_API_KEY as string
        )
      : await analyzeDocumentWithAnthropic(
          input,
          process.env.ANTHROPIC_API_KEY as string
        );

    return NextResponse.json({ mode: "live", analysis });
  } catch {
    // כשל בניתוח החי — חוזרים ל-mock כדי שהמשתמש לא ייתקע.
    const fallback = analyzeDocumentWithMock(input);
    fallback.warnings = [
      "הניתוח החכם נכשל הפעם — מוצג ניתוח בסיסי בלבד.",
      ...fallback.warnings,
    ];

    return NextResponse.json({ mode: "mock", analysis: fallback });
  }
}
