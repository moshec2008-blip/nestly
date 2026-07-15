import { getAIConfig } from "@/lib/ai/config";
import type { AIProviderId } from "@/lib/ai/types";
import {
  appendAIAuditRecord,
  upsertAISuggestion,
  updateAISuggestionStatus,
} from "@/repositories/aiSuggestionRepository";
import type {
  AISuggestion,
  AISuggestionCreateInput,
} from "@/types/aiSuggestions";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function confidenceLevel(confidence: number): AISuggestion["confidenceLevel"] {
  if (confidence >= 0.82) return "high";
  if (confidence >= 0.58) return "medium";
  return "low";
}

export function createAISuggestion(input: AISuggestionCreateInput) {
  const suggestion: AISuggestion = {
    ...input,
    id: input.id ?? createId("suggestion"),
    requiresConfirmation: true,
    createdAt: new Date().toISOString(),
    status: input.status ?? "pending",
    confidenceLevel: input.confidenceLevel ?? confidenceLevel(input.confidence),
    resultingEntityIds: input.resultingEntityIds ?? [],
  };

  upsertAISuggestion(suggestion);
  appendAIAuditRecord({
    requestId: suggestion.metadata.requestId ?? createId("ai-request"),
    feature: `${suggestion.sourceModule}:${suggestion.suggestionType}`,
    provider: suggestion.provider,
    status: "shown",
    createdAt: suggestion.createdAt,
    suggestionId: suggestion.id,
    confidenceLevel: suggestion.confidenceLevel,
    resultingEntityIds: [],
  });

  return suggestion;
}

export function getActiveAIProviderLabel(): {
  provider: AIProviderId | "local-rules";
  mode: "disabled" | "mock" | "live" | "local-rules";
} {
  const config = getAIConfig();

  if (!config.enabled || config.mode === "disabled") {
    return { provider: "disabled", mode: "disabled" };
  }

  if (config.mode === "live") {
    return { provider: config.provider, mode: "live" };
  }

  return { provider: "local-rules", mode: "local-rules" };
}

export function acceptAISuggestion(id: string, resultingEntityIds: string[] = []) {
  const suggestion = updateAISuggestionStatus(id, "accepted", resultingEntityIds);

  if (suggestion) {
    appendAIAuditRecord({
      requestId: suggestion.metadata.requestId ?? createId("ai-request"),
      feature: `${suggestion.sourceModule}:${suggestion.suggestionType}`,
      provider: suggestion.provider,
      status: "accepted",
      createdAt: new Date().toISOString(),
      suggestionId: suggestion.id,
      confidenceLevel: suggestion.confidenceLevel,
      resultingEntityIds,
    });
  }

  return suggestion;
}

export function rejectAISuggestion(id: string) {
  const suggestion = updateAISuggestionStatus(id, "rejected");

  if (suggestion) {
    appendAIAuditRecord({
      requestId: suggestion.metadata.requestId ?? createId("ai-request"),
      feature: `${suggestion.sourceModule}:${suggestion.suggestionType}`,
      provider: suggestion.provider,
      status: "rejected",
      createdAt: new Date().toISOString(),
      suggestionId: suggestion.id,
      confidenceLevel: suggestion.confidenceLevel,
      resultingEntityIds: [],
    });
  }

  return suggestion;
}
