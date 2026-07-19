"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import type { AppLanguage } from "@/i18n/config";
import { useLanguage } from "@/i18n/useLanguage";
import { getHandleQueueState } from "@/services/handleQueue";
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
import type { HandleQueueState } from "@/types/handleQueue";

const stateAccentClasses: Record<AttentionItem["severity"], string> = {
  critical: "from-rose-200/90 via-[#fff7f4] to-[#fffdf8]",
  high: "from-[#f2d38b]/90 via-[#fff8eb] to-[#fbfffc]",
  medium: "from-sky-200/75 via-[#f7fbff] to-[#fffdf8]",
  low: "from-slate-200/80 via-white to-[#fff9ef]",
  calm: "from-emerald-200/75 via-[#fbfff8] to-[#fff8eb]",
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

const quietReasonClasses: Record<AttentionItem["severity"], string> = {
  critical: "text-rose-700",
  high: "text-[#8a5b16]",
  medium: "text-sky-700",
  low: "text-slate-500",
  calm: "text-emerald-700",
};

function getLocale(language: AppLanguage) {
  return language === "en" ? "en-US" : "he-IL";
}

function getTodayLabel(language: AppLanguage) {
  return new Intl.DateTimeFormat(getLocale(language), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

type JourneyAction = {
  id: string;
  label: string;
  description: string;
  icon: "spark" | "check" | "knowledge";
  href?: "/handle" | "/memory";
  eventName?: string;
  count?: number;
};

function JourneyActionShell({
  action,
  children,
  primary = false,
}: {
  action: JourneyAction;
  children: ReactNode;
  primary?: boolean;
}) {
  const className = [
    "group flex min-h-[62px] min-w-0 items-center gap-2.5 rounded-[22px] px-3 py-2.5 text-right transition duration-200 active:scale-[0.98]",
    primary
      ? "border border-[#111827] bg-[#111827] text-white shadow-[0_12px_24px_rgba(17,24,39,0.16)] hover:-translate-y-0.5"
      : "bg-white/58 text-[#111827] shadow-[0_6px_16px_rgba(33,43,63,0.03)] hover:bg-white",
  ].join(" ");

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (action.eventName) {
          window.dispatchEvent(new CustomEvent(action.eventName));
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}

function PrimaryAction({
  item,
  fallback,
}: {
  item: AttentionItem;
  fallback: string;
}) {
  const label = item.action.label || fallback;
  const className =
    "inline-flex min-h-12 items-center justify-center rounded-full border border-[#111827] bg-[#111827] px-6 py-3 text-sm font-black text-white shadow-[0_14px_26px_rgba(17,24,39,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#0b1220] focus:outline-none focus:ring-2 focus:ring-[#d8b470]/70 active:scale-[0.98]";

  const track = () =>
    trackTelemetryEvent({
      name: "first_useful_action",
      module: "home",
      properties: {
        action: "home_primary_open",
        domain: item.domain,
      },
    });

  if (item.action.href) {
    return (
      <Link href={item.action.href} onClick={track} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        track();
        if (item.action.eventName) {
          window.dispatchEvent(
            new CustomEvent(item.action.eventName, {
              detail: item.action.eventDetail,
            })
          );
        }
      }}
      className={className}
    >
      {label}
    </button>
  );
}

function SupportingItem({ item }: { item: AttentionItem }) {
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
      className="group flex min-h-[48px] min-w-0 items-center gap-2.5 px-0.5 py-2 text-right transition hover:bg-white/28 active:scale-[0.99]"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-2xl ring-1 ${iconSurfaceClasses[item.domain]}`}
      >
        <AppIcon name={item.icon} className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-[#111827]">
          {item.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
          {item.reason}
          {item.relatedLabel ? ` · ${item.relatedLabel}` : ""}
        </span>
      </span>
    </Link>
  );
}

export function getActionDisplayLabel(action: HomeQuickAction, languageKey: "he" | "en") {
  if (action.id === "universal-inbox") {
    return "Inbox";
  }

  if (action.id.startsWith("continue-")) {
    if (action.id.includes("tasks")) return languageKey === "en" ? "Task" : "משימה";
    if (action.id.includes("finance")) return languageKey === "en" ? "Money" : "כספים";
    if (action.id.includes("documents")) return languageKey === "en" ? "Document" : "מסמך";
    if (action.id.includes("shopping")) return languageKey === "en" ? "List" : "קניות";
    if (action.id.includes("vehicles")) return languageKey === "en" ? "Car" : "רכב";
    if (action.id.includes("family")) return languageKey === "en" ? "Family" : "משפחה";
  }

  return action.label;
}

function getJourneyActions(
  languageKey: "he" | "en",
  handleState: HandleQueueState | null
): JourneyAction[] {
  const handleCount = handleState?.summary.total ?? 0;

  return languageKey === "en"
    ? [
        {
          id: "capture",
          label: "Add",
          description: "Save something new",
          icon: "spark",
          eventName: "nestly-open-universal-inbox",
        },
        {
          id: "handle",
          label: "Handle",
          description:
            handleCount > 0 ? `${handleCount} things need attention` : "Nothing needs you now",
          icon: "check",
          href: "/handle",
          count: handleCount,
        },
        {
          id: "memory",
          label: "Find",
          description: "Search what the household remembers",
          icon: "knowledge",
          href: "/memory",
        },
      ]
    : [
        {
          id: "capture",
          label: "הוסף",
          description: "שמרו משהו חדש",
          icon: "spark",
          eventName: "nestly-open-universal-inbox",
        },
        {
          id: "handle",
          label: "לטפל",
          description:
            handleCount > 0 ? `${handleCount} דברים מחכים` : "אין משהו שדורש אתכם",
          icon: "check",
          href: "/handle",
          count: handleCount,
        },
        {
          id: "memory",
          label: "למצוא",
          description: "חפשו מה שהבית כבר זוכר",
          icon: "knowledge",
          href: "/memory",
        },
      ];
}

export default function HomeDailyCommandCenter() {
  const { language, direction } = useLanguage();
  const { toast } = useFeedback();
  const [state, setState] = useState<HomeAttentionState | null>(null);
  const [handleState, setHandleState] = useState<HandleQueueState | null>(null);
  const languageKey = language === "en" ? "en" : "he";
  const text = useMemo(
    () =>
      languageKey === "en"
        ? {
            loading: "Finding the one thing that matters today...",
            calmHeadline: "The home is calm today",
            activeHeadline: "One thing is worth closing today",
            urgentHeadline: "A small moment of attention",
            primaryFallback: "Take care of it",
            addFallback: "Add something",
            todayTitle: "Worth noticing",
            todayEmpty: "Quiet here. Nothing else needs attention right now.",
            handleLink: "Open Handle",
            handleCount: (count: number) =>
              `${count} open ${count === 1 ? "item" : "items"}`,
            lifeTitle: "Family story",
            removed: "Cleared from today",
            snoozed: "Snoozed until tomorrow",
            snooze: "Tomorrow",
            dismiss: "Clear",
          }
        : {
            loading: "מחפשים את הדבר האחד שחשוב היום...",
            calmHeadline: "הבית רגוע היום",
            activeHeadline: "יש דבר אחד שכדאי לסגור היום",
            urgentHeadline: "רגע קטן של תשומת לב",
            primaryFallback: "לטפל בזה עכשיו",
            addFallback: "להוסיף משהו",
            todayTitle: "שווה לשים לב",
            todayEmpty: "שקט כאן. אין עוד משהו שמבקש תשומת לב כרגע.",
            handleLink: "פתחו את לטיפול",
            handleCount: (count: number) => `${count} דברים לטיפול`,
            lifeTitle: "סיפור משפחתי",
            removed: "הוסר מהיום",
            snoozed: "נדחה למחר",
            snooze: "מחר",
            dismiss: "סגור",
          },
    [languageKey]
  );

  const refreshState = useCallback(() => {
    setState(getHomeAttentionState(language));
    setHandleState(getHandleQueueState(language));
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
    toast({ title: text.removed, description: item.title, tone: "info" });
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
      <section
        className="rounded-[30px] bg-[#fffdf8] p-5 text-right shadow-[0_18px_46px_rgba(33,43,63,0.055)]"
        dir={direction}
      >
        <p className="text-sm font-black text-slate-500">{text.loading}</p>
      </section>
    );
  }

  const primary = state.primaryItem;
  const isUrgent = primary.severity === "critical" || primary.severity === "high";
  const headline = state.quiet
    ? text.calmHeadline
    : isUrgent
      ? text.urgentHeadline
      : text.activeHeadline;
  const journeyActions = getJourneyActions(languageKey, handleState);
  // "לטפל" מודגש כשיש עבודה ממתינה; אחרת "הוסף" הוא הכלי הראשי.
  const hasPendingWork = (handleState?.summary.total ?? 0) > 0;
  const primaryActionId = hasPendingWork ? "handle" : "capture";
  const visibleTodayItems = state.todayItems.slice(0, 2);
  const story = state.lifeEventItems[0];

  return (
    <div className="w-full max-w-full overflow-hidden" dir={direction}>
      {/* Hero קטן וממוקד: דבר אחד + פעולה אחת. שום קישוט מיותר. */}
      <section
        data-nestly-home-hero="true"
        className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${stateAccentClasses[primary.severity]} px-5 py-4 text-right shadow-[0_8px_24px_rgba(33,43,63,0.035)] sm:px-6`}
      >
        <div className="relative max-w-[37rem]">
          <p className="line-clamp-1 text-[11px] font-black text-[#8a5b16]">
            {languageKey === "en" ? "Today at home" : "היום בבית"} ·{" "}
            {getTodayLabel(language)}
          </p>
          <h1 className="mt-1 text-[22px] font-black leading-7 text-[#0f172a] sm:text-[26px] sm:leading-8">
            {headline}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm font-bold leading-6 text-slate-600">
            {state.quiet ? state.daySummary : primary.summary}
          </p>
          {!state.quiet && (
            <p
              className={`mt-1 text-xs font-bold leading-5 ${quietReasonClasses[primary.severity]}`}
            >
              {primary.reason}
              {primary.relatedLabel ? ` · ${primary.relatedLabel}` : ""}
            </p>
          )}
        </div>

        <div className="relative mt-3 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-center">
          <PrimaryAction item={primary} fallback={text.primaryFallback} />
          {!state.quiet && (
            <div className="flex items-center gap-3 px-1 text-xs font-black text-slate-500">
              <button
                type="button"
                onClick={() => snoozeItem(primary)}
                className="rounded-full px-1.5 py-1 transition hover:text-[#8a5b16]"
              >
                {text.snooze}
              </button>
              <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
              <button
                type="button"
                onClick={() => dismissItem(primary)}
                className="rounded-full px-1.5 py-1 transition hover:text-[#8a5b16]"
              >
                {text.dismiss}
              </button>
            </div>
          )}
        </div>
      </section>

      <nav
        aria-label={languageKey === "en" ? "Quick actions" : "פעולות מהירות"}
        className="mt-3 grid grid-cols-1 gap-2 min-[430px]:grid-cols-3"
      >
        {journeyActions.map((action) => {
          const isPrimary = action.id === primaryActionId;

          return (
            <JourneyActionShell
              key={action.id}
              action={action}
              primary={isPrimary}
            >
              <span
                className={[
                  "grid h-8 w-8 shrink-0 place-items-center rounded-2xl",
                  isPrimary
                    ? "bg-white/12 text-[#f5d99f]"
                    : "bg-[#fff8eb] text-[#8a5b16]",
                ].join(" ")}
              >
                <AppIcon name={action.icon} className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1 text-[13px] font-black leading-4">
                  <span>{action.label}</span>
                  {action.id === "handle" && hasPendingWork ? (
                    <span
                      className={[
                        "grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10px] font-black tabular-nums",
                        isPrimary
                          ? "bg-[#f5d99f] text-[#111827]"
                          : "bg-[#fff3d8] text-[#8a5b16]",
                      ].join(" ")}
                    >
                      {action.count}
                    </span>
                  ) : null}
                </span>
                <span
                  className={[
                    "mt-0.5 block line-clamp-2 text-[10px] font-bold leading-4",
                    isPrimary ? "text-white/64" : "text-slate-500",
                  ].join(" ")}
                >
                  {action.description}
                </span>
              </span>
            </JourneyActionShell>
          );
        })}
      </nav>

      <section className="mt-5 px-1 text-right">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-[#111827]">{text.todayTitle}</h2>
          <Link
            href="/handle"
            className="shrink-0 rounded-full bg-white/52 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-[0_6px_16px_rgba(33,43,63,0.03)] transition hover:bg-white"
          >
            {handleState ? text.handleCount(handleState.summary.total) : text.handleLink}
          </Link>
        </div>
        <div className="mt-2 divide-y divide-[#eee8db]/70 px-1">
          {visibleTodayItems.length > 0 ? (
            visibleTodayItems.map((item) => (
              <SupportingItem key={item.id} item={item} />
            ))
          ) : (
            <p className="px-1 py-3 text-sm font-semibold leading-6 text-slate-500">
              {text.todayEmpty}
            </p>
          )}
        </div>
      </section>

      {story && (
        <Link
          href={story.href}
          onClick={() =>
            trackTelemetryEvent({
              name: "result_opened",
              module: "home",
              properties: {
                source: "home_life_story",
                domain: story.domain,
                severity: story.severity,
              },
            })
          }
          className="mt-3 flex min-h-[78px] items-center gap-3 rounded-[26px] bg-gradient-to-l from-[#fff3d8]/72 via-white/58 to-[#f7fbff]/70 px-3.5 py-3 text-right shadow-[0_10px_24px_rgba(126,86,28,0.045)] transition hover:bg-white active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/78 text-[#8a5b16] shadow-sm ring-1 ring-[#eadfcd]">
            <AppIcon name="timeline" className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-black text-[#8a5b16]">
              {text.lifeTitle}
            </span>
            <span className="mt-0.5 block truncate text-sm font-black text-[#111827]">
              {story.title}
            </span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
              {story.summary}
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
