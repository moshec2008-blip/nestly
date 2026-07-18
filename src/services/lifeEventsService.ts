import { initialLifeEvents, lifeEventTemplates } from "@/data/lifeEvents";
import { storageKeys } from "@/lib/storageKeys";
import {
  createRelation,
  suggestRelation,
} from "@/services/entityRelationsService";
import type {
  EntityReference,
  EntityRelation,
} from "@/types/entityRelations";
import {
  isLifeEvent,
  type LifeEvent,
  type LifeEventTemplate,
  type LifeEventType,
} from "@/types/lifeEvents";
import { readStorageArray, writeStorage } from "@/utils/storage";

export type LifeEventLinkSuggestion = {
  event: LifeEvent;
  target: EntityReference;
  confidence: number;
  reason: string;
};

export function readLifeEvents() {
  return readStorageArray<LifeEvent>(
    storageKeys.lifeEvents,
    initialLifeEvents,
    isLifeEvent
  );
}

export function writeLifeEvents(events: LifeEvent[]) {
  writeStorage(storageKeys.lifeEvents, events);
}

export function getLifeEventById(eventId: string) {
  return readLifeEvents().find((event) => event.id === eventId) ?? null;
}

export function getActiveLifeEvents() {
  return readLifeEvents()
    .filter((event) => event.status === "active" || event.status === "planning")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLifeEventTemplate(
  type: LifeEventType
): LifeEventTemplate | null {
  return lifeEventTemplates.find((template) => template.type === type) ?? null;
}

export function calculateLifeEventProgress(event: LifeEvent) {
  const milestoneProgress =
    event.milestones.length === 0
      ? event.progress
      : Math.round(
          (event.milestones.filter((milestone) => milestone.status === "done")
            .length /
            event.milestones.length) *
            100
        );

  return Math.round((event.progress + milestoneProgress) / 2);
}

export function suggestLifeEventLinks(
  target: EntityReference,
  keywords: string[]
): LifeEventLinkSuggestion[] {
  const normalizedKeywords = keywords
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedKeywords.length === 0) {
    return [];
  }

  return getActiveLifeEvents()
    .map((event) => {
      const searchableText = [
        event.title,
        event.subtitle,
        event.story,
        event.type,
        ...event.tags,
        ...event.milestones.map((milestone) => milestone.title),
      ]
        .join(" ")
        .toLowerCase();

      const matches = normalizedKeywords.filter((keyword) =>
        searchableText.includes(keyword)
      ).length;
      const confidence = Math.min(0.62 + matches * 0.12, 0.94);

      return {
        event,
        target,
        confidence,
        reason:
          matches > 0
            ? "נמצא דמיון בין המידע החדש לבין סיפור חיים פעיל."
            : "האירוע פעיל ועשוי להיות הקשר רלוונטי.",
      };
    })
    .filter((suggestion) => suggestion.confidence >= 0.72)
    .sort((a, b) => b.confidence - a.confidence);
}

export function ensureLifeEventRelations(event: LifeEvent): EntityRelation[] {
  return event.linkedEntities.flatMap((entity) => {
    const input = {
      sourceEntityType: "life_event" as const,
      sourceEntityId: event.id,
      targetEntityType: entity.entityType,
      targetEntityId: entity.entityId,
      relationshipType: entity.relationshipType,
      direction: "bidirectional" as const,
      source: entity.source,
      confidence: entity.confidence,
      reason: `חלק מסיפור החיים: ${event.title}`,
      visibility: event.visibility,
      metadata: {
        lifeEventType: event.type,
        title: entity.title,
      },
    };

    if (entity.confidence >= 0.9) {
      const result = createRelation({
        ...input,
        source: entity.source === "AI_suggestion" ? "rule_based" : entity.source,
        status: "active",
      });

      return result.ok ? [result.relation] : [];
    }

    const relation = suggestRelation(input);
    return relation.ok ? [relation.relation] : [];
  });
}
