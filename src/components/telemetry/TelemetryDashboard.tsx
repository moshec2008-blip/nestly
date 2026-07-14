"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearTelemetryEvents,
  getTelemetryEvents,
  type TelemetryEvent,
} from "@/services/telemetry";

const moduleLabels: Record<string, string> = {
  app: "אפליקציה",
  home: "בית",
  tasks: "משימות",
  shopping: "קניות",
  finance: "כספים",
  documents: "מסמכים",
  health: "בריאות",
  vehicles: "רכבים",
  family: "משפחה",
  events: "אירועים",
  auth: "זהות",
  settings: "הגדרות",
};

const journeyCompletionPairs = [
  { label: "משימות", start: "task_created", complete: "task_completed" },
  {
    label: "קניות",
    start: "shopping_item_created",
    complete: "shopping_item_purchased",
  },
  { label: "קבלה", start: "receipt_scanned", complete: "receipt_confirmed" },
  {
    label: "מסמכים",
    start: "document_uploaded",
    complete: "document_reviewed",
  },
] as const;

function countBy<T extends string>(events: TelemetryEvent[], selector: (event: TelemetryEvent) => T) {
  return events.reduce<Record<T, number>>((counts, event) => {
    const key = selector(event);
    return { ...counts, [key]: (counts[key] ?? 0) + 1 };
  }, {} as Record<T, number>);
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export default function TelemetryDashboard() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => {
    function syncEvents() {
      setEvents(getTelemetryEvents());
    }

    syncEvents();
    window.addEventListener("nestly-telemetry-change", syncEvents);

    return () =>
      window.removeEventListener("nestly-telemetry-change", syncEvents);
  }, []);

  const stats = useMemo(() => {
    const eventsByModule = countBy(events, (event) => event.module);
    const eventsByName = countBy(events, (event) => event.name);
    const errorEvents = events.filter((event) => event.name === "app_error");
    const performanceEvents = events.filter(
      (event) => event.name === "performance_metric" && event.durationMs
    );
    const pageViews = events.filter((event) => event.name === "page_viewed");
    const visitedRoutes = new Set(
      pageViews
        .map((event) => String(event.properties?.route ?? ""))
        .filter(Boolean)
    );
    const slowestEvents = [...performanceEvents]
      .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
      .slice(0, 6);
    const completionRates = journeyCompletionPairs.map((pair) => {
      const starts = eventsByName[pair.start] ?? 0;
      const completions = eventsByName[pair.complete] ?? 0;
      const rate = starts ? Math.min(100, Math.round((completions / starts) * 100)) : 0;

      return { ...pair, starts, completions, rate };
    });

    return {
      eventsByModule,
      eventsByName,
      errorEvents,
      performanceEvents,
      visitedRoutes,
      slowestEvents,
      completionRates,
      averagePerformance: getAverage(
        performanceEvents.map((event) => event.durationMs ?? 0)
      ),
    };
  }, [events]);

  const mostUsedModules = Object.entries(stats.eventsByModule)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const mostUsedEvents = Object.entries(stats.eventsByName)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <section className="space-y-3 text-right text-[#111827]">
      <div className="rounded-[24px] bg-white/92 p-4 shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              clearTelemetryEvents();
              setEvents([]);
            }}
            className="min-h-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700"
          >
            נקה נתוני טלמטריה
          </button>
          <div>
            <p className="text-xs font-black text-[#007aff]">Product Intelligence</p>
            <h1 className="mt-1 text-2xl font-black">לוח טלמטריה פנימי</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              אירועים אנונימיים מקומיים בלבד. אין שמות, סכומים, תוכן מסמכים או מידע רפואי.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {[
          { label: "אירועים", value: events.length },
          { label: "שגיאות", value: stats.errorEvents.length },
          { label: "מסכים שבוקרו", value: stats.visitedRoutes.size },
          { label: "זמן ממוצע", value: `${stats.averagePerformance}ms` },
        ].map((item) => (
          <div key={item.label} className="rounded-[20px] bg-white/92 p-3 shadow-sm ring-1 ring-[#eadfcd]">
            <p className="text-xs font-black text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">פיצ׳רים בשימוש גבוה</h2>
          <div className="mt-3 space-y-2">
            {mostUsedModules.map(([module, count]) => (
              <div key={module} className="flex items-center justify-between rounded-2xl bg-[#fffdf8] px-3 py-2">
                <span className="text-sm font-black">{count}</span>
                <span className="text-sm font-bold text-slate-700">
                  {moduleLabels[module] ?? module}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">אירועים נפוצים</h2>
          <div className="mt-3 space-y-2">
            {mostUsedEvents.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-[#fffdf8] px-3 py-2">
                <span className="text-sm font-black">{count}</span>
                <span className="text-sm font-bold text-slate-700">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">Completion rates</h2>
          <div className="mt-3 space-y-2">
            {stats.completionRates.map((item) => (
              <div key={item.label} className="rounded-2xl bg-[#fffdf8] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">{item.rate}%</span>
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  התחילו {item.starts} · השלימו {item.completions}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">שגיאות ומסכים איטיים</h2>
          <div className="mt-3 space-y-2">
            {[...stats.errorEvents.slice(0, 3), ...stats.slowestEvents.slice(0, 3)].map((event) => (
              <div key={event.id} className="rounded-2xl bg-[#fffdf8] px-3 py-2">
                <p className="text-sm font-black">{event.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {moduleLabels[event.module] ?? event.module}
                  {event.durationMs ? ` · ${event.durationMs}ms` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
