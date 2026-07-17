import { NextResponse } from "next/server";
import {
  getOperationalHealthSnapshot,
  isOperationsEnabled,
} from "@/lib/operations/health";

export function GET() {
  if (!isOperationsEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(getOperationalHealthSnapshot(), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
