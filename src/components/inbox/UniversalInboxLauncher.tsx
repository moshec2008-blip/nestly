"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  confirmUniversalInboxItem,
  createUniversalInboxItem,
  readUniversalInboxItems,
  updateUniversalInboxItem,
} from "@/services/universalInboxService";
import type {
  UniversalInboxActionType,
  UniversalInboxFile,
  UniversalInboxInputSource,
  UniversalInboxItem,
  UniversalInboxSuggestedAction,
} from "@/types/universalInbox";

type InboxMode = "text" | "files" | "clipboard";

const sourceOptions: Array<{
  id: UniversalInboxInputSource;
  label: string;
  description: string;
}> = [
  {
    id: "text",
    label: "טקסט",
    description: "פתק, משימה, הודעה או מחשבה",
  },
  {
    id: "camera_scan",
    label: "סריקה",
    description: "צילום, מסמך, קבלה או צילום מסך",
  },
  {
    id: "shared_file",
    label: "קובץ",
    description: "PDF, תמונה או מסמך משותף",
  },
  {
    id: "clipboard",
    label: "לוח",
    description: "מידע שהועתק ממקום אחר",
  },
];

const actionLabels: Record<UniversalInboxActionType, string> = {
  create_task: "משימה",
  create_reminder: "תזכורת",
  attach_to_life_event: "סיפור חיים",
  store_document: "מסמך",
  add_transaction: "כספים",
  add_shopping_item: "קניות",
  update_existing_entity: "עדכון קיים",
  create_warranty_reminder: "אחריות",
  save_as_knowledge: "ידע",
};

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function sourceFromFile(file: File): UniversalInboxInputSource {
  if (file.type.startsWith("image/")) {
    return "photo";
  }

  if (file.type.includes("pdf")) {
    return "pdf";
  }

  return "document";
}

function fileToInboxFile(file: File): UniversalInboxFile {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    sourceHint: sourceFromFile(file),
  };
}

function updateAction(
  item: UniversalInboxItem,
  actionId: string,
  patch: Partial<UniversalInboxSuggestedAction>
): UniversalInboxItem {
  return {
    ...item,
    status: "reviewed",
    actions: item.actions.map((action) =>
      action.id === actionId ? { ...action, ...patch } : action
    ),
  };
}

export default function UniversalInboxLauncher() {
  const pathname = usePathname();
  const { toast } = useFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<InboxMode>("text");
  const [source, setSource] = useState<UniversalInboxInputSource>("text");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<UniversalInboxFile[]>([]);
  const [items, setItems] = useState<UniversalInboxItem[]>([]);
  const [reviewItem, setReviewItem] = useState<UniversalInboxItem | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const recentItems = useMemo(
    () => items.filter((item) => item.status !== "cancelled").slice(0, 5),
    [items]
  );
  const canSubmit = draft.trim().length > 0 || files.length > 0;

  useEffect(() => {
    function openInbox(event: Event) {
      const customEvent = event as CustomEvent<{
        source?: UniversalInboxInputSource;
        mode?: InboxMode;
      }>;

      setIsOpen(true);
      setSource(customEvent.detail?.source ?? "text");
      setMode(customEvent.detail?.mode ?? "text");
      setReviewItem(null);
    }

    function openLegacyCapture(event: Event) {
      const customEvent = event as CustomEvent<{
        source?: string;
        mode?: "text" | "brain" | "receipt";
      }>;
      const legacySource = customEvent.detail?.source;
      const legacyMode = customEvent.detail?.mode;

      setIsOpen(true);
      setReviewItem(null);

      if (legacyMode === "receipt" || legacySource === "receipt_scan") {
        setSource("camera_scan");
        setMode("files");
        return;
      }

      setSource("text");
      setMode(legacyMode === "brain" ? "text" : "text");
    }

    window.addEventListener("nestly-open-universal-inbox", openInbox);
    window.addEventListener("nestly-open-smart-capture", openLegacyCapture);

    return () => {
      window.removeEventListener("nestly-open-universal-inbox", openInbox);
      window.removeEventListener("nestly-open-smart-capture", openLegacyCapture);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setItems(readUniversalInboxItems());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode === "files") {
      return;
    }

    const timeoutId = window.setTimeout(() => textAreaRef.current?.focus(), 50);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, mode]);

  function refreshItems() {
    setItems(readUniversalInboxItems());
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    setFiles(selectedFiles.map(fileToInboxFile));

    if (selectedFiles.length > 0 && source === "text") {
      setSource(selectedFiles.some((file) => file.type.startsWith("image/")) ? "photo" : "document");
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setDraft(text);
      setSource("clipboard");
      setMode("clipboard");
    } catch {
      toast({
        title: "לא ניתן לקרוא מהלוח",
        description: "אפשר להדביק ידנית בשדה הטקסט.",
        tone: "warning",
      });
    }
  }

  function submitToPipeline() {
    if (!canSubmit) {
      return;
    }

    const item = createUniversalInboxItem({
      source,
      text: draft,
      files,
    });

    setDraft("");
    setFiles([]);
    setReviewItem(item);
    refreshItems();
    toast({
      title: "נכנס ל-Universal Inbox",
      description: "Nestly סיווגה והכינה הצעות. שום דבר לא נשמר בלי אישור.",
      tone: "success",
    });
  }

  function updateReviewItem(nextItem: UniversalInboxItem) {
    setReviewItem(nextItem);
    updateUniversalInboxItem(nextItem);
    refreshItems();
  }

  function toggleRelationship(relationshipId: string, accepted: boolean) {
    if (!reviewItem) {
      return;
    }

    updateReviewItem({
      ...reviewItem,
      status: "reviewed",
      relationships: reviewItem.relationships.map((relationship) =>
        relationship.id === relationshipId
          ? { ...relationship, accepted }
          : relationship
      ),
    });
  }

  function saveReviewedItem() {
    if (!reviewItem) {
      return;
    }

    const result = confirmUniversalInboxItem(reviewItem);
    refreshItems();
    setReviewItem(null);
    toast({
      title: "נשמר לאחר אישור",
      description: `${result.created} פעולות נוצרו, ${result.relationships} קשרים נשמרו.`,
      tone: "success",
    });
  }

  function archiveItem(item: UniversalInboxItem) {
    const nextItem: UniversalInboxItem = { ...item, status: "archived" };
    updateUniversalInboxItem(nextItem);
    if (reviewItem?.id === item.id) {
      setReviewItem(null);
    }
    refreshItems();
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+0.75rem)] right-3 z-[65] inline-flex min-h-12 min-w-[6.5rem] items-center justify-center gap-2 rounded-2xl border border-[#d8b470] bg-[#fff8eb]/98 px-3 text-sm font-black text-[#111827] shadow-[0_18px_46px_rgba(33,43,63,0.22)] backdrop-blur transition active:scale-[0.98] lg:bottom-4 lg:right-4 lg:min-w-0 lg:px-4"
        aria-label="פתח Universal Inbox"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[#7a5212] shadow-sm ring-1 ring-[#eadfcd]">
          <AppIcon name="spark" className="h-4.5 w-4.5" />
        </span>
        <span>Inbox</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[88] grid place-items-end bg-slate-950/42 p-3 backdrop-blur-sm sm:place-items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="universal-inbox-title"
            className="w-full max-w-4xl overflow-hidden rounded-[30px] border border-white/80 bg-white text-right text-[#111827] shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
            dir="rtl"
          >
            <div className="border-b border-[#edf0f4] bg-gradient-to-l from-[#fff8eb] via-white to-[#eef7ff] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#eadfcd] bg-white text-slate-600 transition hover:bg-[#fffdf8]"
                  aria-label="סגור"
                >
                  <AppIcon name="close" className="h-4 w-4" />
                </button>
                <div className="max-w-2xl">
                  <p className="text-xs font-black text-[#7a5212]">
                    Universal Inbox
                  </p>
                  <h2 id="universal-inbox-title" className="mt-1 text-2xl font-black">
                    שמרו כל דבר. Nestly תבין לאן זה שייך.
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    טקסט, צילום, PDF, צילום מסך או קובץ. הכל עובר דרך אותו
                    pipeline, ואז אתם מאשרים מה באמת נשמר.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid max-h-[min(78vh,48rem)] overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-4">
              <main className="space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {sourceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSource(option.id);
                        setMode(option.id === "shared_file" || option.id === "camera_scan" ? "files" : option.id === "clipboard" ? "clipboard" : "text");
                      }}
                      className={[
                        "rounded-[20px] p-3 text-right transition",
                        source === option.id
                          ? "bg-[#111827] text-white shadow-[0_12px_28px_rgba(17,24,39,0.18)]"
                          : "bg-[#fffdf8] text-[#111827] ring-1 ring-[#eadfcd] hover:bg-white",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-black">{option.label}</span>
                      <span className={source === option.id ? "mt-1 block text-[11px] font-semibold text-white/72" : "mt-1 block text-[11px] font-semibold text-slate-500"}>
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="rounded-[24px] bg-[#fafafb] p-3 ring-1 ring-[#edf0f4]">
                  <textarea
                    ref={textAreaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={5}
                    placeholder="הדביקו הודעה, רשמו מחשבה, גררו רעיון, או הוסיפו פרטים לקובץ..."
                    className="w-full resize-none rounded-[20px] border border-[#e3d8c9] bg-[#fffdf8] p-4 text-base font-semibold leading-7 text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#d8b470] focus:bg-white"
                  />

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white px-3 text-sm font-black text-slate-700 ring-1 ring-[#edf0f4] transition hover:bg-[#fff8eb]">
                      <span className="truncate">
                        {files.length > 0
                          ? `${files.length} קבצים נבחרו`
                          : "צרפו קובץ, PDF או תמונה"}
                      </span>
                      <AppIcon name="document" className="h-4 w-4" />
                      <input
                        type="file"
                        multiple
                        className="sr-only"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFilesChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={pasteFromClipboard}
                      className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-[#edf0f4] transition hover:bg-[#fff8eb]"
                    >
                      הדבק מהלוח
                    </button>
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={submitToPipeline}
                      className="min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      שמור לבדיקה
                    </button>
                  </div>
                </div>

                {reviewItem && (
                  <section className="rounded-[26px] bg-[#fffdf8] p-4 ring-1 ring-[#eadfcd]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[#8a5b16]">
                          מסך סקירה
                        </p>
                        <h3 className="mt-1 text-xl font-black text-[#111827]">
                          {reviewItem.title}
                        </h3>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                          {reviewItem.summary}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
                        {reviewItem.classifications[0]?.type ?? "unknown"} ·{" "}
                        {formatConfidence(reviewItem.classifications[0]?.confidence ?? 0)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[22px] bg-white p-3">
                        <h4 className="text-sm font-black text-[#111827]">
                          למה Nestly חושבת כך
                        </h4>
                        <div className="mt-2 space-y-2">
                          {reviewItem.classifications.map((classification) => (
                            <div
                              key={classification.type}
                              className="rounded-2xl bg-[#fafafb] px-3 py-2"
                            >
                              <span className="text-xs font-black text-[#111827]">
                                {classification.type} · {formatConfidence(classification.confidence)}
                              </span>
                              <p className="mt-1 text-xs font-semibold text-slate-600">
                                {classification.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[22px] bg-white p-3">
                        <h4 className="text-sm font-black text-[#111827]">
                          ישויות וקשרים
                        </h4>
                        <div className="mt-2 space-y-2">
                          {reviewItem.entities.length > 0 ? (
                            reviewItem.entities.map((entity) => (
                              <div key={entity.id} className="rounded-2xl bg-[#fafafb] px-3 py-2">
                                <span className="text-xs font-black text-[#111827]">
                                  {entity.label} · {formatConfidence(entity.confidence)}
                                </span>
                                <p className="mt-1 text-xs font-semibold text-slate-600">
                                  {entity.description}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-2xl bg-[#fafafb] px-3 py-3 text-xs font-semibold text-slate-500">
                              לא נמצאה ישות קיימת בוודאות גבוהה.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] bg-white p-3">
                      <h4 className="text-sm font-black text-[#111827]">
                        פעולות מוצעות לאישור
                      </h4>
                      <div className="mt-3 space-y-2">
                        {reviewItem.actions.map((action) => (
                          <div
                            key={action.id}
                            className="rounded-2xl bg-[#fafafb] p-3"
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={action.accepted}
                                onChange={(event) =>
                                  updateReviewItem(
                                    updateAction(reviewItem, action.id, {
                                      accepted: event.target.checked,
                                    })
                                  )
                                }
                                className="mt-1 h-4 w-4 accent-[#111827]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-[#7a5212] shadow-sm">
                                    {actionLabels[action.type]} · {formatConfidence(action.confidence)}
                                  </span>
                                  <Link
                                    href={action.href}
                                    className="text-[11px] font-black text-slate-500 underline-offset-4 hover:underline"
                                  >
                                    פתח אזור
                                  </Link>
                                </div>
                                <input
                                  value={action.title}
                                  onChange={(event) =>
                                    updateReviewItem(
                                      updateAction(reviewItem, action.id, {
                                        title: event.target.value,
                                      })
                                    )
                                  }
                                  className="mt-2 w-full rounded-xl border border-[#edf0f4] bg-white px-3 py-2 text-sm font-black text-[#111827] outline-none focus:border-[#d8b470]"
                                />
                                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                                  {action.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {reviewItem.relationships.length > 0 && (
                      <div className="mt-4 rounded-[22px] bg-white p-3">
                        <h4 className="text-sm font-black text-[#111827]">
                          קשרים לגרף המשפחתי
                        </h4>
                        <div className="mt-2 space-y-2">
                          {reviewItem.relationships.map((relationship) => (
                            <label
                              key={relationship.id}
                              className="flex gap-3 rounded-2xl bg-[#fafafb] p-3"
                            >
                              <input
                                type="checkbox"
                                checked={relationship.accepted}
                                onChange={(event) =>
                                  toggleRelationship(
                                    relationship.id,
                                    event.target.checked
                                  )
                                }
                                className="mt-1 h-4 w-4 accent-[#111827]"
                              />
                              <span>
                                <span className="block text-sm font-black text-[#111827]">
                                  {relationship.title}
                                </span>
                                <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
                                  {relationship.reason} · {formatConfidence(relationship.confidence)}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => archiveItem(reviewItem)}
                        className="min-h-11 rounded-2xl px-4 text-sm font-black text-slate-500 transition hover:bg-white"
                      >
                        ארכוב
                      </button>
                      <button
                        type="button"
                        onClick={saveReviewedItem}
                        className="min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5"
                      >
                        אשר ושמור
                      </button>
                    </div>
                  </section>
                )}
              </main>

              <aside className="mt-4 space-y-3 lg:mt-0">
                <section className="rounded-[24px] bg-[#fafafb] p-3 ring-1 ring-[#edf0f4]">
                  <h3 className="text-sm font-black text-[#111827]">
                    הצינור האחיד
                  </h3>
                  <div className="mt-3 space-y-1.5">
                    {(reviewItem?.stages ?? []).length > 0 ? (
                      reviewItem?.stages.map((stage) => (
                        <div
                          key={stage.id}
                          className="flex items-start gap-2 rounded-2xl bg-white px-3 py-2"
                        >
                          <span
                            className={[
                              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                              stage.status === "complete"
                                ? "bg-emerald-400"
                                : stage.status === "needs_review"
                                  ? "bg-[#d8b470]"
                                  : "bg-slate-300",
                            ].join(" ")}
                          />
                          <span>
                            <span className="block text-xs font-black text-[#111827]">
                              {stage.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-500">
                              {stage.detail}
                            </span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-white px-3 py-3 text-xs font-semibold leading-5 text-slate-500">
                        אחרי שתשמרו משהו לבדיקה, תראו כאן את כל שלבי העיבוד.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-[24px] bg-[#111827] p-3 text-white">
                  <h3 className="text-sm font-black">אחרונים ב-Inbox</h3>
                  <div className="mt-3 space-y-2">
                    {recentItems.length > 0 ? (
                      recentItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setReviewItem(item)}
                          className="w-full rounded-2xl bg-white/10 p-3 text-right transition hover:bg-white/16"
                        >
                          <span className="block truncate text-sm font-black">
                            {item.title}
                          </span>
                          <span className="mt-1 block truncate text-[11px] font-semibold text-white/62">
                            {item.actions.length} פעולות · {item.status}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-semibold text-white/68">
                        עדיין אין פריטים.
                      </p>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
