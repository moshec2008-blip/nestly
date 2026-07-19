"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useLanguage } from "@/i18n/useLanguage";
import {
  dismissAttentionItem,
  getHomeAttentionState,
  homeAttentionChangedEventName,
  snoozeAttentionItem,
} from "@/services/homeAttention";
import { trackTelemetryEvent } from "@/services/telemetry";
import type {
  AttentionItem,
  HomeAttentionState,
  HomeQuickAction,
} from "@/types/homeAttention";

const severityClasses: Record<AttentionItem["severity"], string> = {
  critical: "bg-rose-50 text-rose-700 ring-rose-100",
  high: "bg-amber-50 text-amber-800 ring-amber-100",
  medium: "bg-sky-50 text-sky-700 ring-sky-100",
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  calm: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

const iconSurfaceClasses: Record<AttentionItem["domain"], string> = {
  tasks: "bg-amber-50 text-amber-700 ring-amber-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  documents: "bg-violet-50 text-violet-700 ring-violet-100",
  shopping: "bg-sky-50 text-sky-700 ring-sky-100",
  vehicles: "bg-blue-50 text-blue-700 ring-blue-100",
  family: "bg-pink-50 text-pink-700 ring-pink-100",
  life: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
  inbox: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
  timeline: "bg-stone-100 text-stone-700 ring-stone-200",
  system: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function runQuickAction(action: HomeQuickAction) {
  if (!action.eventName || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(action.eventName, { detail: action.eventDetail })
  );
}

function ActionShell({
  action,
  children,
}: {
  action: HomeQuickAction;
  children: ReactNode;
}) {
  const className =
    "flex min-h-[58px] min-w-0 items-center gap-2 rounded-[20px] bg-white/72 px-3 py-2 text-right shadow-[0_8px_18px_rgba(33,43,63,0.04)] transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.99]";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => runQuickAction(action)} className={className}>
      {children}
    </button>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <Link
      href={item.href}
      onClick={() =>
        trackTelemetryEvent({
          name: "result_opened",
          module: "home",
          properties: {
            source: "home_attention",
            domain: item.domain,
            severity: item.severity,
          },
        })
      }
      className="group flex min-h-[64px] min-w-0 items-center gap-3 rounded-[20px] bg-white/62 px-3 py-2.5 text-right transition hover:bg-white active:scale-[0.99]"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${iconSurfaceClasses[item.domain]}`}
      >
        <AppIcon name={item.icon} className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-col gap-1 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between min-[380px]:gap-2">
          <span className="min-w-0 truncate text-sm font-black text-[#111827]">
            {item.title}
          </span>
          <span
            className={`w-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${severityClasses[item.severity]}`}
          >
            {item.reason}
          </span>
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
          {item.summary}
        </span>
      </span>
    </Link>
  );
}

export default function HomeDailyCommandCenter() {
  const { language } = useLanguage();
  const { toast } = useFeedback();
  const [state, setState] = useState<HomeAttentionState | null>(null);
  const languageKey = language === "en" ? "en" : "he";
  const text = useMemo(
    () =>
      languageKey === "en"
        ? {
            loading: "Checking what matters today...",
            eyebrow: "Today in the family",
            primary: "Needs attention",
            quietPrimary: "Calm today",
            why: "Why this appears",
            open: "Open",
            snooze: "Snooze",
            dismiss: "Dismiss",
            today: "Worth noticing",
            life: "Active story",
            actions: "Quick actions",
            empty: "No other urgent items. That is a good thing.",
            dismissed: "Removed from today",
            snoozed: "Snoozed until tomorrow",
          }
        : {
            loading: "בודקים מה באמת חשוב היום...",
            eyebrow: "היום בבית",
            primary: "דורש תשומת לב",
            quietPrimary: "יום רגוע",
            why: "למה זה כאן",
            open: "פתח",
            snooze: "נודניק מחר",
            dismiss: "הסר מהיום",
            today: "שווה לשים לב",
            life: "סיפור פעיל",
            actions: "פעולות מהירות",
            empty: "אין עוד דברים דחופים. וזה דבר טוב.",
            dismissed: "הוסר מהיום",
            snoozed: "נדחה למחר",
          },
    [languageKey]
  );

  const refreshState = useCallback(() => {
    setState(getHomeAttentionState(language));
  }, [language]);

  useEffect(() => {
    const timeoutId = window.setTimeout(refreshState, 0);
    window.addEventListener(homeAttentionChangedEventName, refreshState);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(homeAttentionChangedEventName, refreshState);
    };
  }, [refreshState]);

  function dismissItem(item: AttentionItem) {
    dismissAttentionItem(item.id);
    trackTelemetryEvent({
      name: "feature_discovery_dismissed",
      module: "home",
      properties: {
        source: "home_attention",
        domain: item.domain,
      },
    });
    toast({ title: text.dismissed, description: item.title, tone: "info" });
  }

  function snoozeItem(item: AttentionItem) {
    snoozeAttentionItem(item.id);
    trackTelemetryEvent({
      name: "workflow_abandoned",
      module: "home",
      properties: {
        source: "home_attention_snooze",
        domain: item.domain,
      },
    });
    toast({ title: text.snoozed, description: item.title, tone: "info" });
  }

  if (!state) {
    return (
      <section className="rounded-[28px] bg-white/80 p-5 text-right shadow-[0_18px_46px_rgba(33,43,63,0.07)]">
        <p className="text-sm font-black text-slate-500">{text.loading}</p>
      </section>
    );
  }

  const primary = state.primaryItem;

  return (
    <section
      className="w-full max-w-full overflow-hidden rounded-[30px] bg-gradient-to-br from-white/96 via-[#fff8eb]/86 to-[#eef7ff]/72 p-4 text-right shadow-[0_18px_46px_rgba(33,43,63,0.075)] sm:p-5 lg:p-6"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[#8a5b16]">
            {text.eyebrow}
          </p>
          <h1 className="mt-1 text-[28px] font-black leading-8 text-[#111827] sm:text-3xl">
            {state.greeting}
          </h1>
          <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            {state.daySummary}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white/68 px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-sm">
          {state.contextLabel}
        </span>
      </div>

      <div className="mt-4 rounded-[26px] bg-white/76 p-3 shadow-[0_12px_28px_rgba(33,43,63,0.055)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black text-[#8a5b16]">
            {state.quiet ? text.quietPrimary : text.primary}
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${severityClasses[primary.severity]}`}
          >
            {primary.reason}
          </span>
        </div>

        <div className="mt-3 flex gap-3">
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-[20px] ring-1 ${iconSurfaceClasses[primary.domain]}`}
          >
            <AppIcon name={primary.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black leading-7 text-[#111827]">
              {primary.title}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {primary.summary}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-500">
              {text.why}: {primary.reason}
              {primary.relatedLabel ? ` · ${primary.relatedLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {primary.action.href ? (
            <Link
              href={primary.action.href}
              onClick={() =>
                trackTelemetryEvent({
                  name: "first_useful_action",
                  module: "home",
                  properties: {
                    action: "home_primary_open",
                    domain: primary.domain,
                  },
                })
              }
              className="min-h-11 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5"
            >
              {primary.action.label || text.open}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (primary.action.eventName) {
                  window.dispatchEvent(
                    new CustomEvent(primary.action.eventName, {
                      detail: primary.action.eventDetail,
                    })
                  );
                }
              }}
              className="min-h-11 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5"
            >
              {primary.action.label || text.open}
            </button>
          )}
          {!state.quiet && (
            <>
              <button
                type="button"
                onClick={() => snoozeItem(primary)}
                className="min-h-11 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:bg-[#fff8eb]"
              >
                {text.snooze}
              </button>
              <button
                type="button"
                onClick={() => dismissItem(primary)}
                className="min-h-11 rounded-2xl px-4 py-3 text-sm font-black text-slate-500 transition hover:bg-white"
              >
                {text.dismiss}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid min-w-0 max-w-full gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 max-w-full overflow-hidden rounded-[24px] bg-white/46 p-2.5">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-[#111827]">{text.today}</h2>
            <span className="h-1.5 w-10 rounded-full bg-gradient-to-l from-[#d8b470] to-[#8fb9d9]" />
          </div>
          {state.todayItems.length > 0 ? (
            <div className="min-w-0 max-w-full space-y-2 overflow-hidden">
              {state.todayItems.map((item) => (
                <AttentionRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="rounded-[20px] bg-white/68 px-3 py-4 text-sm font-semibold text-slate-500">
              {text.empty}
            </p>
          )}
        </div>

        <aside className="min-w-0 max-w-full space-y-3 overflow-hidden">
          {state.lifeEventItems.length > 0 && (
            <div className="rounded-[24px] bg-white/62 p-3">
              <h2 className="text-sm font-black text-[#111827]">{text.life}</h2>
              <div className="mt-2 space-y-2">
                {state.lifeEventItems.map((item) => (
                  <AttentionRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[24px] bg-[#111827] p-3 text-white shadow-[0_16px_34px_rgba(17,24,39,0.16)]">
            <h2 className="text-sm font-black">{text.actions}</h2>
            <div className="mt-2 grid gap-2">
              {state.quickActions.map((action) => (
                <ActionShell key={action.id} action={action}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/12 text-[#f5d99f]">
                    <AppIcon name={action.icon} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/62">
                      {action.description}
                    </span>
                  </span>
                </ActionShell>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
