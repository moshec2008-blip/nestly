"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReceiptScanPreview from "@/components/ai/ReceiptScanPreview";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useLanguage } from "@/i18n/useLanguage";
import {
  convertCapture,
  createCapture,
  readCaptures,
  updateCapture,
} from "@/services/captureEngine";
import type {
  CaptureSource,
  CaptureStatus,
  CaptureSuggestion,
  SmartCapture,
} from "@/types/capture";

type CaptureOption = {
  source: CaptureSource;
  title: string;
  description: string;
  icon: AppIconName;
  mode: "text" | "brain" | "link" | "receipt";
  href?: string;
};

type FloatingPosition = {
  x: number;
  y: number;
};

type CaptureHistoryFilter = "all" | "today" | "week" | "needs_review" | "converted" | "archived";

const captureButtonPositionKey = "nestly-smart-capture-button-position";
const dragThreshold = 6;

const copy = {
  he: {
    trigger: "לכידה",
    dragHint: "אפשר לגרור כדי להזיז",
    title: "לכוד מהר",
    subtitle: "רושמים עכשיו, Nestly יסדר אחר כך.",
    quickNote: "פתק מהיר",
    quickNoteDescription: "מחשבה, רעיון או פרט קטן",
    brainDump: "פריקת מחשבות",
    brainDumpDescription: "כל מה שיושב בראש, בשורה אחת",
    receipt: "סריקת קבלה",
    receiptDescription: "קבלה להוצאה ומסמך",
    document: "העלאת מסמך",
    documentDescription: "מעבר למרכז המסמכים",
    task: "משימה",
    taskDescription: "ליצור משימה מהירה",
    shopping: "קנייה",
    shoppingDescription: "להוסיף פריט לרשימה",
    reminder: "תזכורת",
    reminderDescription: "משהו שצריך לחזור אליו",
    inbox: "Smart Inbox",
    recent: "לכידות אחרונות",
    review: "סקירת הצעות",
    placeholder: "מה עובר לך בראש?",
    brainPlaceholder:
      "לדוגמה: צריך לקבוע תור לרופא, לקנות חלב, לבדוק תשלום חשמל...",
    save: "שמור",
    cancel: "ביטול",
    convert: "העבר למודולים",
    converted: "הועבר",
    archived: "ארכב",
    archive: "ארכוב",
    reject: "דחה",
    statusNew: "חדש",
    statusReviewed: "נסקר",
    statusConverted: "הועבר",
    statusArchived: "בארכיון",
    statusRejected: "נדחה",
    filterAll: "הכל",
    filterToday: "היום",
    filterWeek: "השבוע",
    filterNeedsReview: "לסקירה",
    filterConverted: "הועברו",
    filterArchived: "ארכיון",
    noCaptures: "עדיין אין לכידות.",
    suggestionsFound: (count: number) => `מצאנו ${count} הצעות אפשריות`,
    savedTitle: "נשמר ב-Smart Inbox",
    savedDescription: "אפשר לסקור ולאשר הצעות לפני יצירה.",
    convertedTitle: "ההצעות הועברו",
    convertedDescription: (count: number) => `${count} פריטים נוצרו במודולים.`,
  },
  en: {
    trigger: "Capture",
    dragHint: "Drag to move",
    title: "Capture quickly",
    subtitle: "Write now, Nestly will organize later.",
    quickNote: "Quick note",
    quickNoteDescription: "A thought, idea or small detail",
    brainDump: "Brain dump",
    brainDumpDescription: "Unload everything in your head",
    receipt: "Scan receipt",
    receiptDescription: "Receipt to expense and document",
    document: "Upload document",
    documentDescription: "Go to Document Center",
    task: "Task",
    taskDescription: "Create a quick task",
    shopping: "Shopping",
    shoppingDescription: "Add an item to the list",
    reminder: "Reminder",
    reminderDescription: "Something to come back to",
    inbox: "Smart Inbox",
    recent: "Recent captures",
    review: "Review suggestions",
    placeholder: "What is on your mind?",
    brainPlaceholder:
      "Example: book a doctor appointment, buy milk, check electricity payment...",
    save: "Save",
    cancel: "Cancel",
    convert: "Send to modules",
    converted: "Converted",
    archived: "Archived",
    archive: "Archive",
    reject: "Reject",
    statusNew: "New",
    statusReviewed: "Reviewed",
    statusConverted: "Converted",
    statusArchived: "Archived",
    statusRejected: "Rejected",
    filterAll: "All",
    filterToday: "Today",
    filterWeek: "This week",
    filterNeedsReview: "Review",
    filterConverted: "Converted",
    filterArchived: "Archive",
    noCaptures: "No captures yet.",
    suggestionsFound: (count: number) => `We found ${count} possible actions`,
    savedTitle: "Saved to Smart Inbox",
    savedDescription: "Review and approve suggestions before anything is created.",
    convertedTitle: "Suggestions converted",
    convertedDescription: (count: number) => `${count} items were created in modules.`,
  },
} as const;

function suggestionTypeLabel(type: CaptureSuggestion["type"], language: string) {
  const labels = {
    he: {
      task: "משימה",
      shopping: "קנייה",
      reminder: "תזכורת",
      finance_follow_up: "כספים",
      vehicle_reminder: "רכב",
      health_reminder: "בריאות",
      family_event: "אירוע",
      document: "מסמך",
      family_knowledge: "ידע",
    },
    en: {
      task: "Task",
      shopping: "Shopping",
      reminder: "Reminder",
      finance_follow_up: "Finance",
      vehicle_reminder: "Vehicle",
      health_reminder: "Health",
      family_event: "Event",
      document: "Document",
      family_knowledge: "Knowledge",
    },
  } as const;

  return language === "en" ? labels.en[type] : labels.he[type];
}

export default function SmartCaptureLauncher() {
  const { language, direction } = useLanguage();
  const { toast } = useFeedback();
  const text = language === "en" ? copy.en : copy.he;
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<"text" | "brain" | null>(null);
  const [activeSource, setActiveSource] = useState<CaptureSource>("quick_note");
  const [draft, setDraft] = useState("");
  const [captures, setCaptures] = useState<SmartCapture[]>([]);
  const [reviewCapture, setReviewCapture] = useState<SmartCapture | null>(null);
  const [activeHistoryFilter, setActiveHistoryFilter] =
    useState<CaptureHistoryFilter>("all");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    didDrag: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [buttonPosition, setButtonPosition] = useState<FloatingPosition | null>(
    null
  );

  const clampFloatingPosition = useCallback((position: FloatingPosition) => {
    if (typeof window === "undefined") {
      return position;
    }

    const element = triggerRef.current;
    const elementWidth = element?.offsetWidth || 56;
    const elementHeight = element?.offsetHeight || 56;
    const horizontalPadding = 8;
    const topPadding = 72;
    const bottomPadding = 12;
    const maxX = Math.max(
      horizontalPadding,
      window.innerWidth - elementWidth - horizontalPadding
    );
    const maxY = Math.max(
      topPadding,
      window.innerHeight - elementHeight - bottomPadding
    );

    return {
      x: Math.min(Math.max(position.x, horizontalPadding), maxX),
      y: Math.min(Math.max(position.y, topPadding), maxY),
    };
  }, []);

  const getDefaultFloatingPosition = useCallback(() => {
    if (typeof window === "undefined") {
      return { x: 16, y: 320 };
    }

    const element = triggerRef.current;
    const elementWidth = element?.offsetWidth || 56;
    const elementHeight = element?.offsetHeight || 56;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const rightOffset = isDesktop ? 16 : 12;
    const bottomOffset = isDesktop ? 24 : 96;

    return clampFloatingPosition({
      x: window.innerWidth - elementWidth - rightOffset,
      y: window.innerHeight - elementHeight - bottomOffset,
    });
  }, [clampFloatingPosition]);

  const historyFilters = useMemo(
    () =>
      [
        { id: "all", label: text.filterAll },
        { id: "today", label: text.filterToday },
        { id: "week", label: text.filterWeek },
        { id: "needs_review", label: text.filterNeedsReview },
        { id: "converted", label: text.filterConverted },
        { id: "archived", label: text.filterArchived },
      ] satisfies Array<{ id: CaptureHistoryFilter; label: string }>,
    [text]
  );

  const filteredCaptures = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    return captures.filter((capture) => {
      const createdAt = new Date(capture.createdAt);

      if (activeHistoryFilter === "today") {
        return capture.createdAt.slice(0, 10) === todayKey;
      }

      if (activeHistoryFilter === "week") {
        return createdAt >= weekStart;
      }

      if (activeHistoryFilter === "needs_review") {
        return capture.status === "new" || capture.status === "reviewed";
      }

      if (activeHistoryFilter === "converted") {
        return capture.status === "converted";
      }

      if (activeHistoryFilter === "archived") {
        return capture.status === "archived";
      }

      return capture.status !== "rejected";
    });
  }, [activeHistoryFilter, captures]);

  const options: CaptureOption[] = [
    {
      source: "quick_note",
      title: text.quickNote,
      description: text.quickNoteDescription,
      icon: "spark",
      mode: "text",
    },
    {
      source: "brain_dump",
      title: text.brainDump,
      description: text.brainDumpDescription,
      icon: "dashboard",
      mode: "brain",
    },
    {
      source: "quick_task",
      title: text.task,
      description: text.taskDescription,
      icon: "check",
      mode: "text",
    },
    {
      source: "quick_shopping",
      title: text.shopping,
      description: text.shoppingDescription,
      icon: "shopping",
      mode: "text",
    },
    {
      source: "quick_reminder",
      title: text.reminder,
      description: text.reminderDescription,
      icon: "calendar",
      mode: "text",
    },
    {
      source: "receipt_scan",
      title: text.receipt,
      description: text.receiptDescription,
      icon: "finance",
      mode: "receipt",
    },
    {
      source: "document_upload",
      title: text.document,
      description: text.documentDescription,
      icon: "document",
      mode: "link",
      href: "/documents",
    },
  ];

  useEffect(() => {
    const restorePosition = window.setTimeout(() => {
      try {
        const savedPosition = window.localStorage.getItem(
          captureButtonPositionKey
        );
        if (savedPosition) {
          const parsed = JSON.parse(savedPosition) as Partial<FloatingPosition>;
          if (
            typeof parsed.x === "number" &&
            Number.isFinite(parsed.x) &&
            typeof parsed.y === "number" &&
            Number.isFinite(parsed.y)
          ) {
            setButtonPosition(
              clampFloatingPosition({ x: parsed.x, y: parsed.y })
            );
            return;
          }
        }
      } catch {
        window.localStorage.removeItem(captureButtonPositionKey);
      }

      setButtonPosition(getDefaultFloatingPosition());
    }, 0);

    function handleResize() {
      setButtonPosition((currentPosition) =>
        clampFloatingPosition(currentPosition ?? getDefaultFloatingPosition())
      );
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.clearTimeout(restorePosition);
      window.removeEventListener("resize", handleResize);
    };
  }, [clampFloatingPosition, getDefaultFloatingPosition]);

  function refreshCaptures() {
    setCaptures(readCaptures());
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(refreshCaptures, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!activeMode) {
      return;
    }

    const timeoutId = window.setTimeout(() => textareaRef.current?.focus(), 50);
    return () => window.clearTimeout(timeoutId);
  }, [activeMode]);

  function openTextCapture(source: CaptureSource, mode: "text" | "brain") {
    setActiveSource(source);
    setActiveMode(mode);
    setDraft("");
  }

  function saveDraft() {
    const content = draft.trim();

    if (!content) {
      return;
    }

    const capture = createCapture({ source: activeSource, content });
    setDraft("");
    setActiveMode(null);
    setReviewCapture(capture);
    refreshCaptures();
    toast({
      title: text.savedTitle,
      description: text.savedDescription,
      tone: "success",
    });
  }

  function updateSuggestion(
    capture: SmartCapture,
    suggestionId: string,
    patch: Partial<CaptureSuggestion>
  ) {
    const nextCapture = {
      ...capture,
      status: "reviewed" as const,
      suggestions: capture.suggestions.map((suggestion) =>
        suggestion.id === suggestionId ? { ...suggestion, ...patch } : suggestion
      ),
    };
    setReviewCapture(nextCapture);
    updateCapture(nextCapture);
    refreshCaptures();
  }

  function convertReviewedCapture() {
    if (!reviewCapture) {
      return;
    }

    const result = convertCapture(reviewCapture);
    const updatedCapture = {
      ...reviewCapture,
      status: result.created > 0 ? ("converted" as const) : ("reviewed" as const),
    };
    setReviewCapture(updatedCapture);
    refreshCaptures();
    toast({
      title: text.convertedTitle,
      description: text.convertedDescription(result.created),
      tone: result.created > 0 ? "success" : "info",
    });
  }

  function archiveCapture(capture: SmartCapture) {
    updateCapture({ ...capture, status: "archived" });
    if (reviewCapture?.id === capture.id) {
      setReviewCapture(null);
    }
    refreshCaptures();
  }

  function rejectCapture(capture: SmartCapture) {
    updateCapture({
      ...capture,
      status: "rejected",
      suggestions: capture.suggestions.map((suggestion) => ({
        ...suggestion,
        accepted: false,
        ignored: true,
      })),
    });
    if (reviewCapture?.id === capture.id) {
      setReviewCapture(null);
    }
    refreshCaptures();
  }

  function statusLabel(status: CaptureStatus) {
    if (status === "converted") {
      return text.statusConverted;
    }

    if (status === "archived") {
      return text.statusArchived;
    }

    if (status === "rejected") {
      return text.statusRejected;
    }

    if (status === "reviewed") {
      return text.statusReviewed;
    }

    return text.statusNew;
  }

  function handleTriggerClick() {
    if (suppressClickRef.current) {
      return;
    }

    setIsOpen(true);
  }

  function handleTriggerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const origin = buttonPosition ?? getDefaultFloatingPosition();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
      didDrag: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTriggerPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (Math.hypot(deltaX, deltaY) > dragThreshold) {
      dragState.didDrag = true;
    }

    setButtonPosition(
      clampFloatingPosition({
        x: dragState.originX + deltaX,
        y: dragState.originY + deltaY,
      })
    );
  }

  function handleTriggerPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const finalPosition = clampFloatingPosition({
      x: dragState.originX + event.clientX - dragState.startX,
      y: dragState.originY + event.clientY - dragState.startY,
    });

    if (dragState.didDrag) {
      suppressClickRef.current = true;
      setButtonPosition(finalPosition);
      window.localStorage.setItem(
        captureButtonPositionKey,
        JSON.stringify(finalPosition)
      );
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragStateRef.current = null;
  }

  const floatingButtonStyle: CSSProperties | undefined = buttonPosition
    ? { left: buttonPosition.x, top: buttonPosition.y }
    : undefined;

  return (
    <>
      <div
        ref={triggerRef}
        style={floatingButtonStyle}
        className={[
          "fixed z-[65] touch-none select-none",
          buttonPosition
            ? ""
            : "bottom-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+0.75rem)] right-3 lg:bottom-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+0.85rem)] lg:right-4",
        ].join(" ")}
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={handleTriggerPointerEnd}
        onPointerCancel={handleTriggerPointerEnd}
        title={text.dragHint}
      >
        <button
          type="button"
          onClick={handleTriggerClick}
          className="hidden min-h-12 cursor-grab items-center gap-2 rounded-2xl border border-[#eadfcd] bg-white/94 px-4 text-sm font-black text-[#111827] shadow-[0_16px_44px_rgba(33,43,63,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#fffdf8] active:cursor-grabbing lg:inline-flex"
          aria-label={`${text.trigger}. ${text.dragHint}`}
        >
          <AppIcon name="spark" className="h-4.5 w-4.5 text-[#7a5212]" />
          {text.trigger}
        </button>

        <button
          type="button"
          onClick={handleTriggerClick}
          className="inline-flex min-h-12 min-w-[6.25rem] cursor-grab items-center justify-center gap-2 rounded-2xl border border-[#d8b470] bg-[#fff8eb]/98 px-3 text-sm font-black text-[#111827] shadow-[0_18px_46px_rgba(33,43,63,0.22)] backdrop-blur transition active:scale-[0.98] active:cursor-grabbing lg:hidden"
          aria-label={`${text.trigger}. ${text.dragHint}`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[#7a5212] shadow-sm ring-1 ring-[#eadfcd]">
            <AppIcon name="spark" className="h-4.5 w-4.5" />
          </span>
          <span>{text.trigger}</span>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[88] grid place-items-end bg-slate-950/42 p-3 backdrop-blur-sm sm:place-items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
              setActiveMode(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="smart-capture-title"
            className={[
              "w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/80 bg-white text-[#111827] shadow-[0_28px_90px_rgba(15,23,42,0.28)]",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <div className="border-b border-[#edf0f4] bg-gradient-to-l from-[#fff8eb] via-white to-[#eef7ff] p-4">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setActiveMode(null);
                  }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#eadfcd] bg-white text-slate-600 transition hover:bg-[#fffdf8]"
                  aria-label={text.cancel}
                >
                  <AppIcon name="close" className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-xs font-black text-[#7a5212]">
                    {text.inbox}
                  </p>
                  <h2 id="smart-capture-title" className="mt-1 text-xl font-black">
                    {text.title}
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    {text.subtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[min(76vh,46rem)] overflow-y-auto p-4">
              {activeMode ? (
                <div className="space-y-3">
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={activeMode === "brain" ? 7 : 4}
                    placeholder={
                      activeMode === "brain"
                        ? text.brainPlaceholder
                        : text.placeholder
                    }
                    className={[
                      "w-full resize-none rounded-[22px] border border-[#e3d8c9] bg-[#fffdf8] p-4 text-base font-semibold leading-7 text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#d8b470] focus:bg-white",
                      direction === "rtl" ? "text-right" : "text-left",
                    ].join(" ")}
                  />
                  <div className="flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveMode(null)}
                      className="min-h-11 rounded-2xl px-4 text-sm font-black text-slate-500 transition hover:bg-[#fff8eb]"
                    >
                      {text.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      disabled={!draft.trim()}
                      className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-5 text-sm font-black text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {text.save}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {options.map((option) => {
                      if (option.mode === "receipt") {
                        return (
                          <ReceiptScanPreview
                            key={option.source}
                            userMode="basic"
                            triggerClassName="flex min-h-[76px] cursor-pointer items-center justify-between gap-3 rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3 text-right shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                            triggerContent={
                              <>
                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                  <AppIcon name={option.icon} className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-black text-slate-950">
                                    {option.title}
                                  </span>
                                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                                    {option.description}
                                  </span>
                                </span>
                              </>
                            }
                          />
                        );
                      }

                      if (option.mode === "link" && option.href) {
                        return (
                          <Link
                            key={option.source}
                            href={option.href}
                            onClick={() => setIsOpen(false)}
                            className="flex min-h-[76px] items-center justify-between gap-3 rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                          >
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                              <AppIcon name={option.icon} className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-black text-slate-950">
                                {option.title}
                              </span>
                              <span className="mt-1 block text-xs font-semibold text-slate-500">
                                {option.description}
                              </span>
                            </span>
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={option.source}
                          type="button"
                          onClick={() =>
                            openTextCapture(
                              option.source,
                              option.mode === "brain" ? "brain" : "text"
                            )
                          }
                          className="flex min-h-[76px] items-center justify-between gap-3 rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                        >
                          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                            <AppIcon name={option.icon} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-slate-950">
                              {option.title}
                            </span>
                            <span className="mt-1 block text-xs font-semibold text-slate-500">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <aside className="rounded-[22px] border border-[#ebe4d8] bg-[#fafafb] p-3">
                    <h3 className="text-sm font-black text-slate-950">
                      {text.recent}
                    </h3>
                    <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
                      {historyFilters.map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => setActiveHistoryFilter(filter.id)}
                          className={[
                            "min-h-8 shrink-0 rounded-full px-3 text-[11px] font-black transition",
                            activeHistoryFilter === filter.id
                              ? "bg-[#111827] text-white shadow-sm"
                              : "bg-white text-slate-500 ring-1 ring-[#edf0f4] hover:text-slate-900",
                          ].join(" ")}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 space-y-2">
                      {filteredCaptures.length > 0 ? (
                        filteredCaptures.slice(0, 6).map((capture) => (
                          <button
                            key={capture.id}
                            type="button"
                            onClick={() => setReviewCapture(capture)}
                            className="w-full rounded-2xl bg-white p-3 text-right transition hover:bg-[#fff8eb]"
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate text-xs font-black text-slate-950">
                                {capture.title}
                              </span>
                              <span className="shrink-0 rounded-full bg-[#f6efe5] px-2 py-0.5 text-[10px] font-black text-[#7a5212]">
                                {statusLabel(capture.status)}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-[11px] font-semibold text-slate-500">
                              {text.suggestionsFound(capture.suggestions.length)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-white p-3 text-xs font-semibold text-slate-500">
                          {text.noCaptures}
                        </p>
                      )}
                    </div>
                  </aside>
                </div>
              )}

              {reviewCapture && (
                <div className="mt-4 rounded-[24px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewCapture(null)}
                      className="grid h-9 w-9 place-items-center rounded-2xl border border-[#eadfcd] bg-white text-slate-600"
                      aria-label={text.cancel}
                    >
                      <AppIcon name="close" className="h-4 w-4" />
                    </button>
                    <div>
                      <p className="text-xs font-black text-[#7a5212]">
                        {text.review}
                      </p>
                      <h3 className="mt-1 text-base font-black text-slate-950">
                        {reviewCapture.title}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {reviewCapture.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="rounded-2xl bg-white p-3 ring-1 ring-[#edf0f4]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex min-h-10 shrink-0 items-center gap-2 text-xs font-black text-slate-700">
                            <input
                              type="checkbox"
                              checked={suggestion.accepted && !suggestion.ignored}
                              onChange={(event) =>
                                updateSuggestion(reviewCapture, suggestion.id, {
                                  accepted: event.target.checked,
                                  ignored: !event.target.checked,
                                })
                              }
                              className="h-4 w-4 accent-[#111827]"
                            />
                            {suggestion.accepted && !suggestion.ignored ? "✓" : "×"}
                          </label>
                          <div className="min-w-0 flex-1">
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700 ring-1 ring-sky-100">
                              {suggestionTypeLabel(suggestion.type, language)}
                            </span>
                            <input
                              value={suggestion.title}
                              onChange={(event) =>
                                updateSuggestion(reviewCapture, suggestion.id, {
                                  title: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-xl border border-[#edf0f4] bg-[#fafafb] px-3 py-2 text-sm font-black text-slate-950 outline-none focus:border-[#d8b470] focus:bg-white"
                            />
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {suggestion.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => archiveCapture(reviewCapture)}
                        className="min-h-10 rounded-2xl px-3 text-xs font-black text-slate-500 transition hover:bg-white"
                      >
                        {text.archive}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectCapture(reviewCapture)}
                        className="min-h-10 rounded-2xl px-3 text-xs font-black text-rose-600 transition hover:bg-white"
                      >
                        {text.reject}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={convertReviewedCapture}
                      disabled={reviewCapture.status === "converted"}
                      className="min-h-10 rounded-2xl border border-[#d8caba] bg-white px-4 text-xs font-black text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffdf8] disabled:opacity-50"
                    >
                      {text.convert}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
