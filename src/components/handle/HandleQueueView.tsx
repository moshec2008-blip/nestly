"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { Button, LinkButton } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusPill from "@/components/ui/StatusPill";
import { useLanguage } from "@/i18n/useLanguage";
import {
  completeHandleQueueItem,
  getHandleQueueState,
  undoHandleQueueCompletion,
} from "@/services/handleQueue";
import type {
  HandleCompletedItem,
  HandleCompletionUndoToken,
  HandleDomain,
  HandleQueueItem,
  HandleQueueState,
  HandleUrgency,
} from "@/types/handleQueue";

const MAX_VISIBLE_SECTION_ITEMS = 6;
const UNDO_TIMEOUT_MS = 8000;

type PendingUndo = {
  title: string;
  token: HandleCompletionUndoToken;
};

const domainClasses: Record<HandleDomain, string> = {
  tasks: "bg-amber-50 text-amber-700 ring-amber-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  shopping: "bg-sky-50 text-sky-700 ring-sky-100",
  documents: "bg-violet-50 text-violet-700 ring-violet-100",
  vehicles: "bg-blue-50 text-blue-700 ring-blue-100",
  health: "bg-rose-50 text-rose-700 ring-rose-100",
  family: "bg-purple-50 text-purple-700 ring-purple-100",
  life: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
  inbox: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
};

const urgencyClasses: Record<HandleUrgency, string> = {
  overdue: "bg-rose-50 text-rose-700 ring-rose-100",
  today: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
  review: "bg-violet-50 text-violet-700 ring-violet-100",
  soon: "bg-sky-50 text-sky-700 ring-sky-100",
  open: "bg-slate-100 text-slate-600 ring-slate-200",
};

function getDomainLabel(domain: HandleDomain, languageKey: "he" | "en") {
  const labels: Record<HandleDomain, { he: string; en: string }> = {
    tasks: { he: "משימה", en: "Task" },
    finance: { he: "כספים", en: "Money" },
    shopping: { he: "קניות", en: "Shopping" },
    documents: { he: "מסמך", en: "Document" },
    vehicles: { he: "רכב", en: "Vehicle" },
    health: { he: "בריאות", en: "Health" },
    family: { he: "משפחה", en: "Family" },
    life: { he: "סיפור", en: "Story" },
    inbox: { he: "Inbox", en: "Inbox" },
  };

  return labels[domain][languageKey];
}

function getUrgencyLabel(urgency: HandleUrgency, languageKey: "he" | "en") {
  const labels: Record<HandleUrgency, { he: string; en: string }> = {
    overdue: { he: "באיחור", en: "Overdue" },
    today: { he: "היום", en: "Today" },
    review: { he: "לאישור", en: "Review" },
    soon: { he: "בקרוב", en: "Soon" },
    open: { he: "פתוח", en: "Open" },
  };

  return labels[urgency][languageKey];
}

function openEventItem(item: HandleQueueItem) {
  if (!item.eventName || typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(item.eventName, { detail: item.eventDetail })
  );
}

function QueueItemBody({
  item,
  languageKey,
}: {
  item: HandleQueueItem;
  languageKey: "he" | "en";
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${domainClasses[item.domain]}`}
      >
        <AppIcon name={item.icon} className="h-4.5 w-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] font-black leading-5 text-[#111827]">
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
              {getDomainLabel(item.domain, languageKey)} · {item.meta}
            </p>
          </div>
          <StatusPill
            className={urgencyClasses[item.urgency]}
          >
            {getUrgencyLabel(item.urgency, languageKey)}
          </StatusPill>
        </div>

        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
          {item.description}
        </p>
        <p className="mt-1 text-[11px] font-black text-[#8a5b16]">
          {languageKey === "en" ? "Why now: " : "למה עכשיו: "}
          {item.reason}
        </p>
      </div>
    </div>
  );
}

function HandleItemRow({
  item,
  languageKey,
  onComplete,
}: {
  item: HandleQueueItem;
  languageKey: "he" | "en";
  onComplete: (item: HandleQueueItem) => void;
}) {
  const openLabel = item.actionLabel;

  if (item.eventName) {
    return (
      <article className="rounded-[22px] bg-white/72 px-3.5 py-3 text-right shadow-[0_8px_22px_rgba(33,43,63,0.045)] ring-1 ring-white/70">
        <QueueItemBody item={item} languageKey={languageKey} />
        <Button
          onClick={() => openEventItem(item)}
          tone="primary"
          size="sm"
          className="mt-3 w-full"
        >
          {openLabel}
        </Button>
      </article>
    );
  }

  return (
    <article className="rounded-[22px] bg-white/72 px-3.5 py-3 text-right shadow-[0_8px_22px_rgba(33,43,63,0.045)] ring-1 ring-white/70">
      <QueueItemBody item={item} languageKey={languageKey} />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {item.canComplete && item.completeLabel ? (
          <Button
            onClick={() => onComplete(item)}
            tone="primary"
            size="sm"
            className="flex-1 min-[360px]:flex-none"
          >
            {item.completeLabel}
          </Button>
        ) : null}

        <LinkButton
          href={item.href}
          tone="secondary"
          size="sm"
          className="flex-1 min-[360px]:flex-none"
        >
          {openLabel}
        </LinkButton>
      </div>
    </article>
  );
}

function CompletedItemRow({
  item,
  languageKey,
}: {
  item: HandleCompletedItem;
  languageKey: "he" | "en";
}) {
  const completedTime = new Intl.DateTimeFormat(
    languageKey === "en" ? "en-US" : "he-IL",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(item.completedAt));

  return (
    <Link
      href={item.href}
      className="flex min-h-[50px] items-center gap-2.5 rounded-[18px] px-1 py-2 text-right transition hover:bg-white/36"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-2xl ring-1 ${domainClasses[item.domain]}`}
      >
        <AppIcon name={item.icon} className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-black text-[#111827]">
          {item.title}
        </span>
        <span
          title={completedTime}
          className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500"
        >
          {getDomainLabel(item.domain, languageKey)} · {item.meta}
        </span>
      </span>
    </Link>
  );
}

function Section({
  title,
  subtitle,
  items,
  languageKey,
  onComplete,
}: {
  title: string;
  subtitle?: string;
  items: HandleQueueItem[];
  languageKey: "he" | "en";
  onComplete: (item: HandleQueueItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  const visibleItems = items.slice(0, MAX_VISIBLE_SECTION_ITEMS);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <section className="space-y-2.5">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <HandleItemRow
            key={item.id}
            item={item}
            languageKey={languageKey}
            onComplete={onComplete}
          />
        ))}
        {hiddenCount > 0 ? (
          <p className="px-1 pt-1 text-xs font-bold leading-5 text-slate-500">
            {languageKey === "en"
              ? `${hiddenCount} more open items stay in their workspaces.`
              : `${hiddenCount} דברים נוספים נשארים באזורי העבודה.`}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function HandleQueueView() {
  const { language, direction } = useLanguage();
  const { toast } = useFeedback();
  const [state, setState] = useState<HandleQueueState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const languageKey = language === "en" ? "en" : "he";
  const copy = useMemo(
    () =>
      languageKey === "en"
        ? {
            loading: "Checking what needs you...",
            loadingDetail: "Collecting tasks, payments, shopping, documents and Inbox.",
            retry: "Try again",
            warningTitle: "Some workspaces did not load.",
            warningDetail: "Handle is showing everything it could read. You can retry in a moment.",
            calmTitle: "Nothing needs you right now",
            upcomingTitle: "Nothing urgent right now",
            activeTitle: (count: number) =>
              count === 1
                ? "One thing needs you now"
                : `${count} things need you now`,
            subtitle:
              "A calm queue from the existing workspaces, ordered by what deserves attention first.",
            calmSubtitle:
              "The queue is quiet. You can leave the app knowing the household is under control.",
            upcomingSubtitle:
              "There are open things later, but nothing needs immediate attention.",
            now: "Now",
            nowSubtitle: "Overdue, due today, or waiting for review.",
            later: "Later",
            laterSubtitle: "Open things worth keeping in sight.",
            empty:
              "Quiet here. No open item is asking for attention right now.",
            completed: "Recently handled",
            completedSubtitle: "Proof that things are moving.",
            doneToast: "Handled",
            doneToastDescription: "The item moved out of Handle.",
            undo: "Undo",
            undoDetail: "Marked handled. You can undo for a few seconds.",
            undoToast: "Restored",
            undoToastDescription: "The item is back in Handle.",
            failedToast: "Could not update",
            failedToastDescription: "Open the workspace and try there.",
            capture: "Add something",
            captureDescription: "Send a new note, file or receipt into Inbox.",
            memory: "Find something",
            memoryDescription: "Search what was already saved.",
            total: "Open",
            soon: "Soon",
          }
        : {
            loading: "בודקים מה צריך אתכם...",
            calmTitle: "אין משהו שצריך אתכם כרגע",
            activeTitle: (count: number) =>
              count === 1
                ? "דבר אחד צריך אתכם עכשיו"
                : `${count} דברים צריכים אתכם עכשיו`,
            subtitle:
              "תור רגוע מתוך אזורי העבודה הקיימים, מסודר לפי מה שדורש תשומת לב קודם.",
            calmSubtitle:
              "התור שקט. אפשר לצאת מהאפליקציה בידיעה שהבית בשליטה.",
            now: "עכשיו",
            nowSubtitle: "באיחור, להיום, או מחכה לאישור.",
            later: "בהמשך",
            laterSubtitle: "דברים פתוחים שכדאי להשאיר בטווח ראייה.",
            empty: "שקט כאן. אין פריט פתוח שמבקש טיפול כרגע.",
            completed: "טופל לאחרונה",
            completedSubtitle: "סימן קטן שהבית זז קדימה.",
            doneToast: "טופל",
            doneToastDescription: "הפריט יצא מלטיפול.",
            failedToast: "לא הצלחנו לעדכן",
            failedToastDescription: "פתחו את אזור העבודה ונסו משם.",
            total: "פתוחים",
            soon: "בהמשך",
          },
    [languageKey]
  );
  const productionCopy = useMemo(
    () =>
      languageKey === "en"
        ? {
            loadingDetail:
              "Collecting tasks, payments, shopping, documents and Inbox.",
            retry: "Try again",
            warningTitle: "Some workspaces did not load.",
            warningDetail:
              "Handle is showing everything it could read. You can retry in a moment.",
            upcomingTitle: "Nothing urgent right now",
            upcomingSubtitle:
              "There are open things later, but nothing needs immediate attention.",
            undo: "Undo",
            undoDetail: "Marked handled. You can undo for a few seconds.",
            undoToast: "Restored",
            undoToastDescription: "The item is back in Handle.",
            moreHidden: (count: number) =>
              `${count} more open items stay in their workspaces.`,
          }
        : {
            loadingDetail:
              "אוספים משימות, תשלומים, קניות, מסמכים ו-Inbox.",
            retry: "נסה שוב",
            warningTitle: "חלק מאזורי העבודה לא נטענו.",
            warningDetail:
              "Handle מציג את מה שהצליח לקרוא. אפשר לנסות שוב בעוד רגע.",
            upcomingTitle: "אין משהו דחוף כרגע",
            upcomingSubtitle:
              "יש דברים פתוחים להמשך, אבל שום דבר לא דורש טיפול מיידי.",
            undo: "בטל",
            undoDetail: "סומן כטופל. אפשר לבטל לכמה שניות.",
            undoToast: "שוחזר",
            undoToastDescription: "הפריט חזר ל-Handle.",
            moreHidden: (count: number) =>
              `${count} דברים נוספים נשארים באזורי העבודה.`,
          },
    [languageKey]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        setState(getHandleQueueState(language));
        setLoadError(false);
      } catch {
        setLoadError(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [language]);

  useEffect(
    () => () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    },
    []
  );

  function refreshState() {
    try {
      setState(getHandleQueueState(language));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }

  function handleComplete(item: HandleQueueItem) {
    const result = completeHandleQueueItem(item.id);

    if (!result.ok) {
      toast({
        title: copy.failedToast,
        description: copy.failedToastDescription,
        tone: "warning",
      });
      return;
    }

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }

    setPendingUndo({
      title: item.title,
      token: result.undoToken,
    });
    undoTimeoutRef.current = window.setTimeout(() => {
      setPendingUndo(null);
      undoTimeoutRef.current = null;
    }, UNDO_TIMEOUT_MS);

    refreshState();
    toast({
      title: copy.doneToast,
      description: item.title || copy.doneToastDescription,
      tone: "success",
    });
  }

  function handleUndo() {
    if (!pendingUndo) {
      return;
    }

    const restored = undoHandleQueueCompletion(pendingUndo.token);

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }

    if (!restored) {
      toast({
        title: copy.failedToast,
        description: copy.failedToastDescription,
        tone: "warning",
      });
      return;
    }

    setPendingUndo(null);
    refreshState();
    toast({
      title: productionCopy.undoToast,
      description: productionCopy.undoToastDescription,
      tone: "success",
    });
  }

  if (loadError) {
    return (
      <section
        dir={direction}
        className="mx-auto w-full max-w-4xl px-1 text-right"
      >
        <div className="rounded-[22px] bg-white/76 p-4 shadow-[0_10px_24px_rgba(33,43,63,0.04)] ring-1 ring-rose-100">
          <h1 className="text-lg font-black text-[#111827]">
            {copy.failedToast}
          </h1>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {copy.failedToastDescription}
          </p>
          <Button
            onClick={refreshState}
            tone="primary"
            size="sm"
            className="mt-3"
          >
            {productionCopy.retry}
          </Button>
        </div>
      </section>
    );
  }

  if (!state) {
    return (
      <section
        dir={direction}
        className="mx-auto w-full max-w-4xl px-1 text-right"
      >
        <div className="space-y-3">
          <div className="rounded-[24px] bg-white/62 p-4 ring-1 ring-white/70">
            <p className="text-sm font-black text-slate-500">{copy.loading}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              {productionCopy.loadingDetail}
            </p>
          </div>
          <div className="h-24 animate-pulse rounded-[22px] bg-white/50" />
          <div className="h-16 animate-pulse rounded-[20px] bg-white/42" />
        </div>
      </section>
    );
  }

  const nowItems = state.items.filter(
    (item) =>
      item.urgency === "overdue" ||
      item.urgency === "today" ||
      item.urgency === "review"
  );
  const laterItems = state.items.filter((item) => !nowItems.includes(item));
  const title =
    nowItems.length > 0
      ? copy.activeTitle(nowItems.length)
      : laterItems.length > 0
        ? productionCopy.upcomingTitle
        : copy.calmTitle;
  const subtitle =
    nowItems.length > 0
      ? copy.subtitle
      : laterItems.length > 0
        ? productionCopy.upcomingSubtitle
        : copy.calmSubtitle;
  const summaryChips = [
    {
      label: getUrgencyLabel("overdue", languageKey),
      value: state.summary.overdue,
      className: urgencyClasses.overdue,
    },
    {
      label: getUrgencyLabel("today", languageKey),
      value: state.summary.today,
      className: urgencyClasses.today,
    },
    {
      label: getUrgencyLabel("review", languageKey),
      value: state.summary.review,
      className: urgencyClasses.review,
    },
    {
      label: copy.soon,
      value: laterItems.length,
      className: urgencyClasses.open,
    },
  ].filter((chip) => chip.value > 0);
  const flowCopy =
    languageKey === "en"
      ? {
          capture: "Add something",
          captureDescription: "Send a note, file or receipt into Inbox.",
          memory: "Find something",
          memoryDescription: "Search what was already saved.",
        }
      : {
          capture: "להוסיף משהו",
          captureDescription: "שלחו פתק, קובץ או קבלה ל-Inbox.",
          memory: "למצוא משהו",
          memoryDescription: "חפשו מה שכבר נשמר.",
        };

  return (
    <div
      dir={direction}
      className="mx-auto w-full max-w-4xl space-y-4 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] text-right lg:pb-0"
    >
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-bl from-[#fff8eb] via-white to-[#eef7ff] px-4 py-4 shadow-[0_10px_28px_rgba(33,43,63,0.045)]">
        <div className="pointer-events-none absolute inset-y-4 end-0 w-1 rounded-full bg-[#d8b470]" />
        <div className="max-w-[34rem]">
          <h1 className="text-[27px] font-black leading-8 text-[#111827] sm:text-[30px] sm:leading-9">
            {title}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {subtitle}
          </p>
        </div>

        {summaryChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {summaryChips.map((chip) => (
              <StatusPill
                key={chip.label}
                size="sm"
                className={chip.className}
              >
                {chip.value} {chip.label}
              </StatusPill>
            ))}
          </div>
        ) : (
          <div className="mt-3 inline-flex rounded-full bg-white/72 px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-white/80">
            0 {copy.total}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-2" aria-label="Handle next steps">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("nestly-open-universal-inbox"))
          }
          className="flex min-h-[64px] items-center gap-2.5 rounded-[22px] bg-[#111827] px-3 py-2.5 text-right text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)] transition active:scale-[0.98]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-white/12 text-[#f5d99f]">
            <AppIcon name="spark" className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-black leading-4">
              {flowCopy.capture}
            </span>
            <span className="mt-0.5 block line-clamp-2 text-[10px] font-bold leading-4 text-white/64">
              {flowCopy.captureDescription}
            </span>
          </span>
        </button>
        <Link
          href="/memory"
          className="flex min-h-[64px] items-center gap-2.5 rounded-[22px] bg-white/58 px-3 py-2.5 text-right text-[#111827] shadow-[0_6px_16px_rgba(33,43,63,0.03)] transition hover:bg-white active:scale-[0.98]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-[#fff8eb] text-[#8a5b16]">
            <AppIcon name="knowledge" className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-black leading-4">
              {flowCopy.memory}
            </span>
            <span className="mt-0.5 block line-clamp-2 text-[10px] font-bold leading-4 text-slate-500">
              {flowCopy.memoryDescription}
            </span>
          </span>
        </Link>
      </section>

      {state.warnings.length > 0 ? (
        <section className="rounded-[20px] bg-amber-50/72 px-3 py-2.5 text-right ring-1 ring-amber-100">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-2xl bg-white/70 text-[#8a5b16]">
              <AppIcon name="bell" className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#8a5b16]">
                {productionCopy.warningTitle}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-5 text-slate-600">
                {productionCopy.warningDetail}
              </p>
            </div>
            <Button
              onClick={refreshState}
              tone="secondary"
              size="sm"
              className="min-h-8 shrink-0 px-3 text-[11px]"
            >
              {productionCopy.retry}
            </Button>
          </div>
        </section>
      ) : null}

      {pendingUndo ? (
        <section className="rounded-[20px] bg-[#111827] px-3 py-3 text-right text-white shadow-[0_14px_28px_rgba(17,24,39,0.14)]">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#f5d99f]">
              <AppIcon name="check" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black">{pendingUndo.title}</p>
              <p className="mt-0.5 text-[11px] font-semibold leading-5 text-white/68">
                {productionCopy.undoDetail}
              </p>
            </div>
            <Button
              onClick={handleUndo}
              tone="secondary"
              size="sm"
              className="min-h-9 shrink-0 px-3 text-[11px]"
            >
              {productionCopy.undo}
            </Button>
          </div>
        </section>
      ) : null}

      {state.items.length > 0 ? (
        <>
          <Section
            title={copy.now}
            subtitle={copy.nowSubtitle}
            items={nowItems}
            languageKey={languageKey}
            onComplete={handleComplete}
          />
          <Section
            title={copy.later}
            subtitle={copy.laterSubtitle}
            items={laterItems}
            languageKey={languageKey}
            onComplete={handleComplete}
          />
        </>
      ) : (
        <section className="border-t border-[#eee8db]/70 px-1 pt-4">
          <p className="text-base font-black leading-7 text-[#111827]">
            {copy.empty}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("nestly-open-universal-inbox"))
              }
              tone="primary"
              size="sm"
            >
              {flowCopy.capture}
            </Button>
            <LinkButton
              href="/memory"
              tone="secondary"
              size="sm"
            >
              {flowCopy.memory}
            </LinkButton>
          </div>
        </section>
      )}

      {state.completedItems.length > 0 && (
        <section className="space-y-2.5 px-1">
          <SectionHeader
            title={copy.completed}
            subtitle={copy.completedSubtitle}
          />
          <div className="divide-y divide-[#eee8db]/70">
            {state.completedItems.map((item) => (
              <CompletedItemRow
                key={item.id}
                item={item}
                languageKey={languageKey}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
