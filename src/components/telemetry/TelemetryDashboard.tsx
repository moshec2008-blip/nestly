"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBetaFeedback,
  getProductInsightsSummary,
  type ProductInsightsSummary,
} from "@/lib/productInsights";
import {
  clearTelemetryEvents,
  getTelemetryEvents,
  type TelemetryEvent,
  type TelemetryModule,
} from "@/services/telemetry";

const moduleLabels: Record<TelemetryModule, string> = {
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
  operations: "תפעול",
  settings: "הגדרות",
};

const feedbackLabels = {
  bug: "תקלות",
  suggestion: "הצעות",
  confusing: "לא ברור",
  love: "אהבתי",
};

function getLatestEvents(events: TelemetryEvent[]) {
  return events.slice(0, 8);
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-[20px] bg-white/92 p-3 shadow-sm ring-1 ring-[#eadfcd]">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function ProductHealthCard({
  healthScore,
}: {
  healthScore: ProductInsightsSummary["healthScore"];
}) {
  const tone =
    healthScore.score >= 80
      ? "from-emerald-50"
      : healthScore.score >= 60
        ? "from-amber-50"
        : "from-rose-50";

  return (
    <section
      className={[
        "rounded-[24px] bg-gradient-to-l via-white to-[#fff8eb] p-4 shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]",
        tone,
      ].join(" ")}
    >
      <p className="text-xs font-black text-[#007aff]">Product health</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black text-slate-950">
            {healthScore.score}/100
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            ציון שבועי משוער לפי יציבות, אימוץ, השלמות ופידבק.
          </p>
        </div>
        <div className="max-w-xl space-y-1">
          {healthScore.reasons.map((reason) => (
            <p
              key={reason}
              className="rounded-2xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-[#edf0f4]"
            >
              {reason}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TelemetryDashboard() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [feedbackVersion, setFeedbackVersion] = useState(0);

  useEffect(() => {
    function syncEvents() {
      setEvents(getTelemetryEvents());
    }

    function syncFeedback() {
      setFeedbackVersion((current) => current + 1);
    }

    syncEvents();
    window.addEventListener("nestly-telemetry-change", syncEvents);
    window.addEventListener("nestly-beta-feedback-change", syncFeedback);

    return () => {
      window.removeEventListener("nestly-telemetry-change", syncEvents);
      window.removeEventListener("nestly-beta-feedback-change", syncFeedback);
    };
  }, []);

  const insights = useMemo(() => {
    void events;
    void feedbackVersion;
    return getProductInsightsSummary();
  }, [events, feedbackVersion]);
  const feedback = useMemo(() => {
    void feedbackVersion;
    return getBetaFeedback();
  }, [feedbackVersion]);
  const latestEvents = getLatestEvents(events);
  const leastUsedModules = [...insights.modules]
    .sort((a, b) => a.opens + a.completions - (b.opens + b.completions))
    .slice(0, 5);

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
            נקה נתוני תובנות
          </button>
          <div>
            <p className="text-xs font-black text-[#007aff]">
              Product Insights
            </p>
            <h1 className="mt-1 text-2xl font-black">
              לוח תובנות בטא פנימי
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              נתוני שימוש אנונימיים ומקומיים בלבד. לא נשמרים שמות, סכומים,
              חיפושים, תוכן מסמכים, הערות או הודעות אישיות.
            </p>
          </div>
        </div>
      </div>

      <ProductHealthCard healthScore={insights.healthScore} />

      <div className="grid gap-2 sm:grid-cols-4">
        <MetricCard label="אירועים" value={insights.totalEvents} />
        <MetricCard label="פעילים היום" value={insights.active.daily} />
        <MetricCard label="פעילים השבוע" value={insights.active.weekly} />
        <MetricCard label="פעילים החודש" value={insights.active.monthly} />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">מודולים בשימוש גבוה</h2>
          <div className="mt-3 space-y-2">
            {insights.modules.slice(0, 8).map((item) => (
              <div
                key={item.module}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-2xl bg-[#fffdf8] px-3 py-2"
              >
                <span className="text-sm font-black">
                  {moduleLabels[item.module] ?? item.module}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  פתיחות {item.opens}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  השלמות {item.completions}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  שגיאות {item.errors}
                </span>
              </div>
            ))}
            {insights.modules.length === 0 ? (
              <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                עדיין אין מספיק שימוש כדי לזהות מודולים מובילים.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">חיכוך שזוהה</h2>
          <div className="mt-3 space-y-2">
            {insights.friction.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-[#fffdf8] px-3 py-2"
              >
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-[#edf0f4]">
                  {item.count}
                </span>
                <div>
                  <p className="text-sm font-black">
                    {moduleLabels[item.module] ?? item.module}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {item.reason} · {item.severity}
                  </p>
                </div>
              </div>
            ))}
            {insights.friction.length === 0 ? (
              <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                אין כרגע דפוס חיכוך בולט. נמשיך למדוד.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">פידבק בטא</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {Object.entries(feedbackLabels).map(([type, label]) => (
              <MetricCard
                key={type}
                label={label}
                value={
                  insights.feedback.byType[
                    type as keyof typeof insights.feedback.byType
                  ]
                }
              />
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {feedback.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#fffdf8] px-3 py-2 text-xs font-semibold text-slate-600"
              >
                {feedbackLabels[item.type]} · {item.area} · {item.page} ·{" "}
                {item.screen}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-lg font-black">הזדמנויות גילוי</h2>
          <div className="mt-3 space-y-2">
            {leastUsedModules.map((item) => (
              <div
                key={item.module}
                className="flex items-center justify-between rounded-2xl bg-[#fffdf8] px-3 py-2"
              >
                <span className="text-xs font-bold text-slate-500">
                  {item.opens + item.completions} פעולות
                </span>
                <span className="text-sm font-black">
                  {moduleLabels[item.module] ?? item.module}
                </span>
              </div>
            ))}
            {leastUsedModules.length === 0 ? (
              <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                אחרי שימוש אמיתי נוכל לזהות אזורים שלא התגלו עדיין.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
        <h2 className="text-lg font-black">אירועים אחרונים</h2>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {latestEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-[#fffdf8] px-3 py-2"
            >
              <p className="text-sm font-black">{event.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {moduleLabels[event.module] ?? event.module} ·{" "}
                {new Date(event.timestamp).toLocaleString("he-IL")}
                {event.durationMs ? ` · ${event.durationMs}ms` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
