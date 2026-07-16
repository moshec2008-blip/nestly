import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

export type SearchEntityType =
  | "command"
  | "module"
  | "task"
  | "shopping"
  | "finance"
  | "document"
  | "vehicle"
  | "family"
  | "event"
  | "health"
  | "knowledge"
  | "timeline"
  | "capture"
  | "permission";

export type SearchDocumentVisibility = "family" | "private" | "demo" | "guest";

export type SearchDocument = {
  id: string;
  familySpaceId: string;
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  subtitle: string;
  searchableText: string;
  keywords: string[];
  tags: string[];
  module: string;
  route: AppRoute;
  icon: AppIconName;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  status?: string;
  ownerMemberId?: string;
  visibility: SearchDocumentVisibility;
  sourcePriority: number;
  rankingSignals?: Record<string, number | boolean | string>;
  metadata?: Record<string, string | number | boolean | null>;
};

export type SearchResultGroup = {
  id: string;
  label: string;
  results: SearchDocument[];
};
