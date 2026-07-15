"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import {
  formatTimelineTime,
  getTimelineEventLabel,
  getTimelineModuleLabel,
  getVisibilityLabel,
} from "@/lib/timeline/timelineFormatters";
import { groupTimelineItems } from "@/lib/timeline/timelineGrouping";
import {
  importanceTone,
  timelineModuleIcons,
  timelineModuleTones,
} from "@/lib/timeline/timelineEvents";
import {
  archiveTimelineItem,
  createCustomTimelineItem,
  getTimelineItems,
  hideTimelineItem,
  restoreTimelineItem,
} from "@/services/timelineService";
import type { TimelineItem, TimelineSourceModule } from "@/types/timeline";

type TimelineFilter = TimelineSourceModule | "all";

const moduleFilters: TimelineFilter[] = [
  "all",
  "tasks",
  "shopping",
  "finance",
  "documents",
  "vehicles",
  "family",
  "events",
  "health",
  "knowledge",
];

const copy = {
  he: {
    badge: "ציר הזמן המשפחתי",
    title: "מה קרה לאחרונה",
    subtitle:
      "היסטוריה רגועה של פעולות משמעותיות במרחב המשפחתי: מה טופל, מי טיפל ואיפה מוצאים את המקור.",
    addUpdate: "הוסף עדכון",
    close: "סגור",
    search: "חיפוש בציר הזמן",
    importantOnly: "חשוב בלבד",
    clear: "נקה סינון",
    loadMore: "טען עוד",
    openSource: "פתח מקור",
    sourceMissing: "הפריט המקורי אינו זמין עוד",
    hide: "הסתר",
    archive: "ארכב",
    restore: "שחזר",
    hiddenNotice: "העדכון הוסתר מציר הזמן. הפריט המקורי נשאר במקומו.",
    archivedNotice: "העדכון עבר לארכיון.",
    restoredNotice: "העדכון שוחזר לציר הזמן.",
    all: "הכל",
    noItemsTitle: "ציר הזמן המשפחתי מתחיל כאן",
    noItemsDescription:
      "פעולות משמעותיות והתקדמות משפחתית יופיעו כאן אחרי שמירה, השלמה או אישור.",
    noFilteredTitle: "לא נמצאה פעילות שמתאימה לסינון",
    noFilteredDescription: "אפשר לנקות את הסינון או להוסיף עדכון ידני.",
    formTitle: "עדכון משמעותי",
    titleLabel: "כותרת",
    titlePlaceholder: "למשל: סגרנו את ביטוח הרכב",
    descriptionLabel: "תיאור קצר",
    descriptionPlaceholder: "מה חשוב שהמשפחה תדע?",
    dateLabel: "תאריך ושעה",
    moduleLabel: "תחום",
    visibilityLabel: "נראות",
    save: "שמור עדכון",
    cancel: "ביטול",
    saved: "העדכון נשמר בציר הזמן",
    private: "פרטי",
    family: "משפחתי",
    count: (count: number) => `${count} עדכונים`,
  },
  en: {
    badge: "Family Timeline",
    title: "What happened recently",
    subtitle:
      "A calm history of meaningful family activity: what was handled, who handled it and where to find it.",
    addUpdate: "Add update",
    close: "Close",
    search: "Search timeline",
    importantOnly: "Important only",
    clear: "Clear filters",
    loadMore: "Load more",
    openSource: "Open source",
    sourceMissing: "The original record is no longer available",
    hide: "Hide",
    archive: "Archive",
    restore: "Restore",
    hiddenNotice: "The update was hidden. The original record stayed in place.",
    archivedNotice: "The update was archived.",
    restoredNotice: "The update was restored.",
    all: "All",
    noItemsTitle: "The Family Timeline starts here",
    noItemsDescription:
      "Meaningful actions and family progress will appear here after saving, completing or confirming records.",
    noFilteredTitle: "No activity matches this filter",
    noFilteredDescription: "Clear filters or add a manual update.",
    formTitle: "Meaningful update",
    titleLabel: "Title",
    titlePlaceholder: "Example: We renewed the car insurance",
    descriptionLabel: "Short description",
    descriptionPlaceholder: "What should the family know?",
    dateLabel: "Date and time",
    moduleLabel: "Area",
    visibilityLabel: "Visibility",
    save: "Save update",
    cancel: "Cancel",
    saved: "The update was saved to the Timeline",
    private: "Private",
    family: "Family",
    count: (count: number) => `${count} updates`,
  },
} as const;

function toLocalDateTimeValue(value = new Date().toISOString()) {
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromLocalDateTimeValue(value: string) {
  return new Date(value).toISOString();
}

function EmptyState({
  title,
  description,
  onAdd,
}: {
  title: string;
  description: string;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-dashed border-[#d8caba] bg-[#fffdf8] p-8 text-center shadow-[0_14px_38px_rgba(33,43,63,0.05)]">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-white text-[#8a5b16] shadow-sm ring-1 ring-[#eadfcd]">
        <AppIcon name="timeline" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-black text-[#111827]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-5 min-h-11 rounded-2xl border border-[#d8caba] bg-[#fff8eb] px-4 text-sm font-black text-[#6f4a10] shadow-[0_10px_24px_rgba(154,107,23,0.10)] transition hover:bg-white"
      >
        + {copy.he.addUpdate}
      </button>
    </section>
  );
}

function TimelineRow({
  item,
  language,
  onHide,
  onArchive,
  onRestore,
}: {
  item: TimelineItem;
  language: "he" | "en";
  onHide: (item: TimelineItem) => void;
  onArchive: (item: TimelineItem) => void;
  onRestore: (item: TimelineItem) => void;
}) {
  const text = copy[language];
  const isInactive = item.status !== "active";

  return (
    <li
      className={[
        "relative flex gap-3 border-b border-[#edf0f4] py-3 last:border-b-0",
        isInactive ? "opacity-70" : "",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
          timelineModuleTones[item.sourceModule],
        ].join(" ")}
      >
        <AppIcon name={timelineModuleIcons[item.sourceModule]} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="min-w-0 truncate text-sm font-black text-[#111827]">
            {item.title}
          </h3>
          {item.importance !== "normal" ? (
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-black ring-1",
                importanceTone(item.importance),
              ].join(" ")}
            >
              {item.importance === "critical"
                ? language === "en"
                  ? "Critical"
                  : "דחוף"
                : language === "en"
                  ? "Important"
                  : "חשוב"}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
            {item.description}
          </p>
        ) : null}
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <span>{formatTimelineTime(item.occurredAt, language)}</span>
          <span>·</span>
          <span>{getTimelineModuleLabel(item.sourceModule, language)}</span>
          <span>·</span>
          <span>{getTimelineEventLabel(item.eventType, language)}</span>
          {item.actorDisplayName ? (
            <>
              <span>·</span>
              <span>{item.actorDisplayName}</span>
            </>
          ) : null}
          <span>·</span>
          <span>{getVisibilityLabel(item.visibility, language)}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {item.sourceUrl ? (
          <Link
            href={item.sourceUrl}
            className="inline-flex min-h-9 items-center rounded-2xl border border-[#eadfcd] bg-white px-3 text-[11px] font-black text-slate-700 transition hover:bg-[#fff8eb]"
          >
            {text.openSource}
          </Link>
        ) : (
          <span className="max-w-24 text-left text-[10px] font-bold text-slate-400">
            {text.sourceMissing}
          </span>
        )}
        <div className="flex flex-wrap justify-end gap-1">
          {item.status === "active" ? (
            <>
              <button
                type="button"
                onClick={() => onHide(item)}
                className="min-h-8 rounded-full px-2 text-[10px] font-black text-slate-500 hover:bg-slate-50"
              >
                {text.hide}
              </button>
              <button
                type="button"
                onClick={() => onArchive(item)}
                className="min-h-8 rounded-full px-2 text-[10px] font-black text-slate-500 hover:bg-slate-50"
              >
                {text.archive}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onRestore(item)}
              className="min-h-8 rounded-full px-2 text-[10px] font-black text-[#6f4a10] hover:bg-[#fff8eb]"
            >
              {text.restore}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function FamilyTimelinePage() {
  const { language, direction } = useLanguage();
  const activeLanguage = language === "en" ? "en" : "he";
  const text = copy[activeLanguage];
  const [search, setSearch] = useState("");
  const [sourceModule, setSourceModule] = useState<TimelineFilter>("all");
  const [importanceOnly, setImportanceOnly] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [limit, setLimit] = useState(30);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDate, setManualDate] = useState(toLocalDateTimeValue());
  const [manualModule, setManualModule] = useState<TimelineSourceModule>("system");
  const [manualVisibility, setManualVisibility] = useState<"family" | "private">(
    "family"
  );

  const page = useMemo(() => {
    void refreshKey;
    return getTimelineItems({
      search,
      sourceModule,
      importanceOnly,
      includeArchived,
      includeHidden: includeArchived,
      limit,
    });
  }, [includeArchived, importanceOnly, limit, refreshKey, search, sourceModule]);

  const groups = useMemo(
    () => groupTimelineItems(page.items, activeLanguage),
    [activeLanguage, page.items]
  );

  function refresh(message?: string) {
    setRefreshKey((current) => current + 1);
    if (message) {
      setNotice(message);
    }
  }

  function clearFilters() {
    setSearch("");
    setSourceModule("all");
    setImportanceOnly(false);
    setIncludeArchived(false);
    setLimit(30);
  }

  function submitManualItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manualTitle.trim()) {
      return;
    }

    createCustomTimelineItem({
      title: manualTitle,
      description: manualDescription,
      occurredAt: fromLocalDateTimeValue(manualDate),
      sourceModule: manualModule,
      visibility: manualVisibility,
    });
    setManualTitle("");
    setManualDescription("");
    setManualDate(toLocalDateTimeValue());
    setManualModule("system");
    setManualVisibility("family");
    setIsFormOpen(false);
    refresh(text.saved);
  }

  const hasFilters =
    search || sourceModule !== "all" || importanceOnly || includeArchived;
  const isEmpty = page.total === 0;

  return (
    <section dir={direction} className="mx-auto max-w-6xl space-y-4 text-right">
      <header className="rounded-[28px] border border-[#ebe4d8] bg-white/88 p-5 shadow-[0_14px_42px_rgba(33,43,63,0.07)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-[#eadfcd] bg-[#fff8eb] px-3 py-1 text-xs font-black text-[#7a5212]">
              {text.badge}
            </span>
            <h1 className="mt-3 text-2xl font-black text-[#111827] sm:text-3xl">
              {text.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              {text.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((current) => !current)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#d8caba] bg-[#fff8eb] px-4 text-sm font-black text-[#6f4a10] shadow-[0_10px_24px_rgba(154,107,23,0.10)] transition hover:bg-white"
          >
            {isFormOpen ? text.close : `+ ${text.addUpdate}`}
          </button>
        </div>
      </header>

      {notice ? (
        <div
          className="rounded-2xl border border-[#d8caba] bg-[#fff8eb] px-4 py-3 text-sm font-bold text-[#7a5212]"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      {isFormOpen ? (
        <form
          onSubmit={submitManualItem}
          className="rounded-[24px] border border-[#ebe4d8] bg-white/94 p-4 shadow-[0_14px_38px_rgba(33,43,63,0.07)]"
        >
          <h2 className="text-base font-black text-[#111827]">
            {text.formTitle}
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black text-slate-700">
                {text.titleLabel}
              </span>
              <input
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder={text.titlePlaceholder}
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-white px-3 text-sm font-bold text-[#111827] outline-none transition focus:border-[#d8b470] focus:ring-2 focus:ring-[#d8b470]/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-700">
                {text.dateLabel}
              </span>
              <input
                type="datetime-local"
                value={manualDate}
                onChange={(event) => setManualDate(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-white px-3 text-sm font-bold text-[#111827] outline-none transition focus:border-[#d8b470] focus:ring-2 focus:ring-[#d8b470]/20"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-black text-slate-700">
                {text.descriptionLabel}
              </span>
              <textarea
                value={manualDescription}
                onChange={(event) => setManualDescription(event.target.value)}
                placeholder={text.descriptionPlaceholder}
                rows={3}
                className="mt-1 w-full rounded-2xl border border-[#e6e8ec] bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#d8b470] focus:ring-2 focus:ring-[#d8b470]/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-700">
                {text.moduleLabel}
              </span>
              <select
                value={manualModule}
                onChange={(event) =>
                  setManualModule(event.target.value as TimelineSourceModule)
                }
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-white px-3 text-sm font-bold text-[#111827] outline-none transition focus:border-[#d8b470] focus:ring-2 focus:ring-[#d8b470]/20"
              >
                {moduleFilters
                  .filter((filter): filter is TimelineSourceModule => filter !== "all")
                  .concat("system")
                  .map((filter) => (
                    <option key={filter} value={filter}>
                      {getTimelineModuleLabel(filter, activeLanguage)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black text-slate-700">
                {text.visibilityLabel}
              </span>
              <select
                value={manualVisibility}
                onChange={(event) =>
                  setManualVisibility(event.target.value as "family" | "private")
                }
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-white px-3 text-sm font-bold text-[#111827] outline-none transition focus:border-[#d8b470] focus:ring-2 focus:ring-[#d8b470]/20"
              >
                <option value="family">{text.family}</option>
                <option value="private">{text.private}</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fff8eb] px-4 text-sm font-black text-[#6f4a10] shadow-[0_10px_24px_rgba(154,107,23,0.10)]"
            >
              {text.save}
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="min-h-11 rounded-2xl border border-[#eadfcd] bg-white px-4 text-sm font-black text-slate-700"
            >
              {text.cancel}
            </button>
          </div>
        </form>
      ) : null}

      <section className="rounded-[24px] border border-[#ebe4d8] bg-white/94 p-3 shadow-[0_14px_38px_rgba(33,43,63,0.06)]">
        <div className="grid gap-2 md:grid-cols-[minmax(12rem,22rem)_1fr_auto] md:items-center">
          <label className="relative block">
            <span className="sr-only">{text.search}</span>
            <AppIcon
              name="spark"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={text.search}
              className="min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] py-2 pl-3 pr-9 text-sm font-bold text-[#111827] outline-none transition placeholder:text-slate-500 focus:border-[#d8b470] focus:ring-2 focus:ring-[#d8b470]/20"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {moduleFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSourceModule(filter)}
                className={[
                  "min-h-9 shrink-0 rounded-full px-3 text-xs font-black transition",
                  sourceModule === filter
                    ? "bg-[#111827] text-white"
                    : "bg-white text-slate-600 ring-1 ring-[#eadfcd] hover:bg-[#fff8eb]",
                ].join(" ")}
              >
                {filter === "all"
                  ? text.all
                  : getTimelineModuleLabel(filter, activeLanguage)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportanceOnly((current) => !current)}
              className={[
                "min-h-9 rounded-full px-3 text-xs font-black ring-1 transition",
                importanceOnly
                  ? "bg-[#fff8eb] text-[#6f4a10] ring-[#d8caba]"
                  : "bg-white text-slate-600 ring-[#eadfcd]",
              ].join(" ")}
            >
              {text.importantOnly}
            </button>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-9 rounded-full bg-white px-3 text-xs font-black text-slate-500 ring-1 ring-[#eadfcd]"
              >
                {text.clear}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {isEmpty ? (
        <EmptyState
          title={hasFilters ? text.noFilteredTitle : text.noItemsTitle}
          description={
            hasFilters ? text.noFilteredDescription : text.noItemsDescription
          }
          onAdd={() => setIsFormOpen(true)}
        />
      ) : (
        <section className="rounded-[28px] border border-[#ebe4d8] bg-white/94 p-4 shadow-[0_14px_38px_rgba(33,43,63,0.07)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-[#111827]">
              {text.count(page.total)}
            </h2>
            <label className="flex min-h-9 items-center gap-2 rounded-full bg-[#fffdf8] px-3 text-xs font-black text-slate-600 ring-1 ring-[#eadfcd]">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(event) => setIncludeArchived(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {activeLanguage === "en" ? "Show hidden" : "הצג מוסתרים"}
            </label>
          </div>
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.key}>
                <h3 className="mb-1.5 text-xs font-black text-slate-500">
                  {group.label}
                </h3>
                <ol className="relative">
                  {group.items.map((item) => (
                    <TimelineRow
                      key={item.id}
                      item={item}
                      language={activeLanguage}
                      onHide={(hiddenItem) => {
                        hideTimelineItem(hiddenItem.id);
                        refresh(text.hiddenNotice);
                      }}
                      onArchive={(archivedItem) => {
                        archiveTimelineItem(archivedItem.id);
                        refresh(text.archivedNotice);
                      }}
                      onRestore={(restoredItem) => {
                        restoreTimelineItem(restoredItem.id);
                        refresh(text.restoredNotice);
                      }}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
          {page.nextCursor ? (
            <button
              type="button"
              onClick={() => setLimit((current) => current + 30)}
              className="mt-4 min-h-11 w-full rounded-2xl border border-[#eadfcd] bg-[#fffdf8] px-4 text-sm font-black text-slate-700 transition hover:bg-white"
            >
              {text.loadMore}
            </button>
          ) : null}
        </section>
      )}
    </section>
  );
}
