"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import {
  completeCommandCenterTask,
  dismissCommandCenterRecommendation,
  getCommandCenterSections,
  getTomorrowSnoozeIso,
  snoozeCommandCenterRecommendation,
} from "@/services/commandCenterService";
import type {
  CommandCenterItem,
  CommandCenterModule,
  CommandCenterPriority,
} from "@/types/commandCenter";

type CommandFilter = "all" | "mine" | "urgent" | "today" | "waiting" | "upcoming";

const priorityLabels: Record<CommandCenterPriority, string> = {
  critical: "דחוף",
  high: "חשוב",
  normal: "רגיל",
  low: "יכול לחכות",
};

const moduleIcons: Record<CommandCenterModule, AppIconName> = {
  tasks: "check",
  shopping: "shopping",
  finance: "finance",
  documents: "document",
  vehicles: "car",
  health: "health",
  family: "family",
  events: "calendar",
  knowledge: "knowledge",
  smart_inbox: "spark",
  permissions: "lock",
};

const moduleTones: Record<CommandCenterModule, string> = {
  tasks: "bg-orange-50 text-orange-700 ring-orange-100",
  shopping: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  documents: "bg-violet-50 text-violet-700 ring-violet-100",
  vehicles: "bg-blue-50 text-blue-700 ring-blue-100",
  health: "bg-rose-50 text-rose-700 ring-rose-100",
  family: "bg-purple-50 text-purple-700 ring-purple-100",
  events: "bg-pink-50 text-pink-700 ring-pink-100",
  knowledge: "bg-teal-50 text-teal-700 ring-teal-100",
  smart_inbox: "bg-amber-50 text-amber-700 ring-amber-100",
  permissions: "bg-slate-100 text-slate-700 ring-slate-200",
};

const filters: Array<{ id: CommandFilter; label: string }> = [
  { id: "all", label: "הכל" },
  { id: "mine", label: "שלי" },
  { id: "urgent", label: "דחוף" },
  { id: "today", label: "להיום" },
  { id: "waiting", label: "ממתין לאחרים" },
  { id: "upcoming", label: "מתקרב" },
];

function formatDate(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function priorityClass(priority: CommandCenterPriority) {
  if (priority === "critical") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (priority === "high") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (priority === "low") {
    return "bg-slate-50 text-slate-500 ring-slate-100";
  }

  return "bg-sky-50 text-sky-700 ring-sky-100";
}

function isMine(item: CommandCenterItem) {
  return !item.assignedToName || item.assignedToName === "הבית";
}

function filterItem(item: CommandCenterItem, filter: CommandFilter) {
  if (filter === "all") return true;
  if (filter === "mine") return isMine(item);
  if (filter === "urgent") return item.priority === "critical" || item.isOverdue;
  if (filter === "today") return item.dueAt?.slice(0, 10) === new Date().toISOString().slice(0, 10) || item.requiresReview;
  if (filter === "waiting") return item.isBlocked || item.status === "waiting";
  if (filter === "upcoming") return item.status === "upcoming" || Boolean(item.dueAt);
  return true;
}

function SourceBadge({ item }: { item: CommandCenterItem }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-[#edf0f4]">
      <AppIcon name={moduleIcons[item.sourceModule]} className="h-3.5 w-3.5" />
      {String(item.metadata.sourceLabel ?? item.sourceModule)}
    </span>
  );
}

function CommandItemRow({
  item,
  onComplete,
}: {
  item: CommandCenterItem;
  onComplete: (item: CommandCenterItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#edf0f4] py-3 last:border-b-0">
      <span
        className={[
          "grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1",
          moduleTones[item.sourceModule],
        ].join(" ")}
      >
        <AppIcon name={moduleIcons[item.sourceModule]} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="min-w-0 truncate text-sm font-black text-[#111827]">
            {item.title}
          </h3>
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-black ring-1",
              priorityClass(item.priority),
            ].join(" ")}
          >
            {priorityLabels[item.priority]}
          </span>
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {item.reason}
          {item.dueAt ? ` · ${formatDate(item.dueAt)}` : ""}
          {item.assignedToName ? ` · ${item.assignedToName}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.actionType === "complete" ? (
          <button
            type="button"
            onClick={() => onComplete(item)}
            className="hidden min-h-10 rounded-2xl bg-[#111827] px-3 text-xs font-black text-white shadow-sm sm:inline-flex sm:items-center"
          >
            סיים
          </button>
        ) : null}
        <Link
          href={item.sourceUrl}
          className="inline-flex min-h-10 items-center rounded-2xl border border-[#eadfcd] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
        >
          פתח
        </Link>
      </div>
    </div>
  );
}

function CommandSection({
  title,
  subtitle,
  items,
  onComplete,
}: {
  title: string;
  subtitle?: string;
  items: CommandCenterItem[];
  onComplete: (item: CommandCenterItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[#ebe4d8] bg-white/94 p-4 shadow-[0_14px_38px_rgba(33,43,63,0.07)]">
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#111827]">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-[#fff8eb] px-2.5 py-1 text-[11px] font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
          {items.length}
        </span>
      </div>
      <div>
        {items.map((item) => (
          <CommandItemRow key={item.id} item={item} onComplete={onComplete} />
        ))}
      </div>
    </section>
  );
}

function DailyFocusCard({
  item,
  onNotNow,
  onSnooze,
  onComplete,
}: {
  item: CommandCenterItem | null;
  onNotNow: (item: CommandCenterItem) => void;
  onSnooze: (item: CommandCenterItem) => void;
  onComplete: (item: CommandCenterItem) => void;
}) {
  if (!item) {
    return (
      <section className="rounded-[28px] border border-[#ebe4d8] bg-gradient-to-l from-[#fff8eb] via-white to-[#eef7ff] p-5 shadow-[0_18px_55px_rgba(33,43,63,0.10)]">
        <span className="inline-flex rounded-full border border-[#eadfcd] bg-white/80 px-3 py-1 text-xs font-black text-[#7a5212]">
          מצב רגוע
        </span>
        <h2 className="mt-3 text-2xl font-black text-[#111827]">
          הכל מסודר כרגע
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          אין משהו שדורש טיפול עכשיו. נמשיך לעקוב אחר המשימות, המסמכים
          והתזכורות.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/tasks"
            className="min-h-11 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-black text-white"
          >
            הוסף משימה
          </Link>
          <Link
            href="/"
            className="min-h-11 rounded-2xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-black text-slate-700"
          >
            חזרה לבית
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e6d9c9] bg-gradient-to-l from-[#fff8eb] via-white to-[#eef7ff] p-5 shadow-[0_20px_60px_rgba(33,43,63,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-[#eadfcd] bg-white/80 px-3 py-1 text-xs font-black text-[#7a5212]">
            הדבר הבא שכדאי לטפל בו
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight text-[#111827]">
            {item.title}
          </h2>
        </div>
        <span
          className={[
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
            moduleTones[item.sourceModule],
          ].join(" ")}
        >
          <AppIcon name={moduleIcons[item.sourceModule]} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {item.reason}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceBadge item={item} />
        {item.dueAt ? (
          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-[#edf0f4]">
            {formatDate(item.dueAt)}
          </span>
        ) : null}
        {item.assignedToName ? (
          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-[#edf0f4]">
            {item.assignedToName}
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {item.actionType === "complete" ? (
          <button
            type="button"
            onClick={() => onComplete(item)}
            className="min-h-12 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(17,24,39,0.18)]"
          >
            {item.primaryActionLabel}
          </button>
        ) : (
          <Link
            href={item.sourceUrl}
            className="inline-flex min-h-12 items-center rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(17,24,39,0.18)]"
          >
            {item.primaryActionLabel}
          </Link>
        )}
        <button
          type="button"
          onClick={() => onSnooze(item)}
          className="min-h-12 rounded-2xl border border-[#eadfcd] bg-white px-4 text-sm font-black text-slate-700"
        >
          דחה למחר
        </button>
        <button
          type="button"
          onClick={() => onNotNow(item)}
          className="min-h-12 rounded-2xl px-4 text-sm font-black text-slate-500 hover:bg-white/70"
        >
          לא עכשיו
        </button>
      </div>
    </section>
  );
}

export default function CommandCenterPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState<CommandFilter>("all");
  const [notice, setNotice] = useState("");
  const sections = useMemo(() => {
    void refreshKey;
    return getCommandCenterSections();
  }, [refreshKey]);
  const filteredItems = useMemo(
    () => sections.all.filter((item) => filterItem(item, activeFilter)),
    [activeFilter, sections.all]
  );

  function refresh(message?: string) {
    setRefreshKey((current) => current + 1);
    if (message) {
      setNotice(message);
    }
  }

  function handleNotNow(item: CommandCenterItem) {
    dismissCommandCenterRecommendation(item);
    refresh("הפריט הוסר ממרכז המשפחה כרגע. הרשומה המקורית נשארה במקומה.");
  }

  function handleSnooze(item: CommandCenterItem) {
    snoozeCommandCenterRecommendation(item, getTomorrowSnoozeIso());
    refresh("דחינו למחר. אם הדחיפות תעלה, הפריט יוכל לחזור מוקדם יותר.");
  }

  function handleComplete(item: CommandCenterItem) {
    if (completeCommandCenterTask(item)) {
      refresh("המשימה סומנה כהושלמה.");
      return;
    }

    setNotice("אי אפשר להשלים את הפריט הזה מכאן. פתח את המקור להמשך טיפול.");
  }

  const hasAnySection =
    sections.urgent.length > 0 ||
    sections.today.length > 0 ||
    sections.waiting.length > 0 ||
    sections.upcoming.length > 0 ||
    sections.recentlyCompleted.length > 0;

  return (
    <section dir="rtl" className="mx-auto max-w-6xl space-y-4 text-right">
      <header className="rounded-[28px] border border-[#ebe4d8] bg-white/88 p-5 shadow-[0_14px_42px_rgba(33,43,63,0.07)]">
        <span className="inline-flex rounded-full border border-[#eadfcd] bg-[#fff8eb] px-3 py-1 text-xs font-black text-[#7a5212]">
          מרכז המשפחה
        </span>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#111827] sm:text-3xl">
              מה חשוב עכשיו
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              כל מה שדורש תשומת לב במקום אחד, בלי להציף אתכם בכל המידע שבמערכת.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#eadfcd] bg-[#fffdf8] px-4 text-sm font-black text-slate-700"
          >
            חזרה לבית
          </Link>
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

      <DailyFocusCard
        item={sections.dailyFocus}
        onNotNow={handleNotNow}
        onSnooze={handleSnooze}
        onComplete={handleComplete}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={[
              "min-h-9 shrink-0 rounded-full px-3 text-xs font-black transition",
              activeFilter === filter.id
                ? "bg-[#111827] text-white"
                : "bg-white text-slate-600 ring-1 ring-[#eadfcd]",
            ].join(" ")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {activeFilter !== "all" ? (
        <CommandSection
          title="תוצאות הסינון"
          subtitle="רק הפריטים שמתאימים לבחירה הנוכחית"
          items={filteredItems.slice(0, 8)}
          onComplete={handleComplete}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            <CommandSection
              title="דורש טיפול"
              subtitle="רק מה שבאמת דחוף או עבר תאריך"
              items={sections.urgent}
              onComplete={handleComplete}
            />
            <CommandSection
              title="להיום"
              subtitle="פעולות שכדאי לקדם היום"
              items={sections.today}
              onComplete={handleComplete}
            />
          </div>
          <div className="space-y-4">
            <CommandSection
              title="ממתין לאחרים"
              subtitle="דברים שלא בהכרח דורשים פעולה שלך"
              items={sections.waiting}
              onComplete={handleComplete}
            />
            <CommandSection
              title="מתקרב"
              subtitle="מה שכדאי לראות לפני שזה הופך לדחוף"
              items={sections.upcoming}
              onComplete={handleComplete}
            />
            <CommandSection
              title="הושלם לאחרונה"
              subtitle="קצת שקט: דברים שכבר נסגרו"
              items={sections.recentlyCompleted}
              onComplete={handleComplete}
            />
          </div>
        </div>
      )}

      {!hasAnySection && activeFilter === "all" ? (
        <section className="rounded-[28px] border border-dashed border-[#d8caba] bg-[#fffdf8] p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-white text-[#8a5b16] shadow-sm ring-1 ring-[#eadfcd]">
            <AppIcon name="check" className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-black text-[#111827]">
            הכל מסודר כרגע
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
            אין משהו שדורש טיפול עכשיו. נמשיך לעקוב ונציג כאן את הדבר הבא
            שיצטרך תשומת לב.
          </p>
        </section>
      ) : null}
    </section>
  );
}
