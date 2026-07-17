import type { AppRoute } from "@/types/navigation";
import type { KnowledgeLinkedModule } from "@/types/knowledge";
import type { TimelineSourceModule } from "@/types/timeline";

export type LegacyCategory =
  | "home"
  | "family"
  | "documents"
  | "finance"
  | "vehicles"
  | "health"
  | "shopping"
  | "tasks"
  | "events"
  | "knowledge"
  | "custom";

export type LegacySourceType = "timeline" | "knowledge" | "document" | "record";

export type LegacyHistoryItem = {
  id: string;
  title: string;
  description?: string;
  occurredAt: string;
  year: number;
  category: LegacyCategory;
  sourceType: LegacySourceType;
  sourceModule: TimelineSourceModule | KnowledgeLinkedModule | "documents";
  sourceEntityId: string;
  sourceUrl: AppRoute;
  familyMemberIds: string[];
  tags: string[];
  archived: boolean;
  milestone: boolean;
};

export type LegacyCollection = {
  id: string;
  title: string;
  description: string;
  category: LegacyCategory;
  tags: string[];
  linkedRecordIds: string[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export type LegacyArchiveRecord = {
  id: string;
  sourceEntityId: string;
  sourceModule: string;
  sourceType: LegacySourceType;
  archivedAt: string;
  reason?: string;
};

export type KnowledgeRevision = {
  id: string;
  knowledgeItemId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  linkedModule?: KnowledgeLinkedModule;
  createdAt: string;
  restoredAt?: string;
};

export type SmartConnectionReview = {
  id: string;
  title: string;
  description: string;
  sourceEntityId: string;
  suggestedAction: "missing_link" | "duplicate_link" | "outdated_link";
  confidence: "low" | "medium" | "high";
};
