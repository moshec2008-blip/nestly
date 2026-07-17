import type { AppIconName } from "@/components/ui/AppIcon";

export type IntegrationCategory =
  | "calendar"
  | "email"
  | "cloud-storage"
  | "contacts"
  | "ai"
  | "banking"
  | "smart-home";

export type IntegrationStatus =
  | "available"
  | "setup_required"
  | "coming_soon"
  | "disabled";

export type IntegrationProviderId =
  | "google-calendar"
  | "google-drive"
  | "google-contacts"
  | "gmail"
  | "anthropic"
  | "gemini"
  | "banking-future"
  | "smart-home-future";

export type IntegrationCapability =
  | "calendar.read"
  | "calendar.write"
  | "contacts.read"
  | "email.send"
  | "storage.read"
  | "storage.write"
  | "ai.analyzeDocument"
  | "ai.analyzeReceipt"
  | "banking.readOnly"
  | "smartHome.readOnly";

export type IntegrationProvider = {
  id: IntegrationProviderId;
  category: IntegrationCategory;
  name: string;
  shortName: string;
  descriptionHe: string;
  descriptionEn: string;
  icon: AppIconName;
  status: IntegrationStatus;
  capabilities: IntegrationCapability[];
  requiresOAuth: boolean;
  requiredEnv?: string[];
  docsHref?: string;
};

export type ConnectedAccount = {
  id: string;
  providerId: IntegrationProviderId;
  accountLabel: string;
  status: "connected" | "expired" | "revoked";
  connectedAt: string;
  expiresAt?: string;
};

