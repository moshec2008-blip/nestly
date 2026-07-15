import type { AppRoute } from "@/types/navigation";

export type KnowledgeVisibility = "family" | "private" | "restricted";

export type KnowledgeLinkedModule =
  | "home"
  | "vehicles"
  | "family"
  | "health"
  | "documents"
  | "finance"
  | "shopping"
  | "tasks"
  | "events"
  | "general";

export type KnowledgeAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  reference?: string;
};

export type FamilyKnowledgeItem = {
  id: string;
  familySpaceId?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  linkedModule?: KnowledgeLinkedModule;
  linkedEntityId?: string;
  linkedFamilyMemberId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
  visibility: KnowledgeVisibility;
  attachments: KnowledgeAttachment[];
  sourceNoteId?: string;
  sourceDocumentId?: string;
  searchKeywords: string[];
  lastViewed?: string;
  favorite: boolean;
};

export type KnowledgeCreateInput = {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  linkedModule?: KnowledgeLinkedModule;
  linkedEntityId?: string;
  linkedFamilyMemberId?: string;
  sourceNoteId?: string;
  sourceDocumentId?: string;
  createdBy?: string;
};

export type KnowledgeCategory = {
  id: string;
  label: string;
  description: string;
  linkedModule: KnowledgeLinkedModule;
  href?: AppRoute;
};

export function isFamilyKnowledgeItem(
  value: unknown
): value is FamilyKnowledgeItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<FamilyKnowledgeItem>;

  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.content === "string" &&
    typeof item.category === "string" &&
    Array.isArray(item.tags) &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string" &&
    typeof item.pinned === "boolean" &&
    typeof item.archived === "boolean" &&
    typeof item.favorite === "boolean" &&
    Array.isArray(item.attachments) &&
    Array.isArray(item.searchKeywords)
  );
}
