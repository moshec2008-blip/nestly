"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import NestlyState from "@/components/ui/NestlyState";
import SectionHeader from "@/components/ui/SectionHeader";
import StatusPill from "@/components/ui/StatusPill";
import { useLanguage } from "@/i18n/useLanguage";
import {
  getMemoryState,
  markMemoryItemViewed,
} from "@/services/memoryService";
import type {
  MemoryDomain,
  MemoryGroup,
  MemoryItem,
  MemoryState,
} from "@/types/memory";

const domainClasses: Record<MemoryDomain, string> = {
  knowledge: "bg-teal-50 text-teal-700 ring-teal-100",
  documents: "bg-violet-50 text-violet-700 ring-violet-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  family: "bg-purple-50 text-purple-700 ring-purple-100",
  health: "bg-rose-50 text-rose-700 ring-rose-100",
  vehicles: "bg-blue-50 text-blue-700 ring-blue-100",
  tasks: "bg-amber-50 text-amber-700 ring-amber-100",
  shopping: "bg-sky-50 text-sky-700 ring-sky-100",
  life: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
  birthdays: "bg-pink-50 text-pink-700 ring-pink-100",
  inbox: "bg-[#fff3d8] text-[#8a5b16] ring-[#eadfcd]",
};

function MemoryItemRow({
  item,
  onOpen,
  openLabel,
}: {
  item: MemoryItem;
  onOpen: (item: MemoryItem) => void;
  openLabel: string;
}) {
  return (
    <Link
      href={item.href}
      onClick={() => onOpen(item)}
      className="group flex min-h-[76px] min-w-0 items-center gap-3 rounded-[22px] bg-white/68 px-3 py-3 text-right shadow-[0_8px_22px_rgba(33,43,63,0.04)] ring-1 ring-white/70 transition hover:bg-white active:scale-[0.99]"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${domainClasses[item.domain]}`}
      >
        <AppIcon name={item.icon} className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="line-clamp-1 text-[15px] font-black leading-5 text-[#111827]">
              {item.title}
            </span>
            <span className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
              {item.sourceLabel} · {item.meta}
            </span>
          </span>
          {item.status ? (
            <StatusPill tone="warm">
              {item.status}
            </StatusPill>
          ) : null}
        </span>
        <span className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
          {item.description}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/72 px-2.5 py-1 text-[11px] font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
          {openLabel}
          <AppIcon name="chevron-left" className="h-3 w-3" />
        </span>
      </span>
    </Link>
  );
}

function CompactMemoryItem({
  item,
  onOpen,
}: {
  item: MemoryItem;
  onOpen: (item: MemoryItem) => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={() => onOpen(item)}
      className="flex min-h-[58px] items-center gap-2.5 rounded-[19px] bg-white/54 px-3 py-2 text-right ring-1 ring-white/70 transition hover:bg-white active:scale-[0.99]"
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
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
          {item.sourceLabel} · {item.meta}
        </span>
      </span>
    </Link>
  );
}

function MemoryGroupSection({
  group,
  onOpen,
  openLabel,
}: {
  group: MemoryGroup;
  onOpen: (item: MemoryItem) => void;
  openLabel: string;
}) {
  return (
    <section className="space-y-2.5">
      <SectionHeader
        title={group.label}
        subtitle={group.description}
        meta={<StatusPill size="sm">{group.items.length}</StatusPill>}
      />
      <div className="space-y-2">
        {group.items.map((item) => (
          <MemoryItemRow
            key={item.id}
            item={item}
            onOpen={onOpen}
            openLabel={openLabel}
          />
        ))}
      </div>
    </section>
  );
}

export default function MemorySearchView() {
  const { language, direction } = useLanguage();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<MemoryState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const languageKey = language === "en" ? "en" : "he";
  const copy = useMemo(
    () =>
      languageKey === "en"
        ? {
            loading: "Opening Memory...",
            loadingDetail: "Gathering saved things from every workspace.",
            errorTitle: "Memory could not open",
            errorBody: "Try again. Your workspaces remain unchanged.",
            retry: "Try again",
            partialTitle: "Some workspaces did not load",
            partialBody: "Memory is showing everything it could read.",
            title: "Find anything at home",
            subtitle:
              "Search tasks, documents, payments, health, vehicles, family notes and saved knowledge without leaving this screen.",
            placeholder: "Search for a bill, document, person, payment...",
            results: (count: number) =>
              count === 1 ? "1 thing found" : `${count} things found`,
            emptyTitle: "Nothing matched that search",
            emptyBody:
              "Try a person, document type, payment name, category, date or place.",
            startTitle: "Start with what you remember",
            startBody:
              "A word is enough: insurance, school, water bill, car, medicine, birthday.",
            recentlyViewed: "Recently viewed",
            recentlySaved: "Recently saved",
            recentlyUpdated: "Recently updated",
            browseByArea: "Browse by area",
            clear: "Clear",
            openSource: "Open in source",
          }
        : {
            loading: "פותחים את הזיכרון...",
            title: "למצוא כל דבר בבית",
            subtitle:
              "חפשו משימות, מסמכים, תשלומים, בריאות, רכבים, משפחה ומידע שנשמר בלי לצאת מהמסך.",
            placeholder: "חפשו חשבון, מסמך, אדם, תשלום...",
            results: (count: number) =>
              count === 1 ? "נמצא דבר אחד" : `נמצאו ${count} דברים`,
            emptyTitle: "לא מצאנו התאמה לחיפוש הזה",
            emptyBody:
              "נסו שם של אדם, סוג מסמך, תשלום, קטגוריה, תאריך או מקום.",
            startTitle: "התחילו ממה שאתם זוכרים",
            startBody:
              "מילה אחת מספיקה: ביטוח, בית ספר, מים, רכב, תרופות, יום הולדת.",
            recentlyViewed: "נצפו לאחרונה",
            recentlySaved: "נשמרו לאחרונה",
            browseByArea: "לפי תחום",
            clear: "נקה",
          },
    [languageKey]
  );
  const productionCopy = useMemo(
    () =>
      languageKey === "en"
        ? {
            loadingDetail: "Gathering saved things from every workspace.",
            errorTitle: "Memory could not open",
            errorBody: "Try again. Your workspaces remain unchanged.",
            retry: "Try again",
            partialTitle: "Some workspaces did not load",
            partialBody: "Memory is showing everything it could read.",
            recentlyUpdated: "Recently updated",
            openSource: "Open in source",
          }
        : {
            loadingDetail: "אוספים דברים שמורים מכל אזורי העבודה.",
            errorTitle: "לא הצלחנו לפתוח את הזיכרון",
            errorBody: "נסו שוב. אזורי העבודה עצמם לא השתנו.",
            retry: "נסה שוב",
            partialTitle: "חלק מאזורי העבודה לא נטענו",
            partialBody: "Memory מציג את מה שהצליח לקרוא.",
            recentlyUpdated: "עודכנו לאחרונה",
            openSource: "פתח במקור",
          },
    [languageKey]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        setState(getMemoryState(query, language));
        setLoadError(false);
      } catch {
        setLoadError(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [language, query]);

  function refreshState() {
    try {
      setState(getMemoryState(query, language));
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }

  function handleOpen(item: MemoryItem) {
    markMemoryItemViewed(item.id);
    window.setTimeout(refreshState, 0);
  }

  if (loadError) {
    return (
      <section dir={direction} className="mx-auto w-full max-w-5xl px-1 text-right">
        <NestlyState
          icon="knowledge"
          tone="warning"
          title={productionCopy.errorTitle}
          description={productionCopy.errorBody}
          action={
            <Button type="button" tone="primary" size="sm" onClick={refreshState}>
              {productionCopy.retry}
            </Button>
          }
        />
      </section>
    );
  }

  if (!state) {
    return (
      <section dir={direction} className="mx-auto w-full max-w-5xl px-1 text-right">
        <div className="space-y-3">
          <div className="rounded-[24px] bg-white/62 p-4 ring-1 ring-white/70">
            <p className="text-sm font-black text-slate-500">{copy.loading}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              {productionCopy.loadingDetail}
            </p>
          </div>
          <div className="h-28 animate-pulse rounded-[24px] bg-white/50" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-16 animate-pulse rounded-[20px] bg-white/42" />
            <div className="h-16 animate-pulse rounded-[20px] bg-white/42" />
          </div>
        </div>
      </section>
    );
  }

  const hasQuery = query.trim().length > 0;
  const previewGroups = hasQuery
    ? state.groups
    : state.groups.map((group) => ({
        ...group,
        items: group.items.slice(0, 3),
      }));
  const flowCopy =
    languageKey === "en"
      ? {
          capture: "Capture new",
          captureDescription: "Not here yet? Send it into Inbox.",
          handle: "Handle open items",
          handleDescription: "See what needs attention now.",
        }
      : {
          capture: "לקלוט חדש",
          captureDescription: "לא כאן עדיין? שלחו אותו ל-Inbox.",
          handle: "לטפל בפתוחים",
          handleDescription: "ראו מה דורש תשומת לב עכשיו.",
        };

  return (
    <div
      dir={direction}
      className="mx-auto w-full max-w-5xl space-y-4 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] text-right lg:pb-0"
    >
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-bl from-[#fff8eb] via-white to-[#eef7ff] px-4 py-4 shadow-[0_10px_28px_rgba(33,43,63,0.045)]">
        <span
          className="pointer-events-none absolute inset-y-4 end-0 w-1 rounded-full bg-[#d8b470]"
          aria-hidden="true"
        />
        <div className="max-w-[42rem]">
          <h1 className="text-[27px] font-black leading-8 text-[#111827] sm:text-[32px] sm:leading-10">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-4 rounded-[22px] bg-white/78 p-2 shadow-[0_10px_24px_rgba(33,43,63,0.05)] ring-1 ring-white/80">
          <label htmlFor="memory-search" className="sr-only">
            {copy.placeholder}
          </label>
          <div className="flex min-h-12 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#fff8eb] text-[#8a5b16] ring-1 ring-[#eadfcd]">
              <AppIcon name="knowledge" className="h-4 w-4" />
            </span>
            <input
              id="memory-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.placeholder}
              className="min-w-0 flex-1 bg-transparent text-base font-black text-[#111827] outline-none placeholder:text-slate-400"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black text-slate-500 transition hover:bg-[#fff8eb] hover:text-[#111827]"
              >
                {copy.clear}
              </button>
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-xs font-black text-slate-500">
          {hasQuery ? copy.results(state.total) : copy.startBody}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-2" aria-label="Memory next steps">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("nestly-open-universal-inbox"))
          }
          className="flex min-h-[64px] min-w-0 items-center gap-2.5 rounded-[22px] bg-[#111827] px-3 py-2.5 text-right text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)] transition active:scale-[0.98]"
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
          href="/handle"
          className="flex min-h-[64px] min-w-0 items-center gap-2.5 rounded-[22px] bg-white/58 px-3 py-2.5 text-right text-[#111827] shadow-[0_6px_16px_rgba(33,43,63,0.03)] transition hover:bg-white active:scale-[0.98]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-[#fff8eb] text-[#8a5b16]">
            <AppIcon name="check" className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-black leading-4">
              {flowCopy.handle}
            </span>
            <span className="mt-0.5 block line-clamp-2 text-[10px] font-bold leading-4 text-slate-500">
              {flowCopy.handleDescription}
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
                {productionCopy.partialTitle}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold leading-5 text-slate-600">
                {productionCopy.partialBody}
              </p>
            </div>
            <Button
              type="button"
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

      {!hasQuery && state.recentlyViewed.length > 0 && (
        <section className="space-y-2.5">
          <SectionHeader title={copy.recentlyViewed} bordered={false} />
          <div className="grid gap-2 sm:grid-cols-2">
            {state.recentlyViewed.map((item) => (
              <CompactMemoryItem key={item.id} item={item} onOpen={handleOpen} />
            ))}
          </div>
        </section>
      )}

      {!hasQuery && state.recentlyUpdated.length > 0 && (
        <section className="space-y-2.5">
          <SectionHeader title={productionCopy.recentlyUpdated} bordered={false} />
          <div className="grid gap-2 sm:grid-cols-2">
            {state.recentlyUpdated.slice(0, 4).map((item) => (
              <CompactMemoryItem key={item.id} item={item} onOpen={handleOpen} />
            ))}
          </div>
        </section>
      )}

      {!hasQuery && state.recentlySaved.length > 0 && (
        <section className="space-y-2.5">
          <SectionHeader title={copy.recentlySaved} bordered={false} />
          <div className="grid gap-2 sm:grid-cols-2">
            {state.recentlySaved.slice(0, 4).map((item) => (
              <CompactMemoryItem key={item.id} item={item} onOpen={handleOpen} />
            ))}
          </div>
        </section>
      )}

      {state.total === 0 ? (
        <NestlyState
          icon="knowledge"
          tone={hasQuery ? "empty" : "calm"}
          title={hasQuery ? copy.emptyTitle : copy.startTitle}
          description={hasQuery ? copy.emptyBody : copy.startBody}
          compact
        />
      ) : (
        <section className="space-y-4">
          <SectionHeader
            title={hasQuery ? copy.results(state.total) : copy.browseByArea}
            bordered={false}
          />
          {previewGroups.map((group) => (
            <MemoryGroupSection
              key={group.domain}
              group={group}
              onOpen={handleOpen}
              openLabel={productionCopy.openSource}
            />
          ))}
        </section>
      )}
    </div>
  );
}
