"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useLanguage } from "@/i18n/useLanguage";
import type { CommandPaletteCommand } from "@/types/commands";
import type { AppRoute } from "@/types/navigation";
import {
  getGlobalSearchResults,
  type GlobalSearchResult,
} from "@/services/globalSearch";
import { searchCommandPaletteCommands } from "@/services/commandPaletteService";
import {
  clearRecentSearches,
  getRecentSearches,
  saveRecentSearch,
} from "@/services/searchHistoryService";
import { trackTelemetryEvent } from "@/services/telemetry";

type PaletteItem =
  | { kind: "command"; command: CommandPaletteCommand }
  | { kind: "result"; result: GlobalSearchResult }
  | { kind: "recent"; query: string }
  | { kind: "favorite"; id: string; route: AppRoute; title: string; description: string }
  | { kind: "recentRecord"; id: string; route: AppRoute; title: string; description: string }
  | { kind: "create"; route: AppRoute; title: string; description: string; icon: AppIconName };

type PaletteGroup = {
  id: string;
  label: string;
  items: PaletteItem[];
};

const copy = {
  he: {
    title: "חיפוש ופעולות",
    placeholder: "מה תרצה למצוא או לעשות?",
    hint: "Ctrl K",
    emptyTitle: "מה תרצה לעשות?",
    quickActions: "פעולות מהירות",
    records: "תוצאות",
    recent: "חיפושים אחרונים",
    create: "צור מתוך החיפוש",
    modules: "אזורים",
    noResults: "לא מצאנו תוצאה מתאימה",
    noResultsHelp: "אפשר לפתוח אזור מתאים או ליצור פריט חדש מתוך החיפוש.",
    clearAll: "נקה הכל",
    close: "סגור חיפוש",
    resultCount: (count: number) => `${count} תוצאות זמינות`,
  },
  en: {
    title: "Search and commands",
    placeholder: "What do you want to find or do?",
    hint: "Ctrl K",
    emptyTitle: "What do you want to do?",
    quickActions: "Quick actions",
    records: "Results",
    recent: "Recent searches",
    create: "Create from search",
    modules: "Areas",
    noResults: "No matching result found",
    noResultsHelp: "Open a relevant area or create a new item from this search.",
    clearAll: "Clear all",
    close: "Close search",
    resultCount: (count: number) => `${count} results available`,
  },
};

const moduleIcons: Record<string, AppIconName> = {
  משימות: "check",
  Tasks: "check",
  קניות: "shopping",
  Shopping: "shopping",
  כספים: "finance",
  Finance: "finance",
  מסמכים: "document",
  Documents: "document",
  רכבים: "car",
  Vehicles: "car",
  משפחה: "family",
  Family: "family",
  בריאות: "health",
  Health: "health",
  "אירועי משפחה": "calendar",
  "Family Events": "calendar",
  "מידע משפחתי": "knowledge",
  "Family Knowledge": "knowledge",
  "ציר הזמן": "timeline",
  Timeline: "timeline",
  "מרכז המשפחה": "dashboard",
  "Command Center": "dashboard",
};

function languageKey(language: string) {
  return language === "he" || language === "yi" ? "he" : "en";
}

function getModuleIcon(module: string): AppIconName {
  return moduleIcons[module] ?? "spark";
}

function groupResults(results: GlobalSearchResult[], label: string): PaletteGroup[] {
  const grouped = new Map<string, GlobalSearchResult[]>();

  results.slice(0, 24).forEach((result) => {
    grouped.set(result.module, [...(grouped.get(result.module) ?? []), result]);
  });

  return Array.from(grouped.entries()).map(([module, moduleResults]) => ({
    id: `records-${module}`,
    label: module || label,
    items: moduleResults.slice(0, 4).map((result) => ({
      kind: "result",
      result,
    })),
  }));
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return <>{text}</>;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = cleanQuery.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + cleanQuery.length);
  const after = text.slice(matchIndex + cleanQuery.length);

  return (
    <>
      {before}
      <mark className="rounded-md bg-[#fff1c2] px-1 text-inherit">
        {match}
      </mark>
      {after}
    </>
  );
}

function buildCreateActions(query: string, language: string): PaletteItem[] {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return [];
  }

  const isHebrew = languageKey(language) === "he";

  return [
    {
      kind: "create",
      route: "/tasks",
      icon: "check",
      title: isHebrew ? "צור משימה חדשה" : "Create a new task",
      description: isHebrew ? `מתוך: ${cleanQuery}` : `From: ${cleanQuery}`,
    },
    {
      kind: "create",
      route: "/shopping",
      icon: "shopping",
      title: isHebrew ? "צור פריט קניות" : "Create shopping item",
      description: isHebrew ? `מתוך: ${cleanQuery}` : `From: ${cleanQuery}`,
    },
    {
      kind: "create",
      route: "/knowledge",
      icon: "knowledge",
      title: isHebrew ? "הוסף כמידע משפחתי" : "Add as family knowledge",
      description: isHebrew ? "שמור כדי שהבית יזכור" : "Save so the home remembers",
    },
  ];
}

function itemKey(item: PaletteItem) {
  if (item.kind === "command") return `command-${item.command.id}`;
  if (item.kind === "result") return `result-${item.result.id}`;
  if (item.kind === "recent") return `recent-${item.query}`;
  if (item.kind === "favorite") return `favorite-${item.id}`;
  if (item.kind === "recentRecord") return `recent-record-${item.id}`;
  return `create-${item.route}-${item.title}`;
}

export default function CommandPalette() {
  const router = useRouter();
  const { language, direction } = useLanguage();
  const personalization = usePersonalization();
  const text = copy[languageKey(language)];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(
    () => searchCommandPaletteCommands(query, language),
    [language, query]
  );
  const recordResults = useMemo(
    () => (query.trim() ? getGlobalSearchResults(query, language) : []),
    [language, query]
  );

  const groups = useMemo<PaletteGroup[]>(() => {
    const hasQuery = query.trim().length > 0;
    const nextGroups: PaletteGroup[] = [
      {
        id: "commands",
        label: text.quickActions,
        items: commands.map((command) => ({ kind: "command", command })),
      },
    ];

    if (!hasQuery && recentSearches.length > 0) {
      nextGroups.push({
        id: "recent",
        label: text.recent,
        items: recentSearches.map((recentQuery) => ({
          kind: "recent",
          query: recentQuery,
        })),
      });
    }

    if (!hasQuery && personalization.favorites.length > 0) {
      nextGroups.push({
        id: "favorites",
        label: languageKey(language) === "he" ? "מועדפים" : "Favorites",
        items: personalization.favorites.slice(0, 5).map((favorite) => ({
          kind: "favorite",
          id: favorite.id,
          route: favorite.route,
          title: favorite.title,
          description:
            languageKey(language) === "he"
              ? "פריט שסימנת כמועדף"
              : "Pinned favorite",
        })),
      });
    }

    if (!hasQuery && personalization.recentRecords.length > 0) {
      nextGroups.push({
        id: "recent-records",
        label: languageKey(language) === "he" ? "נפתחו לאחרונה" : "Recently opened",
        items: personalization.recentRecords.slice(0, 5).map((record) => ({
          kind: "recentRecord",
          id: record.id,
          route: record.route,
          title: record.title,
          description:
            languageKey(language) === "he"
              ? "המשך מהמקום שבו היית"
              : "Continue where you left off",
        })),
      });
    }

    if (hasQuery) {
      nextGroups.push(...groupResults(recordResults, text.records));
    }

    if (hasQuery && recordResults.length === 0) {
      nextGroups.push({
        id: "create",
        label: text.create,
        items: buildCreateActions(query, language),
      });
    }

    return nextGroups.filter((group) => group.items.length > 0);
  }, [commands, language, personalization, query, recentSearches, recordResults, text]);

  const flatItems = groups.flatMap((group) => group.items);

  function openPalette(initialQuery = "") {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    setQuery(initialQuery);
    setActiveIndex(0);
    setRecentSearches(getRecentSearches());
    setIsOpen(true);
    trackTelemetryEvent({
      name: "palette_opened",
      module: "app",
      properties: { source: "shortcut_or_event" },
    });
  }

  function closePalette() {
    setIsOpen(false);
    setActiveIndex(0);
    window.setTimeout(() => previouslyFocusedRef.current?.focus(), 0);
  }

  function runCommand(command: CommandPaletteCommand) {
    if (query.trim()) {
      saveRecentSearch(query);
    }

    trackTelemetryEvent({
      name: "command_executed",
      module: "app",
      properties: { commandId: command.id, category: command.category },
    });

    closePalette();

    if (command.eventName) {
      window.dispatchEvent(
        new CustomEvent(command.eventName, { detail: command.eventDetail })
      );
      return;
    }

    if (command.route) {
      router.push(command.route);
    }
  }

  function openResult(result: GlobalSearchResult) {
    if (query.trim()) {
      saveRecentSearch(query);
    }

    trackTelemetryEvent({
      name: "result_opened",
      module: "app",
      properties: { module: result.module },
    });
    closePalette();
    router.push(result.href);
  }

  function executeItem(item: PaletteItem) {
    if (item.kind === "command") {
      runCommand(item.command);
      return;
    }

    if (item.kind === "result") {
      openResult(item.result);
      return;
    }

    if (item.kind === "recent") {
      setQuery(item.query);
      setActiveIndex(0);
      return;
    }

    if (item.kind === "favorite" || item.kind === "recentRecord") {
      trackTelemetryEvent({
        name: "result_opened",
        module: "app",
        properties: { module: item.kind, route: item.route },
      });
      closePalette();
      router.push(item.route);
      return;
    }

    saveRecentSearch(query);
    trackTelemetryEvent({
      name: "create_from_search",
      module: "app",
      properties: { route: item.route },
    });
    closePalette();
    router.push(item.route);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, Math.max(flatItems.length - 1, 0))
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter" && flatItems[activeIndex]) {
      event.preventDefault();
      executeItem(flatItems[activeIndex]);
    }
  }

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openPalette();
        return;
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closePalette();
      }

      if (isTyping) {
        return;
      }
    }

    function handleOpenEvent(event: Event) {
      const customEvent = event as CustomEvent<{ query?: string }>;
      openPalette(customEvent.detail?.query ?? "");
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("nestly-open-command-palette", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("nestly-open-command-palette", handleOpenEvent);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 30);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      trackTelemetryEvent({
        name: flatItems.length > 0 ? "search_performed" : "no_results",
        module: "app",
        properties: {
          hasResults: flatItems.length > 0,
          queryLength: query.trim().length,
        },
      });
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [flatItems.length, isOpen, query]);

  if (!isOpen) {
    return null;
  }

  const hasAnyResult = flatItems.length > 0;

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-950/38 px-3 py-4 backdrop-blur-sm sm:grid sm:place-items-start sm:px-6 sm:py-16"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePalette();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        dir={direction}
        className="mx-auto flex max-h-[min(88vh,44rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/96 text-[#111827] shadow-[0_30px_100px_rgba(15,23,42,0.28)] backdrop-blur-xl"
      >
        <div className="border-b border-[#ece7df] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className={direction === "rtl" ? "text-right" : "text-left"}>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a5b16]">
                {text.hint}
              </p>
              <h2 id="command-palette-title" className="text-lg font-black">
                {text.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={closePalette}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-[#eadfcd] bg-white text-slate-700 transition hover:bg-[#fff8eb]"
              aria-label={text.close}
            >
              <AppIcon name="close" className="h-5 w-5" />
            </button>
          </div>

          <label className="sr-only" htmlFor="command-palette-input">
            {text.placeholder}
          </label>
          <input
            ref={inputRef}
            id="command-palette-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={text.placeholder}
            className={[
              "h-12 w-full rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-4 text-base font-bold text-[#111827] outline-none placeholder:text-slate-500 focus:border-[#8aa3c2] focus:bg-white focus:ring-4 focus:ring-[#dbeafe]",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
            aria-describedby="command-palette-count"
          />
          <p id="command-palette-count" className="sr-only" aria-live="polite">
            {text.resultCount(flatItems.length)}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {!query.trim() && (
            <p className="mb-3 text-sm font-black text-slate-700">
              {text.emptyTitle}
            </p>
          )}

          {hasAnyResult ? (
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-500">
                      {group.label}
                    </h3>
                    {group.id === "recent" && (
                      <button
                        type="button"
                        onClick={() => {
                          clearRecentSearches();
                          setRecentSearches([]);
                        }}
                        className="rounded-full px-2 py-1 text-[11px] font-black text-slate-500 hover:bg-[#fff8eb]"
                      >
                        {text.clearAll}
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const index = flatItems.findIndex(
                        (flatItem) => itemKey(flatItem) === itemKey(item)
                      );
                      const isActive = index === activeIndex;
                      const icon =
                        item.kind === "command"
                          ? item.command.icon
                          : item.kind === "result"
                            ? getModuleIcon(item.result.module)
                            : item.kind === "create"
                              ? item.icon
                              : item.kind === "recentRecord"
                                ? "dashboard"
                              : "spark";
                      const title =
                        item.kind === "command"
                          ? item.command.label
                          : item.kind === "result"
                            ? item.result.title
                            : item.kind === "create"
                              ? item.title
                              : item.kind === "favorite" || item.kind === "recentRecord"
                                ? item.title
                              : item.query;
                      const description =
                        item.kind === "command"
                          ? item.command.description
                          : item.kind === "result"
                            ? `${item.result.module} · ${item.result.description}`
                            : item.kind === "create"
                              ? item.description
                              : "";

                      return (
                        <button
                          key={itemKey(item)}
                          type="button"
                          onClick={() => executeItem(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={[
                            "flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition",
                            isActive ? "bg-[#fff8eb] shadow-sm" : "hover:bg-[#fafafb]",
                          ].join(" ")}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-[#7a5212] ring-1 ring-[#eadfcd]">
                            <AppIcon name={icon} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-black">
                              <HighlightedText text={title} query={query} />
                            </span>
                            {description && (
                              <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                                <HighlightedText text={description} query={query} />
                              </span>
                            )}
                          </span>
                          {item.kind === "result" ? (
                            <span className="hidden shrink-0 rounded-full bg-[#fafafb] px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-[#edf0f4] sm:inline-flex">
                              {item.result.module}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#d8caba] bg-[#fffdf8] p-6 text-center">
              <p className="text-base font-black">{text.noResults}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {text.noResultsHelp}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
