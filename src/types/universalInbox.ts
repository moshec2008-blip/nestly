import type {
  EntityRelationType,
  EntityRelationshipType,
} from "@/types/entityRelations";
import type { AppRoute } from "@/types/navigation";

export type UniversalInboxInputSource =
  | "text"
  | "voice"
  | "photo"
  | "camera_scan"
  | "pdf"
  | "document"
  | "screenshot"
  | "shared_file"
  | "clipboard"
  | "email_forward"
  | "whatsapp_share"
  | "browser_share"
  | "bulk_import";

export type UniversalInboxStageId =
  | "receive"
  | "normalize"
  | "extract"
  | "classify"
  | "detect_entities"
  | "suggest_relationships"
  | "plan_actions"
  | "review"
  | "persist";

export type UniversalInboxClassification =
  | "receipt"
  | "document"
  | "invoice"
  | "warranty"
  | "medical"
  | "shopping"
  | "task"
  | "reminder"
  | "vehicle"
  | "property"
  | "finance"
  | "note"
  | "photo"
  | "unknown";

export type UniversalInboxActionType =
  | "create_task"
  | "create_reminder"
  | "attach_to_life_event"
  | "store_document"
  | "add_transaction"
  | "add_shopping_item"
  | "update_existing_entity"
  | "create_warranty_reminder"
  | "save_as_knowledge";

export type UniversalInboxFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  sourceHint: UniversalInboxInputSource;
};

export type UniversalInboxPipelineStage = {
  id: UniversalInboxStageId;
  label: string;
  status: "pending" | "running" | "complete" | "needs_review";
  detail: string;
};

export type UniversalInboxDetectedEntity = {
  id: string;
  entityType: EntityRelationType;
  entityId?: string;
  label: string;
  description: string;
  confidence: number;
  duplicateRisk: "low" | "medium" | "high";
  href?: AppRoute;
};

export type UniversalInboxRelationshipSuggestion = {
  id: string;
  sourceEntityType: EntityRelationType;
  sourceEntityId: string;
  targetEntityType: EntityRelationType;
  targetEntityId: string;
  relationshipType: EntityRelationshipType;
  title: string;
  reason: string;
  confidence: number;
  accepted: boolean;
};

export type UniversalInboxSuggestedAction = {
  id: string;
  type: UniversalInboxActionType;
  title: string;
  description: string;
  href: AppRoute;
  confidence: number;
  explanation: string;
  fields: Record<string, string | number | boolean | undefined>;
  accepted: boolean;
  savedEntityId?: string;
};

export type UniversalInboxItem = {
  id: string;
  source: UniversalInboxInputSource;
  title: string;
  rawText: string;
  normalizedText: string;
  files: UniversalInboxFile[];
  summary: string;
  classifications: {
    type: UniversalInboxClassification;
    confidence: number;
    explanation: string;
  }[];
  entities: UniversalInboxDetectedEntity[];
  relationships: UniversalInboxRelationshipSuggestion[];
  actions: UniversalInboxSuggestedAction[];
  stages: UniversalInboxPipelineStage[];
  status: "new" | "reviewed" | "saved" | "archived" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export function isUniversalInboxItem(
  value: unknown
): value is UniversalInboxItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<UniversalInboxItem>;

  return (
    typeof item.id === "string" &&
    typeof item.source === "string" &&
    typeof item.title === "string" &&
    typeof item.rawText === "string" &&
    typeof item.normalizedText === "string" &&
    Array.isArray(item.files) &&
    Array.isArray(item.classifications) &&
    Array.isArray(item.entities) &&
    Array.isArray(item.relationships) &&
    Array.isArray(item.actions) &&
    Array.isArray(item.stages) &&
    typeof item.status === "string" &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}
