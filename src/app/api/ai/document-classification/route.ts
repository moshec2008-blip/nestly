import { NextResponse } from "next/server";
import {
  suggestDocumentClassification,
  type DocumentAiInput,
} from "@/services/documentAi";

function isDocumentAiInput(value: unknown): value is DocumentAiInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const input = value as Partial<DocumentAiInput>;

  return (
    typeof input.title === "string" &&
    typeof input.description === "string" &&
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

  if (!isDocumentAiInput(body)) {
    return NextResponse.json(
      { error: "Invalid document classification payload" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    mode: "local-preview",
    suggestion: suggestDocumentClassification(body),
  });
}
