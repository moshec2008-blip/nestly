import { NextResponse } from "next/server";
import { getAuthSetupStatus } from "@/lib/auth";

export async function GET() {
  const setup = getAuthSetupStatus();

  return NextResponse.json({
    googleConfigured: setup.googleConfigured,
    readyForProduction: setup.readyForProduction,
    missing: {
      googleClientId: !setup.hasGoogleClientId,
      googleClientSecret: !setup.hasGoogleClientSecret,
      authSecret: !setup.hasSecret,
      authUrl: !setup.hasUrl,
    },
  });
}
