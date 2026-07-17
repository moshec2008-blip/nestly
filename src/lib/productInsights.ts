import packageJson from "../../package.json";
import {
  getTelemetryEvents,
  trackTelemetryEvent,
  type TelemetryEvent,
  type TelemetryModule,
} from "@/services/telemetry";

export type BetaFeedbackType = "bug" | "suggestion" | "confusing" | "love";

export type BetaFeedback = {
  id: string;
  type: BetaFeedbackType;
  area: string;
  page: string;
  appVersion: string;
  browser: string;
  screen: string;
  createdAt: string;
  hasContact: boolean;
  summaryLength: number;
};

export type ProductFrictionSignal = {
  id: string;
  module: TelemetryModule;
  reason: "errors" | "abandonment" | "slow";
  count: number;
  severity: "low" | "medium" | "high";
};

export type ProductInsightsSummary = {
  totalEvents: number;
  active: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  modules: Array<{
    module: TelemetryModule;
    opens: number;
    completions: number;
    errors: number;
  }>;
  topEvents: Array<{ name: string; count: number }>;
  friction: ProductFrictionSignal[];
  feedback: {
    total: number;
    byType: Record<BetaFeedbackType, number>;
  };
  healthScore: {
    score: number;
    reasons: string[];
  };
};

const betaFeedbackStorageKey = "nestly-beta-feedback";
const maxStoredFeedback = 200;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getBrowserSummary() {
  if (typeof window === "undefined") {
    return "server";
  }

  const userAgent = window.navigator.userAgent;

  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("Chrome/")) return "Chrome";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Safari/")) return "Safari";
  return "Other";
}

function getScreenSummary() {
  if (typeof window === "undefined") {
    return "server";
  }

  return `${window.innerWidth}x${window.innerHeight}`;
}

function readFeedback(): BetaFeedback[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(betaFeedbackStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as BetaFeedback[]) : [];
  } catch {
    return [];
  }
}

function writeFeedback(items: BetaFeedback[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    betaFeedbackStorageKey,
    JSON.stringify(items.slice(0, maxStoredFeedback))
  );
  window.dispatchEvent(new CustomEvent("nestly-beta-feedback-change"));
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

function countActiveUsers(events: TelemetryEvent[], since: Date) {
  return new Set(
    events
      .filter((event) => new Date(event.timestamp) >= since)
      .map((event) => event.anonymousUserId)
  ).size;
}

function detectFriction(events: TelemetryEvent[]): ProductFrictionSignal[] {
  const byModule = new Map<TelemetryModule, TelemetryEvent[]>();

  events.forEach((event) => {
    byModule.set(event.module, [...(byModule.get(event.module) ?? []), event]);
  });

  const signals: ProductFrictionSignal[] = [];

  byModule.forEach((moduleEvents, module) => {
    const errors = moduleEvents.filter((event) =>
      ["app_error", "ai_request_failed", "document_ai_failed"].includes(
        event.name
      )
    );
    const abandoned = moduleEvents.filter(
      (event) => event.name === "workflow_abandoned"
    );
    const slow = moduleEvents.filter(
      (event) =>
        event.name === "performance_metric" && (event.durationMs ?? 0) > 2500
    );

    [
      { reason: "errors" as const, count: errors.length },
      { reason: "abandonment" as const, count: abandoned.length },
      { reason: "slow" as const, count: slow.length },
    ].forEach((signal) => {
      if (signal.count === 0) return;

      signals.push({
        id: `${module}-${signal.reason}`,
        module,
        reason: signal.reason,
        count: signal.count,
        severity:
          signal.count >= 8 ? "high" : signal.count >= 3 ? "medium" : "low",
      });
    });
  });

  return signals.sort((a, b) => b.count - a.count).slice(0, 8);
}

function calculateHealthScore(
  events: TelemetryEvent[],
  friction: ProductFrictionSignal[],
  feedback: BetaFeedback[]
) {
  const totalSessions = new Set(events.map((event) => event.sessionId)).size || 1;
  const errors = events.filter((event) => event.name === "app_error").length;
  const completions = events.filter((event) =>
    [
      "task_completed",
      "shopping_item_purchased",
      "receipt_confirmed",
      "document_reviewed",
      "smart_capture_completed",
    ].includes(event.name)
  ).length;
  const love = feedback.filter((item) => item.type === "love").length;
  const bug = feedback.filter((item) => item.type === "bug").length;

  let score = 78;
  const reasons: string[] = [];

  if (errors > 0) {
    const penalty = Math.min(20, Math.round((errors / totalSessions) * 10));
    score -= penalty;
    reasons.push(`שגיאות הורידו ${penalty} נקודות`);
  }

  if (friction.some((item) => item.severity === "high")) {
    score -= 10;
    reasons.push("זוהה חיכוך גבוה באחד המסכים");
  }

  if (completions >= 5) {
    score += 8;
    reasons.push("יש השלמות אמיתיות של פעולות מרכזיות");
  }

  if (love > bug) {
    score += 5;
    reasons.push("פידבק חיובי גבוה מפידבק על תקלות");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    reasons: reasons.length ? reasons : ["אין מספיק נתונים לשינוי משמעותי"],
  };
}

export function getBetaFeedback() {
  return readFeedback();
}

export function submitBetaFeedback(input: {
  type: BetaFeedbackType;
  area: string;
  text: string;
  contact?: string;
}) {
  const feedback: BetaFeedback = {
    id: createId("feedback"),
    type: input.type,
    area: input.area,
    page: typeof window === "undefined" ? "" : window.location.pathname,
    appVersion: packageJson.version,
    browser: getBrowserSummary(),
    screen: getScreenSummary(),
    createdAt: new Date().toISOString(),
    hasContact: Boolean(input.contact?.trim()),
    summaryLength: input.text.trim().length,
  };

  writeFeedback([feedback, ...readFeedback()]);
  trackTelemetryEvent({
    name: "feedback_submitted",
    module: "settings",
    properties: {
      type: feedback.type,
      area: feedback.area,
      hasContact: feedback.hasContact,
      summaryLength: feedback.summaryLength,
    },
  });

  return feedback;
}

export function trackQuickFeedback(input: {
  target: "assistant" | "suggestion" | "automation" | "template";
  helpful: boolean;
  module?: TelemetryModule;
}) {
  trackTelemetryEvent({
    name: "quick_feedback_submitted",
    module: input.module ?? "app",
    properties: {
      target: input.target,
      helpful: input.helpful,
    },
  });
}

export function trackSatisfactionScore(input: {
  module: TelemetryModule;
  score: 1 | 2 | 3 | 4 | 5;
  context: string;
}) {
  trackTelemetryEvent({
    name: "satisfaction_submitted",
    module: input.module,
    properties: {
      score: input.score,
      context: input.context,
    },
  });
}

export function getProductInsightsSummary(): ProductInsightsSummary {
  const events = getTelemetryEvents();
  const feedback = getBetaFeedback();
  const modules = Array.from(new Set(events.map((event) => event.module))).map(
    (module) => {
      const moduleEvents = events.filter((event) => event.module === module);

      return {
        module,
        opens: moduleEvents.filter((event) =>
          ["page_viewed", "palette_opened", "assistant_opened"].includes(
            event.name
          )
        ).length,
        completions: moduleEvents.filter((event) =>
          event.name.endsWith("_completed") ||
          event.name.endsWith("_confirmed") ||
          event.name === "task_completed"
        ).length,
        errors: moduleEvents.filter((event) => event.name === "app_error")
          .length,
      };
    }
  );
  const topEvents = Object.entries(countBy(events.map((event) => event.name)))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  const friction = detectFriction(events);

  return {
    totalEvents: events.length,
    active: {
      daily: countActiveUsers(events, daysAgo(1)),
      weekly: countActiveUsers(events, daysAgo(7)),
      monthly: countActiveUsers(events, daysAgo(30)),
    },
    modules: modules.sort((a, b) => b.opens + b.completions - (a.opens + a.completions)),
    topEvents,
    friction,
    feedback: {
      total: feedback.length,
      byType: {
        bug: feedback.filter((item) => item.type === "bug").length,
        suggestion: feedback.filter((item) => item.type === "suggestion").length,
        confusing: feedback.filter((item) => item.type === "confusing").length,
        love: feedback.filter((item) => item.type === "love").length,
      },
    },
    healthScore: calculateHealthScore(events, friction, feedback),
  };
}

