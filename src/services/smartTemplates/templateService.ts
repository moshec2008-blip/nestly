import type {
  SmartTemplate,
  SmartTemplatePreview,
} from "@/types/smartTemplates";
import { builtInSmartTemplates } from "@/lib/smartTemplates/builtInTemplates";

export function listBuiltInSmartTemplates(locale: "he" | "en" = "he") {
  return builtInSmartTemplates.filter(
    (template) => template.active && template.locale === locale
  );
}

export function findSmartTemplate(templateId: string) {
  return builtInSmartTemplates.find((template) => template.id === templateId);
}

export function createSmartTemplatePreview(
  template: SmartTemplate,
  startDate = new Date().toISOString()
): SmartTemplatePreview {
  const items = [
    ...template.tasks,
    ...template.checklists,
    ...template.reminders,
    ...template.documentRequirements,
    ...template.shoppingItems,
    ...template.knowledgePrompts,
    ...template.suggestedRelations,
  ];

  return {
    templateId: template.id,
    startDate,
    items,
    counts: {
      tasks: template.tasks.length,
      checklists: template.checklists.length,
      reminders: template.reminders.length,
      documentRequirements: template.documentRequirements.length,
      shoppingItems: template.shoppingItems.length,
      knowledgePrompts: template.knowledgePrompts.length,
      suggestedRelations: template.suggestedRelations.length,
    },
    requiresConfirmation: true,
  };
}
