export type SmartTemplateCategory =
  | "home"
  | "vehicle"
  | "finance"
  | "school"
  | "travel"
  | "documents"
  | "family_project";

export type SmartTemplateSource = "built_in" | "family" | "imported";

export type SmartTemplateItem = {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  defaultOffsetDays?: number;
  suggestedModule: "tasks" | "shopping" | "documents" | "knowledge" | "finance";
};

export type SmartTemplate = {
  id: string;
  title: string;
  description: string;
  category: SmartTemplateCategory;
  icon: string;
  version: number;
  locale: "he" | "en";
  tasks: SmartTemplateItem[];
  checklists: SmartTemplateItem[];
  reminders: SmartTemplateItem[];
  documentRequirements: SmartTemplateItem[];
  shoppingItems: SmartTemplateItem[];
  knowledgePrompts: SmartTemplateItem[];
  suggestedRelations: SmartTemplateItem[];
  estimatedDuration?: string;
  source: SmartTemplateSource;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SmartTemplatePreview = {
  templateId: string;
  startDate: string;
  items: SmartTemplateItem[];
  counts: {
    tasks: number;
    checklists: number;
    reminders: number;
    documentRequirements: number;
    shoppingItems: number;
    knowledgePrompts: number;
    suggestedRelations: number;
  };
  requiresConfirmation: true;
};
