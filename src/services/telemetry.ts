"use client";

export type TelemetryEventName =
  | "app_opened"
  | "page_viewed"
  | "first_useful_action"
  | "task_created"
  | "task_completed"
  | "task_reopened"
  | "shopping_item_created"
  | "shopping_item_purchased"
  | "receipt_scanned"
  | "receipt_confirmed"
  | "expense_created"
  | "document_uploaded"
  | "document_reviewed"
  | "document_ai_failed"
  | "document_ai_completed"
  | "auth_login_started"
  | "auth_login_failed"
  | "guest_mode_started"
  | "migration_completed"
  | "performance_metric"
  | "app_error";

export type TelemetryModule =
  | "app"
  | "home"
  | "tasks"
  | "shopping"
  | "finance"
  | "documents"
  | "health"
  | "vehicles"
  | "family"
  | "events"
  | "auth"
  | "settings";

export type TelemetryEvent = {
  id: string;
  name: TelemetryEventName;
  module: TelemetryModule;
  timestamp: string;
  sessionId: string;
  anonymousUserId: string;
  durationMs?: number;
  properties?: Record<string, string | number | boolean | null>;
};

const telemetryStorageKey = "nestly-product-telemetry";
const telemetrySessionKey = "nestly-telemetry-session";
const telemetryUserKey = "nestly-telemetry-user";
const appOpenStartedAtKey = "nestly-telemetry-app-opened-at";
const firstUsefulActionKey = "nestly-telemetry-first-action";
const maxStoredEvents = 1200;

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getOrCreateStorageValue(key: string, prefix: string) {
  if (typeof window === "undefined") {
    return `${prefix}_server`;
  }

  const existingValue = window.localStorage.getItem(key);

  if (existingValue) {
    return existingValue;
  }

  const nextValue = createId(prefix);
  window.localStorage.setItem(key, nextValue);
  return nextValue;
}

function getSessionId() {
  if (typeof window === "undefined") {
    return "session_server";
  }

  const existingValue = window.sessionStorage.getItem(telemetrySessionKey);

  if (existingValue) {
    return existingValue;
  }

  const nextValue = createId("session");
  window.sessionStorage.setItem(telemetrySessionKey, nextValue);
  return nextValue;
}

function sanitizeProperties(
  properties?: Record<string, unknown>
): TelemetryEvent["properties"] {
  if (!properties) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) =>
        ["string", "number", "boolean"].includes(typeof value) || value === null
      )
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 80) : value,
      ])
  ) as TelemetryEvent["properties"];
}

export function getTelemetryEvents(): TelemetryEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(telemetryStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as TelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

function writeTelemetryEvents(events: TelemetryEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    telemetryStorageKey,
    JSON.stringify(events.slice(0, maxStoredEvents))
  );
}

export function trackTelemetryEvent(input: {
  name: TelemetryEventName;
  module: TelemetryModule;
  durationMs?: number;
  properties?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const event: TelemetryEvent = {
    id: createId("event"),
    name: input.name,
    module: input.module,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    anonymousUserId: getOrCreateStorageValue(telemetryUserKey, "anon"),
    durationMs: input.durationMs,
    properties: sanitizeProperties(input.properties),
  };

  writeTelemetryEvents([event, ...getTelemetryEvents()]);
  window.dispatchEvent(new CustomEvent("nestly-telemetry-change"));
}

export function trackPerformanceMetric(
  name: string,
  durationMs: number,
  module: TelemetryModule = "app"
) {
  trackTelemetryEvent({
    name: "performance_metric",
    module,
    durationMs: Math.round(durationMs),
    properties: { metric: name },
  });
}

export function trackTelemetryError(
  source: string,
  error: unknown,
  module: TelemetryModule = "app"
) {
  trackTelemetryEvent({
    name: "app_error",
    module,
    properties: {
      source,
      message:
        error instanceof Error
          ? error.message.slice(0, 80)
          : "unknown-error",
    },
  });
}

export function markAppOpened() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(appOpenStartedAtKey, String(performance.now()));
  trackTelemetryEvent({ name: "app_opened", module: "app" });
}

export function markFirstUsefulAction(action: string, module: TelemetryModule) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.sessionStorage.getItem(firstUsefulActionKey)) {
    return;
  }

  const startedAt = Number(window.sessionStorage.getItem(appOpenStartedAtKey));
  const durationMs = Number.isFinite(startedAt)
    ? Math.round(performance.now() - startedAt)
    : undefined;

  window.sessionStorage.setItem(firstUsefulActionKey, action);
  trackTelemetryEvent({
    name: "first_useful_action",
    module,
    durationMs,
    properties: { action },
  });
}

export function clearTelemetryEvents() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(telemetryStorageKey);
  window.dispatchEvent(new CustomEvent("nestly-telemetry-change"));
}
