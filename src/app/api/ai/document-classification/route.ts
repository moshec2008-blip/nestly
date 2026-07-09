import { NextResponse } from "next/server";
import { analyzeDocument } from "@/services/documentAnalysis";
import type { DocumentAnalysisInput } from "@/types/documentAnalysis";

function isDocumentAnalysisInput(
  value: unknown
): value is DocumentAnalysisInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<DocumentAnalysisInput>;

  return (
    Array.isArray(input.files) &&
    input.files.every(
      (file) =>
        file &&
        typeof file === "object" &&
        typeof file.name === "string" &&
        typeof file.type === "string"
    )
  );
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  if (!isDocumentAnalysisInput(body)) {
    return NextResponse.json(
      { error: "Invalid document analysis payload" },
      { status: 400 }
    );
  }

  const analysis = await analyzeDocument(body);

  return NextResponse.json({
    mode: "mock",
    analysis,
  });
}
