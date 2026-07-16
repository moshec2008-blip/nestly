"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import {
  askNestlyAssistant,
  getAssistantDefaultQuestions,
} from "@/services/assistant/nestlyAssistantService";
import { trackTelemetryEvent } from "@/services/telemetry";
import type { AssistantAnswer } from "@/types/assistant";

const copy = {
  he: {
    eyebrow: "העוזר המשפחתי",
    title: "שאל את Nestly",
    description:
      "תשובות קצרות מתוך המידע שכבר שמור במרחב המשפחתי, עם מקורות ברורים לפני כל פעולה.",
    inputLabel: "מה תרצה לדעת?",
    placeholder: "לדוגמה: מה דורש תשומת לב היום?",
    ask: "שאל",
    sources: "מקורות",
    actions: "פעולות מוצעות",
    confidence: "רמת ביטחון",
    review: "כל פעולה דורשת אישור שלך",
    emptyTitle: "אני אענה רק ממה ששמור ב־Nestly",
    emptyText:
      "אפשר לשאול על משימות, קניות, כספים, מסמכים, רכבים, בריאות וציר הזמן המשפחתי.",
    noSources: "אין מקורות שמורים להצגה.",
    open: "פתח",
  },
  en: {
    eyebrow: "Family Assistant",
    title: "Ask Nestly",
    description:
      "Short answers from records already saved in the family space, with clear sources before any action.",
    inputLabel: "What would you like to know?",
    placeholder: "For example: What needs attention today?",
    ask: "Ask",
    sources: "Sources",
    actions: "Suggested actions",
    confidence: "Confidence",
    review: "Every action requires your approval",
    emptyTitle: "I only answer from saved Nestly records",
    emptyText:
      "Ask about tasks, shopping, finance, documents, vehicles, health and the family timeline.",
    noSources: "No saved sources to show.",
    open: "Open",
  },
};

function confidenceLabel(confidence: AssistantAnswer["confidence"], language: "he" | "en") {
  if (language === "en") {
    return confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low";
  }

  return confidence === "high" ? "גבוהה" : confidence === "medium" ? "בינונית" : "נמוכה";
}

export default function NestlyAssistantPage() {
  const { language } = useLanguage();
  const uiLanguage = language === "en" ? "en" : "he";
  const t = copy[uiLanguage];
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const defaultQuestions = useMemo(
    () => getAssistantDefaultQuestions(language),
    [language]
  );

  useEffect(() => {
    trackTelemetryEvent({
      name: "assistant_opened",
      module: "app",
    });
  }, []);

  function runQuestion(nextQuery: string) {
    const nextAnswer = askNestlyAssistant({
      query: nextQuery,
      language: uiLanguage,
    });

    setAnswer(nextAnswer);
    setQuery(nextQuery);
    trackTelemetryEvent({
      name:
        nextAnswer.sourceRecords.length > 0
          ? "assistant_answer_shown"
          : "assistant_no_answer",
      module: "app",
      properties: {
        intent: nextAnswer.intent,
        source_count: nextAnswer.sourceRecords.length,
        action_count: nextAnswer.relatedActions.length,
        generated_by: nextAnswer.generatedBy,
      },
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    trackTelemetryEvent({
      name: "assistant_question_submitted",
      module: "app",
      properties: {
        input_length: query.trim().length,
      },
    });
    runQuestion(query.trim());
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[#e9dfcf] bg-[linear-gradient(135deg,#fffaf1_0%,#f7fbff_52%,#f5f0ff_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#8a5c1f] ring-1 ring-[#eadcc3]">
              <AppIcon name="spark" className="h-4 w-4" />
              {t.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
              {t.description}
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 px-4 py-3 text-xs font-black text-slate-600 shadow-sm ring-1 ring-[#edf0f4]">
            {t.review}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="assistant-query">
            {t.inputLabel}
          </label>
          <input
            id="assistant-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.placeholder}
            className="min-h-12 flex-1 rounded-2xl border border-[#dde5ef] bg-white px-4 text-sm font-bold text-[#111827] shadow-sm outline-none transition focus:border-[#d8b470] focus:ring-4 focus:ring-[#d8b470]/20"
          />
          <button
            type="submit"
            className="min-h-12 rounded-2xl bg-[#111827] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(17,24,39,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1f2937] active:translate-y-0"
          >
            {t.ask}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {defaultQuestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => runQuestion(question)}
              className="min-h-10 rounded-full bg-white/85 px-4 text-xs font-black text-slate-700 ring-1 ring-[#edf0f4] transition hover:-translate-y-0.5 hover:ring-[#d8b470]/60"
            >
              {question}
            </button>
          ))}
        </div>
      </section>

      {answer ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.07)] ring-1 ring-[#edf0f4]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                {t.confidence}: {confidenceLabel(answer.confidence, uiLanguage)}
              </span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-100">
                {answer.generatedBy}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black text-[#111827]">
              {answer.answer}
            </h2>

            {answer.summaryBullets.length > 0 ? (
              <div className="mt-4 divide-y divide-[#edf0f4]">
                {answer.summaryBullets.map((bullet) => (
                  <p
                    key={bullet}
                    className="py-3 text-sm font-bold leading-7 text-slate-700"
                  >
                    {bullet}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-600">
                {answer.missingInformation[0] ?? t.noSources}
              </p>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-[#edf0f4]">
              <h3 className="text-sm font-black text-[#111827]">{t.sources}</h3>
              <div className="mt-3 space-y-2">
                {answer.sourceRecords.length > 0 ? (
                  answer.sourceRecords.map((source) => (
                    <Link
                      href={source.route}
                      key={source.id}
                      onClick={() =>
                        trackTelemetryEvent({
                          name: "assistant_source_opened",
                          module: "app",
                          properties: {
                            source_module: source.module,
                          },
                        })
                      }
                      className="block rounded-2xl bg-[#fbfaf7] p-3 ring-1 ring-[#edf0f4] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      <p className="truncate text-sm font-black text-[#111827]">
                        {source.title}
                      </p>
                      {source.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                          {source.excerpt}
                        </p>
                      ) : null}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    {t.noSources}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] ring-1 ring-[#edf0f4]">
              <h3 className="text-sm font-black text-[#111827]">{t.actions}</h3>
              <div className="mt-3 space-y-2">
                {answer.relatedActions.map((action) => (
                  <Link
                    href={action.route ?? "/"}
                    key={action.id}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-[#e9dfcf] bg-white px-3 text-sm font-black text-[#6f4b18] transition hover:-translate-y-0.5 hover:bg-[#fffaf1]"
                  >
                    <span className="truncate">{action.label}</span>
                    <AppIcon name="chevron-left" className="h-4 w-4" />
                  </Link>
                ))}
                {answer.relatedActions.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">
                    {t.noSources}
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-[#e9dfcf] bg-white/80 p-6 text-center shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#fffaf1] text-[#8a5c1f] ring-1 ring-[#eadcc3]">
            <AppIcon name="spark" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-black text-[#111827]">{t.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-7 text-slate-600">
            {t.emptyText}
          </p>
        </section>
      )}
    </div>
  );
}
