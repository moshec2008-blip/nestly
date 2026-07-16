export type NestlyFeatureFlag =
  | "familyInvitations"
  | "secureDocuments"
  | "realtimeShopping"
  | "realtimeTasks"
  | "assistant"
  | "proactiveAI"
  | "multipleFamilySpaces"
  | "emailNotifications"
  | "closedBetaFeedback"
  | "cloudPersistence"
  | "automations"
  | "smartTemplates"
  | "smartCollections"
  | "importExport"
  | "advancedBackup"
  | "offlineQueue"
  | "releaseNotes";

const defaultFlags: Record<NestlyFeatureFlag, boolean> = {
  familyInvitations: false,
  secureDocuments: false,
  realtimeShopping: false,
  realtimeTasks: false,
  assistant: true,
  proactiveAI: false,
  multipleFamilySpaces: false,
  emailNotifications: false,
  closedBetaFeedback: true,
  cloudPersistence: false,
  automations: false,
  smartTemplates: true,
  smartCollections: true,
  importExport: false,
  advancedBackup: true,
  offlineQueue: false,
  releaseNotes: true,
};

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function envNameForFlag(flag: NestlyFeatureFlag) {
  return `NEXT_PUBLIC_NESTLY_FEATURE_${flag
    .replace(/[A-Z]/g, (letter) => `_${letter}`)
    .toUpperCase()}`;
}

export function getFeatureFlags() {
  return Object.fromEntries(
    (Object.keys(defaultFlags) as NestlyFeatureFlag[]).map((flag) => [
      flag,
      readBooleanEnv(process.env[envNameForFlag(flag)], defaultFlags[flag]),
    ])
  ) as Record<NestlyFeatureFlag, boolean>;
}

export function isFeatureEnabled(flag: NestlyFeatureFlag) {
  return getFeatureFlags()[flag];
}

export function getClosedBetaConfig() {
  return {
    enabled: readBooleanEnv(
      process.env.NEXT_PUBLIC_NESTLY_CLOSED_BETA_ENABLED,
      false
    ),
    label: process.env.NEXT_PUBLIC_NESTLY_BETA_LABEL ?? "Nestly Beta",
  };
}
