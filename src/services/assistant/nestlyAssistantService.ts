import { readKnowledgeItems } from "@/services/familyKnowledge";
import {
  getGlobalSearchResults,
  type GlobalSearchResult,
} from "@/services/globalSearch";
import { getCommandCenterSections } from "@/services/commandCenterService";
import { getTimelineItems } from "@/services/timelineService";
import type { AppLanguage } from "@/i18n/config";
import type {
  AssistantAnswer,
  AssistantIntent,
  AssistantRelatedAction,
  AssistantRequest,
  AssistantSourceModule,
  AssistantSourceRecord,
} from "@/types/assistant";
import type { CommandCenterItem } from "@/types/commandCenter";
import type { TimelineItem } from "@/types/timeline";
import type { AppRoute } from "@/types/navigation";
import { createUuid } from "@/utils/ids";

const noSavedInfo = {
  he: "לא מצאתי מידע שמור על זה.",
  en: "I could not find saved information about that.",
};

const defaultQuestions = {
  he: [
    "מה דורש תשומת לב היום?",
    "מה קרה השבוע במשפחה?",
    "איפה הקבלה האחרונה?",
    "מה מצב הרכב?",
  ],
  en: [
    "What needs attention today?",
    "What happened this week?",
    "Where is the latest receipt?",
    "What is the vehicle status?",
  ],
};

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${createUuid()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function getLanguage(language?: AppLanguage): "he" | "en" {
  return language === "en" ? "en" : "he";
}

function classifyIntent(query: string): AssistantIntent {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return "daily_brief";
  }

  if (/(receipt|קבלה|חשבונית|סופר|scan|סריקה)/i.test(normalized)) {
    return "find_receipt";
  }

  if (/(vehicle|car|רכב|רכבים|טסט|ביטוח|קילומטר|טיפול)/i.test(normalized)) {
    return "vehicle_status";
  }

  if (/(week|שבוע|השבוע|לאחרונה|recent|קרה)/i.test(normalized)) {
    return "weekly_brief";
  }

  if (/(ידע|זוכר|remember|knowledge|סוד|טיפ|מנהג|משפחה)/i.test(normalized)) {
    return "family_knowledge";
  }

  if (/(today|היום|דחוף|חשוב|attention|תשומת)/i.test(normalized)) {
    return "daily_brief";
  }

  return "find_record";
}

function moduleFromRoute(route: AppRoute): AssistantSourceModule {
  const routeModule = route.replace("/", "");

  if (route === "/") return "system";
  if (route === "/birthdays") return "events";
  if (route === "/command-center") return "command_center";
  if (route === "/timeline") return "timeline";
  if (route === "/knowledge") return "knowledge";

  return (routeModule || "system") as AssistantSourceModule;
}

function sourceFromSearchResult(result: GlobalSearchResult): AssistantSourceRecord {
  return {
    id: result.id,
    title: result.title,
    excerpt: result.description,
    module: moduleFromRoute(result.href),
    route: result.href,
    entityType: "search_result",
    entityId: result.id,
  };
}

function sourceFromCommandItem(item: CommandCenterItem): AssistantSourceRecord {
  return {
    id: `command-${item.id}`,
    title: item.title,
    excerpt: item.reason || item.description,
    module: item.sourceModule === "smart_inbox" ? "documents" : item.sourceModule,
    route: item.sourceUrl,
    entityType: item.sourceEntityType,
    entityId: item.sourceEntityId,
    date: item.dueAt || item.startsAt || item.generatedAt,
  };
}

function sourceFromTimelineItem(item: TimelineItem): AssistantSourceRecord {
  return {
    id: `timeline-${item.id}`,
    title: item.title,
    excerpt: item.description,
    module: "timeline",
    route: item.sourceUrl ?? "/timeline",
    entityType: item.sourceEntityType,
    entityId: item.sourceEntityId,
    date: item.occurredAt,
  };
}

function uniqueSources(sources: AssistantSourceRecord[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    const key = `${source.module}:${source.entityType}:${source.entityId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function actionForSource(source: AssistantSourceRecord): AssistantRelatedAction {
  return {
    id: createId("assistant_action"),
    type: "open_source",
    label: source.route === "/timeline" ? "פתח בציר הזמן" : "פתח מקור",
    description: source.title,
    route: source.route,
    sourceRecordIds: [source.id],
    requiresConfirmation: false,
  };
}

function buildAnswer(input: {
  query: string;
  intent: AssistantIntent;
  language: "he" | "en";
  sources: AssistantSourceRecord[];
  bullets: string[];
  warnings?: string[];
  missingInformation?: string[];
}) {
  const sources = uniqueSources(input.sources).slice(0, 8);
  const hasSources = sources.length > 0;
  const bullets = input.bullets.filter(Boolean).slice(0, 5);
  const answer =
    hasSources && bullets.length > 0
      ? input.language === "en"
        ? `I found ${sources.length} saved source${sources.length === 1 ? "" : "s"} that can answer this.`
        : `מצאתי ${sources.length} מקורות שמורים שיכולים לענות על זה.`
      : noSavedInfo[input.language];

  return {
    id: createId("assistant_answer"),
    query: input.query,
    intent: input.intent,
    answer,
    summaryBullets: hasSources ? bullets : [],
    sourceRecords: hasSources ? sources : [],
    relatedActions: hasSources ? sources.slice(0, 3).map(actionForSource) : [],
    confidence: hasSources && sources.length > 2 ? "high" : hasSources ? "medium" : "low",
    generatedBy: "deterministic",
    warnings: input.warnings ?? [],
    missingInformation: hasSources ? input.missingInformation ?? [] : [noSavedInfo[input.language]],
    createdAt: new Date().toISOString(),
    requiresUserReview: true,
  } satisfies AssistantAnswer;
}

function answerDailyBrief(query: string, language: "he" | "en") {
  const sections = getCommandCenterSections({ includeCompleted: true });
  const items = [
    ...(sections.urgent ?? []),
    ...(sections.today ?? []),
    ...(sections.waiting ?? []),
    ...(sections.upcoming ?? []),
  ].slice(0, 6);
  const sources = items.map(sourceFromCommandItem);
  const bullets = items.map((item) =>
    language === "en"
      ? `${item.title} - ${item.reason}`
      : `${item.title} - ${item.reason}`
  );

  return buildAnswer({
    query,
    intent: "daily_brief",
    language,
    sources,
    bullets,
  });
}

function answerWeeklyBrief(query: string, language: "he" | "en", now: Date) {
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const timelineItems = getTimelineItems({
    dateFrom: weekAgo.toISOString(),
    dateTo: now.toISOString(),
    limit: 8,
  }).items;
  const sources = timelineItems.map(sourceFromTimelineItem);
  const bullets = timelineItems.map((item) => {
    const date = new Intl.DateTimeFormat(language === "en" ? "en-US" : "he-IL", {
      day: "numeric",
      month: "short",
    }).format(new Date(item.occurredAt));

    return `${item.title} - ${date}`;
  });

  return buildAnswer({
    query,
    intent: "weekly_brief",
    language,
    sources,
    bullets,
  });
}

function answerKnowledge(query: string, language: "he" | "en") {
  const normalized = normalizeQuery(query);
  const items = readKnowledgeItems({ includeArchived: false })
    .filter((item) =>
      [item.title, item.content, item.category, ...item.tags, ...item.searchKeywords]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    )
    .slice(0, 6);
  const sources: AssistantSourceRecord[] = items.map((item) => ({
    id: `knowledge-${item.id}`,
    title: item.title,
    excerpt: item.content.slice(0, 140),
    module: "knowledge",
    route: "/knowledge",
    entityType: "knowledge_item",
    entityId: item.id,
    date: item.updatedAt,
  }));
  const bullets = items.map((item) => `${item.title} - ${item.content.slice(0, 90)}`);

  return buildAnswer({
    query,
    intent: "family_knowledge",
    language,
    sources,
    bullets,
  });
}

function answerSearch(query: string, language: "he" | "en", intent: AssistantIntent) {
  const searchQuery =
    intent === "vehicle_status" && !query.trim()
      ? language === "en"
        ? "vehicle"
        : "רכב"
      : query;
  const results = getGlobalSearchResults(searchQuery, language).slice(0, 8);
  const sources = results.map(sourceFromSearchResult);
  const bullets = results.map((result) => `${result.title} - ${result.description}`);

  return buildAnswer({
    query,
    intent,
    language,
    sources,
    bullets,
  });
}

export function askNestlyAssistant(request: AssistantRequest): AssistantAnswer {
  const language = getLanguage(request.language);
  const query = request.query.trim();
  const intent = classifyIntent(query);
  const now = request.now ?? new Date();

  if (intent === "daily_brief") {
    return answerDailyBrief(query, language);
  }

  if (intent === "weekly_brief" || intent === "recent_activity") {
    return answerWeeklyBrief(query, language, now);
  }

  if (intent === "family_knowledge") {
    const knowledgeAnswer = answerKnowledge(query, language);

    return knowledgeAnswer.sourceRecords.length > 0
      ? knowledgeAnswer
      : answerSearch(query, language, intent);
  }

  if (intent === "find_receipt") {
    return answerSearch(query || (language === "en" ? "receipt" : "קבלה"), language, intent);
  }

  if (intent === "vehicle_status") {
    return answerSearch(query || (language === "en" ? "vehicle" : "רכב"), language, intent);
  }

  return answerSearch(query, language, intent);
}

export function getAssistantDefaultQuestions(language?: AppLanguage) {
  return defaultQuestions[getLanguage(language)];
}
