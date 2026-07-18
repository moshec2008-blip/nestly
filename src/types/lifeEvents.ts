import type {
  EntityReference,
  EntityRelationType,
  EntityRelationshipType,
} from "@/types/entityRelations";
import type { AppIconName } from "@/components/ui/AppIcon";

export type LifeEventType =
  | "buying_vehicle"
  | "moving_home"
  | "renovation"
  | "vacation"
  | "large_purchase"
  | "medical_procedure"
  | "education"
  | "family_celebration"
  | "home_maintenance";

export type LifeEventStatus = "planning" | "active" | "paused" | "completed";
export type LifeEventVisibility = "family" | "private";

export type LifeEventSectionId =
  | "overview"
  | "progress"
  | "people"
  | "tasks"
  | "documents"
  | "expenses"
  | "timeline"
  | "photos"
  | "notes"
  | "related_items"
  | "ai_insights"
  | "quick_actions"
  | "activity";

export type LifeEventMilestone = {
  id: string;
  title: string;
  description: string;
  status: "done" | "current" | "upcoming";
  date?: string;
};

export type LifeEventLinkedEntity = EntityReference & {
  title: string;
  description: string;
  href: string;
  relationshipType: EntityRelationshipType;
  confidence: number;
  source: "manual" | "rule_based" | "AI_suggestion" | "migration" | "system";
};

export type LifeEventPerson = {
  id: string;
  name: string;
  role: string;
};

export type LifeEventExpense = {
  id: string;
  title: string;
  amount: number;
  status: "paid" | "planned" | "pending";
  entityReference?: EntityReference;
};

export type LifeEventTimelineEntry = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
};

export type LifeEventAiInsight = {
  id: string;
  title: string;
  description: string;
  tone: "calm" | "good" | "warning";
  confidence: number;
};

export type LifeEventTemplate = {
  type: LifeEventType;
  title: string;
  description: string;
  icon: AppIconName;
  defaultSections: LifeEventSectionId[];
  suggestedLinks: EntityRelationType[];
};

export type LifeEvent = {
  id: string;
  type: LifeEventType;
  title: string;
  subtitle: string;
  story: string;
  status: LifeEventStatus;
  visibility: LifeEventVisibility;
  progress: number;
  owner: string;
  location?: string;
  startDate: string;
  targetDate?: string;
  updatedAt: string;
  sections: LifeEventSectionId[];
  milestones: LifeEventMilestone[];
  people: LifeEventPerson[];
  linkedEntities: LifeEventLinkedEntity[];
  expenses: LifeEventExpense[];
  timeline: LifeEventTimelineEntry[];
  notes: string[];
  aiInsights: LifeEventAiInsight[];
  tags: string[];
};

export function isLifeEvent(value: unknown): value is LifeEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<LifeEvent>;

  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    typeof event.title === "string" &&
    typeof event.type === "string" &&
    typeof event.progress === "number" &&
    Array.isArray(event.sections) &&
    Array.isArray(event.linkedEntities)
  );
}
