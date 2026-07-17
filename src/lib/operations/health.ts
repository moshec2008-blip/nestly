import packageJson from "../../../package.json";
import { getFeatureFlagDefinitions, getFeatureFlags } from "@/lib/featureFlags";

export type OperationalStatus =
  | "healthy"
  | "degraded"
  | "not_configured"
  | "unknown";

export type OperationalHealthItem = {
  id: string;
  label: string;
  status: OperationalStatus;
  detail: string;
};

export type OperationalHealthSnapshot = {
  generatedAt: string;
  deployment: {
    version: string;
    environment: string;
    operationsEnabled: boolean;
  };
  services: OperationalHealthItem[];
  featureFlags: Array<{
    key: string;
    label: string;
    stage: string;
    enabled: boolean;
    envName: string;
    description: string;
  }>;
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function envStatus(required: string[], configuredDetail: string) {
  const missing = required.filter((name) => !hasEnv(name));

  if (missing.length === 0) {
    return {
      status: "healthy" as const,
      detail: configuredDetail,
    };
  }

  return {
    status: "not_configured" as const,
    detail: `Missing ${missing.join(", ")}`,
  };
}

export function isOperationsEnabled() {
  return process.env.NESTLY_INTERNAL_OPERATIONS_ENABLED === "true";
}

export function getOperationalHealthSnapshot(): OperationalHealthSnapshot {
  const googleAuth = envStatus(
    ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    "Google OAuth environment variables are present."
  );
  const authSecret = envStatus(
    ["NEXTAUTH_SECRET"],
    "Auth secret is configured."
  );
  const aiProvider = hasEnv("ANTHROPIC_API_KEY")
    ? {
        status: "healthy" as const,
        detail: "Anthropic API key is configured.",
      }
    : {
        status: "not_configured" as const,
        detail: "ANTHROPIC_API_KEY is missing; AI falls back where supported.",
      };
  const emailProvider = hasEnv("NEXT_PUBLIC_FEEDBACK_EMAIL")
    ? {
        status: "degraded" as const,
        detail: "Feedback email is configured, but there is no server email provider.",
      }
    : {
        status: "not_configured" as const,
        detail: "No server email provider is configured.",
      };

  const flags = getFeatureFlags();

  return {
    generatedAt: new Date().toISOString(),
    deployment: {
      version: packageJson.version,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      operationsEnabled: isOperationsEnabled(),
    },
    services: [
      {
        id: "api",
        label: "API availability",
        status: "healthy",
        detail: "Next.js API routes are available in this build.",
      },
      {
        id: "database",
        label: "Database",
        status: "not_configured",
        detail: "No production database adapter is connected yet.",
      },
      {
        id: "storage",
        label: "Storage",
        status: "degraded",
        detail: "Storage is local/browser based. Cloud storage is not connected.",
      },
      {
        id: "auth-google",
        label: "Google authentication",
        status: googleAuth.status,
        detail: googleAuth.detail,
      },
      {
        id: "auth-secret",
        label: "Auth secret",
        status: authSecret.status,
        detail: authSecret.detail,
      },
      {
        id: "ai-provider",
        label: "AI provider",
        status: aiProvider.status,
        detail: aiProvider.detail,
      },
      {
        id: "email-provider",
        label: "Email provider",
        status: emailProvider.status,
        detail: emailProvider.detail,
      },
      {
        id: "jobs",
        label: "Background jobs",
        status: "degraded",
        detail: "Local job queue exists. No durable server worker is connected.",
      },
    ],
    featureFlags: getFeatureFlagDefinitions().map((definition) => ({
      key: definition.key,
      label: definition.label,
      stage: definition.stage,
      enabled: flags[definition.key],
      envName: definition.envName,
      description: definition.description,
    })),
  };
}
