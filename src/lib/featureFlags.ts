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

export type FeatureFlagStage = "beta" | "production" | "internal";

export type FeatureFlagDefinition = {
  key: NestlyFeatureFlag;
  label: string;
  stage: FeatureFlagStage;
  defaultEnabled: boolean;
  envName: string;
  description: string;
};

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

const flagMetadata: Record<
  NestlyFeatureFlag,
  Omit<FeatureFlagDefinition, "key" | "defaultEnabled" | "envName">
> = {
  familyInvitations: {
    label: "Family invitations",
    stage: "beta",
    description: "Invite relatives into a shared family space.",
  },
  secureDocuments: {
    label: "Secure documents",
    stage: "internal",
    description: "Cloud-backed encrypted document storage foundation.",
  },
  realtimeShopping: {
    label: "Realtime shopping",
    stage: "internal",
    description: "Live shared shopping list updates.",
  },
  realtimeTasks: {
    label: "Realtime tasks",
    stage: "internal",
    description: "Live shared task updates.",
  },
  assistant: {
    label: "Nestly assistant",
    stage: "beta",
    description: "Contextual family assistant surfaces.",
  },
  proactiveAI: {
    label: "Proactive AI",
    stage: "internal",
    description: "Non-interruptive AI suggestions across modules.",
  },
  multipleFamilySpaces: {
    label: "Multiple family spaces",
    stage: "internal",
    description: "Support more than one family space per account.",
  },
  emailNotifications: {
    label: "Email notifications",
    stage: "internal",
    description: "Email delivery for reminders and invitations.",
  },
  closedBetaFeedback: {
    label: "Closed beta feedback",
    stage: "beta",
    description: "Privacy-safe feedback collection during beta.",
  },
  cloudPersistence: {
    label: "Cloud persistence",
    stage: "internal",
    description: "Database-backed persistence instead of local storage.",
  },
  automations: {
    label: "Automations",
    stage: "internal",
    description: "Background automation and family workflows.",
  },
  smartTemplates: {
    label: "Smart templates",
    stage: "beta",
    description: "Reusable templates for common family routines.",
  },
  smartCollections: {
    label: "Smart collections",
    stage: "beta",
    description: "Grouped family knowledge and document collections.",
  },
  importExport: {
    label: "Import and export",
    stage: "internal",
    description: "Structured backup and restore flows.",
  },
  advancedBackup: {
    label: "Advanced backup",
    stage: "beta",
    description: "Local backup and restore controls.",
  },
  offlineQueue: {
    label: "Offline queue",
    stage: "internal",
    description: "Queue actions until connectivity returns.",
  },
  releaseNotes: {
    label: "Release notes",
    stage: "production",
    description: "User-facing release note surfaces.",
  },
};

export function getFeatureFlags() {
  return Object.fromEntries(
    (Object.keys(defaultFlags) as NestlyFeatureFlag[]).map((flag) => [
      flag,
      readBooleanEnv(process.env[envNameForFlag(flag)], defaultFlags[flag]),
    ])
  ) as Record<NestlyFeatureFlag, boolean>;
}

export function getFeatureFlagDefinitions(): FeatureFlagDefinition[] {
  return (Object.keys(defaultFlags) as NestlyFeatureFlag[]).map((flag) => ({
    key: flag,
    defaultEnabled: defaultFlags[flag],
    envName: envNameForFlag(flag),
    ...flagMetadata[flag],
  }));
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
