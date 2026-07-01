"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getGlobalSearchResults,
  type GlobalSearchResult,
} from "@/services/globalSearch";
import { getAppNotifications } from "@/services/notifications";
import type { AppNotification } from "@/services/notifications";
import { brand } from "@/lib/branding";
import type { AppRoute } from "@/types/navigation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getDictionary, type CommonDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";

type TopNavigationProps = {
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
};

type RouteMeta = {
  href: AppRoute;
};

const routeMeta: RouteMeta[] = [
  { href: "/" },
  { href: "/finance" },
  { href: "/tasks" },
  { href: "/dashboard" },
  { href: "/health" },
  { href: "/documents" },
  { href: "/vehicles" },
  { href: "/family" },
  { href: "/birthdays" },
  { href: "/shopping" },
  { href: "/permissions" },
  { href: "/settings" },
];

function getRouteMeta(pathname: string) {
  return routeMeta.find((item) => item.href === pathname) ?? routeMeta[0];
}

function getBreadcrumbs(pathname: string) {
  const currentRoute = getRouteMeta(pathname);
  return currentRoute.href === "/" ? [currentRoute] : [routeMeta[0], currentRoute];
}

const dateLocales: Record<string, string> = {
  he: "he-IL",
  en: "en-US",
  fr: "fr-FR",
  ru: "ru-RU",
  yi: "he-IL",
  it: "it-IT",
  es: "es-ES",
};

function getLocalizedDate(language: string) {
  return new Intl.DateTimeFormat(dateLocales[language] ?? "he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function getNotificationToneClass(tone: "info" | "warning" | "danger") {
  if (tone === "danger") {
    return "bg-red-400";
  }

  if (tone === "warning") {
    return "bg-[#d8b470]";
  }

  return "bg-emerald-300";
}

type SearchBoxProps = {
  searchValue: string;
  results: GlobalSearchResult[];
  dictionary: CommonDictionary;
  direction: "rtl" | "ltr";
  onSearchChange: (value: string) => void;
  onNavigate: () => void;
};

function SearchBox({
  searchValue,
  results,
  dictionary,
  direction,
  onSearchChange,
  onNavigate,
}: SearchBoxProps) {
  const hasSearch = searchValue.trim().length > 0;

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="global-search">
        {dictionary.searchLabel}
      </label>
      <input
        id="global-search"
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={dictionary.searchPlaceholder}
        className={[
          "h-9 w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 text-sm text-[#1d1d1f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#007aff]/50 focus:bg-white",
          direction === "rtl" ? "text-right" : "text-left",
        ].join(" ")}
      />

      {hasSearch && (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl border border-[#e6e8ec] bg-white/95 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={result.href}
                  onClick={onNavigate}
                  className={[
                    "block rounded-xl px-3 py-2 transition hover:bg-white/[0.08]",
                    direction === "rtl" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  <span className="block text-sm font-black text-[#1d1d1f]">
                    {result.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {result.module} · {result.description}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-3 py-4 text-center text-sm text-slate-500">
              {dictionary.noSearchResults}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TopNavigation({
  isSidebarCollapsed,
  isMobileMenuOpen,
  onToggleSidebar,
  onToggleMobileMenu,
  onCloseMobileMenu,
}: TopNavigationProps) {
  const pathname = usePathname();
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);
  const [searchValue, setSearchValue] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const currentRoute = getRouteMeta(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const searchResults = useMemo(
    () => (searchValue.trim() ? getGlobalSearchResults(searchValue) : []),
    [searchValue]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNotifications(getAppNotifications());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function handleNavigate() {
    setSearchValue("");
    setIsNotificationsOpen(false);
    onCloseMobileMenu();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e6e8ec] bg-white/86 text-[#1d1d1f] shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-5">
        <div className="flex min-h-14 items-center gap-2.5 py-1.5">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#e6e8ec] bg-[#111827] text-lg font-black text-white shadow-sm lg:hidden"
            aria-label={dictionary.openMenu}
            aria-expanded={isMobileMenuOpen}
          >
            ☰
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden h-9 w-9 items-center justify-center rounded-2xl border border-[#e6e8ec] bg-[#fafafb] text-sm font-black text-slate-600 shadow-sm transition hover:bg-white lg:inline-flex"
            aria-label={
              isSidebarCollapsed
                ? dictionary.expandSidebar
                : dictionary.collapseSidebar
            }
          >
            {isSidebarCollapsed ? "›" : "‹"}
          </button>

          <div
            className={[
              "min-w-0 flex-1",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <div
              className={[
                "hidden flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-400 sm:flex",
                direction === "rtl" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              {breadcrumbs.map((item, index) => (
                <span key={item.href} className="flex items-center gap-2">
                  {index > 0 && <span className="text-slate-300">›</span>}
                  <Link
                    href={item.href}
                    className="transition hover:text-[#111827]"
                    onClick={handleNavigate}
                  >
                    {getRouteLabel(item.href, dictionary)}
                  </Link>
                </span>
              ))}
            </div>
            <div
              className={[
                "mt-0.5 flex flex-wrap items-center gap-2",
                direction === "rtl" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              <h1 className="truncate text-base font-black sm:text-lg md:text-xl">
                {getRouteLabel(currentRoute.href, dictionary)}
              </h1>
              <Link
                href="/"
                onClick={handleNavigate}
                className="flex items-center gap-2 rounded-2xl bg-[#111827] px-3 py-1.5 text-xs font-black text-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                aria-label={`${brand.productName} - ${brand.workspaceName}`}
              >
                <span
                  className="grid h-5 w-5 place-items-center rounded-full bg-[#f4e7c8] text-[10px] text-[#111827]"
                  aria-hidden="true"
                >
                  {brand.logoMark}
                </span>
                <span>{brand.productName}</span>
                <span className="hidden text-xs font-bold opacity-70 sm:inline">
                  {brand.workspaceName}
                </span>
              </Link>
            </div>
          </div>

          <div className="hidden min-w-52 max-w-xs flex-1 md:block">
            <SearchBox
              searchValue={searchValue}
              results={searchResults}
              dictionary={dictionary}
              direction={direction}
              onSearchChange={setSearchValue}
              onNavigate={handleNavigate}
            />
          </div>

          <div className="hidden items-center gap-2 xl:flex">
            <span className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm">
              {getLocalizedDate(language)}
            </span>

            <LanguageSwitcher />

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsNotificationsOpen((currentValue) => !currentValue)
                }
                className="relative h-9 w-9 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] text-base shadow-sm transition hover:bg-white"
                aria-label={dictionary.notifications}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#b86f68] px-1 text-[10px] font-black text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className={[
                    "absolute left-0 top-12 z-50 w-80 rounded-2xl border border-[#e6e8ec] bg-white/95 p-3 shadow-[0_22px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl",
                    direction === "rtl" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  <p className="mb-3 text-sm font-black">
                    {dictionary.notifications}
                  </p>
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.href}
                          onClick={handleNavigate}
                          className="flex gap-3 rounded-xl p-3 transition hover:bg-white/[0.08]"
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${getNotificationToneClass(
                              notification.tone
                            )}`}
                          />
                          <span>
                            <span className="block text-sm font-black">
                              {notification.title}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {notification.description}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-[#fafafb] p-4 text-sm text-slate-500">
                      {dictionary.noNotifications}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="flex h-9 items-center justify-center rounded-2xl border border-[#e6e8ec] bg-[#111827] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#1f2937]"
              aria-label="כניסה לחשבון"
              onClick={handleNavigate}
            >
              חשבון
            </Link>

            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#e6e8ec] bg-[#fafafb] text-base shadow-sm transition hover:bg-white"
              aria-label={dictionary.nav.settings}
              onClick={handleNavigate}
            >
              ⚙
            </Link>
          </div>
        </div>

        {isMobileMenuOpen && <span className="sr-only">{dictionary.openMenu}</span>}
      </div>
    </header>
  );
}
