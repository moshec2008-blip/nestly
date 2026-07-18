"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import {
  calculateLifeEventProgress,
  ensureLifeEventRelations,
  getActiveLifeEvents,
  readLifeEvents,
} from "@/services/lifeEventsService";
import type { LifeEvent } from "@/types/lifeEvents";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function getStatusLabel(status: LifeEvent["status"]) {
  const labels: Record<LifeEvent["status"], string> = {
    planning: "בתכנון",
    active: "פעיל",
    paused: "מושהה",
    completed: "הושלם",
  };

  return labels[status];
}

export default function LifeEventsManager() {
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [relationMessage, setRelationMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextEvents = readLifeEvents();
      setEvents(nextEvents);
      setSelectedEventId(nextEvents[0]?.id ?? "");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const activeEvents = useMemo(
    () =>
      events.length > 0
        ? events.filter(
            (event) => event.status === "active" || event.status === "planning"
          )
        : getActiveLifeEvents(),
    [events]
  );
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ??
    activeEvents[0] ??
    null;
  const progress = selectedEvent ? calculateLifeEventProgress(selectedEvent) : 0;
  const totalExpenses =
    selectedEvent?.expenses.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;

  function handleCreateRelations() {
    if (!selectedEvent) {
      return;
    }

    const createdRelations = ensureLifeEventRelations(selectedEvent);
    setRelationMessage(
      createdRelations.length > 0
        ? `${createdRelations.length} קשרים נשמרו או הוצעו לגרף המשפחתי.`
        : "כל הקשרים הרלוונטיים כבר קיימים."
    );
  }

  if (!selectedEvent) {
    return (
      <section className="rounded-[28px] bg-white/72 p-6 text-center shadow-[0_16px_40px_rgba(33,43,63,0.07)]">
        <h1 className="text-2xl font-black text-[#111827]">סיפורי חיים</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          עדיין אין סיפור פעיל. כשיתווסף אירוע גדול, Nestly תרכז סביבו את
          המשימות, המסמכים וההוצאות.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] lg:pb-0" dir="rtl">
      <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#fff9ed] via-white to-[#f4f8fb] p-4 shadow-[0_18px_48px_rgba(33,43,63,0.08)] sm:p-5 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl text-right">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/78 px-3 py-1 text-[11px] font-black text-[#8a5b16] shadow-sm">
              <AppIcon name="timeline" className="h-4 w-4" />
              <span>סיפור חיים פעיל</span>
            </div>
            <h1 className="text-3xl font-black tracking-normal text-[#111827] sm:text-4xl">
              {selectedEvent.title}
            </h1>
            <p className="mt-2 text-base font-bold leading-7 text-slate-700">
              {selectedEvent.story}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-[24px] bg-white/66 p-2 text-center shadow-[inset_0_0_0_1px_rgba(234,223,205,0.62)] lg:w-[360px]">
            <div className="rounded-[18px] bg-white px-2 py-3 shadow-sm">
              <span className="block text-xl font-black text-[#111827]">{progress}%</span>
              <span className="text-[11px] font-bold text-slate-500">התקדמות</span>
            </div>
            <div className="rounded-[18px] bg-white px-2 py-3 shadow-sm">
              <span className="block text-xl font-black text-[#111827]">
                {selectedEvent.linkedEntities.length}
              </span>
              <span className="text-[11px] font-bold text-slate-500">קשרים</span>
            </div>
            <div className="rounded-[18px] bg-white px-2 py-3 shadow-sm">
              <span className="block text-xl font-black text-[#111827]">
                {formatDate(selectedEvent.targetDate ?? selectedEvent.updatedAt)}
              </span>
              <span className="text-[11px] font-bold text-slate-500">יעד</span>
            </div>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#d8b470] to-[#7ea7b8]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {activeEvents.length > 1 && (
        <section className="flex gap-2 overflow-x-auto pb-1">
          {activeEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEventId(event.id)}
              className={[
                "shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition",
                selectedEvent.id === event.id
                  ? "bg-[#111827] text-white"
                  : "bg-white/76 text-slate-700 shadow-sm",
              ].join(" ")}
            >
              {event.title}
            </button>
          ))}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <main className="space-y-4">
          <section className="rounded-[26px] bg-white/72 p-4 shadow-[0_12px_34px_rgba(33,43,63,0.055)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-[#8a5b16]">הפרק הנוכחי</p>
                <h2 className="text-xl font-black text-[#111827]">מה קורה עכשיו</h2>
              </div>
              <span className="rounded-full bg-[#fff3d8] px-3 py-1 text-xs font-black text-[#7a5212]">
                {getStatusLabel(selectedEvent.status)}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {selectedEvent.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={[
                    "flex gap-3 rounded-[20px] p-3",
                    milestone.status === "current"
                      ? "bg-[#fff8eb] shadow-[inset_0_0_0_1px_rgba(216,180,112,0.32)]"
                      : "bg-[#fafafb]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-1 h-3 w-3 shrink-0 rounded-full",
                      milestone.status === "done"
                        ? "bg-emerald-400"
                        : milestone.status === "current"
                          ? "bg-[#d8b470]"
                          : "bg-slate-300",
                    ].join(" ")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-[#111827]">
                        {milestone.title}
                      </h3>
                      {milestone.date && (
                        <span className="text-xs font-bold text-slate-500">
                          {formatDate(milestone.date)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] bg-white/72 p-4 shadow-[0_12px_34px_rgba(33,43,63,0.055)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black text-[#8a5b16]">הקשרים</p>
                <h2 className="text-xl font-black text-[#111827]">
                  כל מה ששייך לסיפור
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCreateRelations}
                className="rounded-2xl bg-[#111827] px-4 py-2 text-xs font-black text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)] transition active:scale-[0.98]"
              >
                חבר לגרף
              </button>
            </div>

            {relationMessage && (
              <p className="mt-3 rounded-2xl bg-[#f4f8fb] px-3 py-2 text-sm font-bold text-slate-700">
                {relationMessage}
              </p>
            )}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {selectedEvent.linkedEntities.map((entity) => (
                <Link
                  key={`${entity.entityType}-${entity.entityId}`}
                  href={entity.href}
                  className="group rounded-[20px] bg-[#fafafb] p-3 transition hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-[#111827]">
                        {entity.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                        {entity.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-500">
                      {Math.round(entity.confidence * 100)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-[26px] bg-white/72 p-4 shadow-[0_12px_34px_rgba(33,43,63,0.055)]">
            <p className="text-[11px] font-black text-[#8a5b16]">תובנות AI</p>
            <h2 className="text-xl font-black text-[#111827]">מה Nestly שמה לב</h2>
            <div className="mt-4 space-y-2">
              {selectedEvent.aiInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-[20px] bg-[#fff8eb] p-3"
                >
                  <h3 className="text-sm font-black text-[#111827]">
                    {insight.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] bg-white/72 p-4 shadow-[0_12px_34px_rgba(33,43,63,0.055)]">
            <p className="text-[11px] font-black text-[#8a5b16]">אנשים וכסף</p>
            <h2 className="text-xl font-black text-[#111827]">מי מעורב</h2>
            <div className="mt-4 space-y-2">
              {selectedEvent.people.map((person) => (
                <div key={person.id} className="flex items-center justify-between rounded-2xl bg-[#fafafb] px-3 py-2">
                  <span className="font-black text-[#111827]">{person.name}</span>
                  <span className="text-xs font-bold text-slate-500">{person.role}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[20px] bg-[#f4f8fb] p-3">
              <span className="text-xs font-black text-slate-500">תמונה כספית</span>
              <p className="mt-1 text-2xl font-black text-[#111827]">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                כולל מתוכנן, שולם ותשלומים ממתינים סביב האירוע.
              </p>
            </div>
          </section>

          <section className="rounded-[26px] bg-[#111827] p-4 text-white shadow-[0_18px_42px_rgba(17,24,39,0.18)]">
            <p className="text-[11px] font-black text-[#d8b470]">פעולות מהירות</p>
            <div className="mt-3 grid gap-2">
              <Link href="/vehicles" className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black transition hover:bg-white/16">
                פתח רכבים
              </Link>
              <Link href="/documents" className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black transition hover:bg-white/16">
                צרף מסמך
              </Link>
              <Link href="/finance" className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black transition hover:bg-white/16">
                בדוק הוצאות
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
