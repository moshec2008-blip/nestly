"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { getDictionary, type CommonDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";
import { getUserProfileEventName, readUserProfile } from "@/lib/userProfile";
import {
  getGlobalSearchResults,
  type GlobalSearchResult,
} from "@/services/globalSearch";
import {
  getAppNotifications,
  type AppNotification,
} from "@/services/notifications";
import type { AppRoute } from "@/types/navigation";

type TopNavigationProps = {
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
};

const routeMeta: AppRoute[] = [
  "/",
  "/finance",
  "/tasks",
  "/handle",
  "/memory",
  "/assistant",
  "/timeline",
  "/life",
  "/health",
  "/documents",
  "/vehicles",
  "/family",
  "/knowledge",
  "/birthdays",
  "/shopping",
  "/security",
  "/permissions",
  "/settings",
];

const dateLocales: Record<string, string> = {
  he: "he-IL",
  en: "en-US",
  fr: "fr-FR",
  ru: "ru-RU",
  yi: "he-IL",
  it: "it-IT",
  es: "es-ES",
};

function getRouteMeta(pathname: string): AppRoute {
  return routeMeta.find((route) => route === pathname) ?? "/";
}

function getBreadcrumbs(pathname: string): AppRoute[] {
  const currentRoute = getRouteMeta(pathname);
  return currentRoute === "/" ? [currentRoute] : ["/", currentRoute];
}

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

// צבע ואייקון לפי מודול — בלי זה כל תוצאות החיפוש נראות זהות (ובלתי ניתנות
// להבחנה זו מזו במבט חטוף).
const searchResultVisuals: Record<
  string,
  { icon: AppIconName; className: string }
> = {
  "/": { icon: "home", className: "bg-slate-100 text-slate-700" },
  "/tasks": { icon: "check", className: "bg-amber-50 text-amber-700" },
  "/shopping": { icon: "shopping", className: "bg-sky-50 text-sky-700" },
  "/finance": { icon: "finance", className: "bg-emerald-50 text-emerald-700" },
  "/documents": { icon: "document", className: "bg-purple-50 text-purple-700" },
  "/health": { icon: "health", className: "bg-rose-50 text-rose-700" },
  "/vehicles": { icon: "car", className: "bg-blue-50 text-blue-700" },
  "/family": { icon: "family", className: "bg-violet-50 text-violet-700" },
  "/birthdays": { icon: "calendar", className: "bg-pink-50 text-pink-700" },
  "/knowledge": { icon: "knowledge", className: "bg-teal-50 text-teal-700" },
  "/timeline": { icon: "timeline", className: "bg-stone-100 text-stone-700" },
  "/life": { icon: "flag", className: "bg-indigo-50 text-indigo-700" },
  "/legacy": { icon: "book", className: "bg-orange-50 text-orange-700" },
  "/permissions": { icon: "lock", className: "bg-slate-100 text-slate-700" },
  "/settings": { icon: "settings", className: "bg-slate-100 text-slate-700" },
};

function getSearchResultVisual(href: string) {
  return (
    searchResultVisuals[href] ?? {
      icon: "search" as const,
      className: "bg-slate-100 text-slate-500",
    }
  );
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
          "h-10 w-full rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-4 text-sm font-semibold text-[#111827] shadow-sm outline-none transition placeholder:text-slate-500 focus:border-[#007aff]/55 focus:bg-white",
          direction === "rtl" ? "text-right" : "text-left",
        ].join(" ")}
      />

      {hasSearch && (
        <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl border border-[#d9dde5] bg-white/98 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result) => {
                const visual = getSearchResultVisual(result.href);

                return (
                  <Link
                    key={result.id}
                    href={result.href}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-[#f6f7f9]"
                  >
                    <span
                      className={[
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        visual.className,
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      <AppIcon name={visual.icon} className="h-4 w-4" />
                    </span>
                    <span
                      className={[
                        "min-w-0 flex-1",
                        direction === "rtl" ? "text-right" : "text-left",
                      ].join(" ")}
                    >
                      <span className="block truncate text-sm font-black text-[#111827]">
                        {result.title}
                      </span>
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-600">
                        {result.module} / {result.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-4 text-center text-sm font-semibold text-slate-600">
              {dictionary.noSearchResults}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MenuGlyph({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return <AppIcon name="close" className="h-5 w-5" />;
  }

  return (
    <span className="flex flex-col gap-1" aria-hidden="true">
      <span className="block h-0.5 w-5 rounded-full bg-current" />
      <span className="block h-0.5 w-5 rounded-full bg-current" />
      <span className="block h-0.5 w-5 rounded-full bg-current" />
    </span>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={[
        "relative shrink-0 overflow-hidden rounded-2xl",
        compact ? "h-6 w-6 rounded-xl" : "h-9 w-9",
      ].join(" ")}
      aria-hidden="true"
    >
      <Image
        src="/nestly-logo.png"
        alt=""
        width={96}
        height={96}
        className="h-full w-full object-contain drop-shadow-[0_3px_8px_rgba(33,43,63,0.12)]"
      />
    </span>
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
  const { data: session, status } = useSession();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const headerRef = useRef<HTMLElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const currentRoute = getRouteMeta(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const searchResults = useMemo(
    () =>
      searchValue.trim() ? getGlobalSearchResults(searchValue, language) : [],
    [language, searchValue]
  );
  const accountLabel =
    status === "authenticated"
      ? session?.user?.name || session?.user?.email || (language === "en" ? "Connected" : "מחובר")
      : language === "en"
        ? "Basic mode"
        : "מצב בסיסי";

  const accountDisplayLabel =
    status === "authenticated"
      ? displayName || accountLabel
      : language === "en"
        ? "Saved on device"
        : "שמירה במכשיר";

  useEffect(() => {
    const accountKey =
      session?.user?.email || session?.user?.id || session?.user?.name || "";

    function syncDisplayName() {
      if (!accountKey || status !== "authenticated") {
        setDisplayName(null);
        return;
      }

      setDisplayName(readUserProfile(accountKey)?.displayName || null);
    }

    syncDisplayName();
    window.addEventListener(getUserProfileEventName(), syncDisplayName);

    return () =>
      window.removeEventListener(getUserProfileEventName(), syncDisplayName);
  }, [session?.user?.email, session?.user?.id, session?.user?.name, status]);

  useEffect(() => {
    const headerElement = headerRef.current;

    if (!headerElement) {
      return;
    }

    function updateHeaderHeight() {
      const measuredHeaderElement = headerRef.current;

      if (!measuredHeaderElement) {
        return;
      }

      document.documentElement.style.setProperty(
        "--nestly-header-height",
        `${Math.ceil(measuredHeaderElement.getBoundingClientRect().height)}px`
      );
    }

    updateHeaderHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeaderHeight);

      return () => window.removeEventListener("resize", updateHeaderHeight);
    }

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(headerElement);
    window.addEventListener("resize", updateHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setNotifications(getAppNotifications());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  function handleNavigate() {
    setSearchValue("");
    setIsNotificationsOpen(false);
    onCloseMobileMenu();
  }

  function handleLogoHomeClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    handleNavigate();
    window.location.assign("/");
  }

  function openCommandPalette() {
    window.dispatchEvent(new CustomEvent("nestly-open-command-palette"));
    setSearchValue("");
    setIsNotificationsOpen(false);
    onCloseMobileMenu();
  }

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 border-b border-[#e6d9c9] bg-[#fffdf8]/92 text-[#111827] shadow-[0_12px_32px_rgba(33,43,63,0.075)] backdrop-blur-2xl"
    >
      <div className="mx-auto w-full max-w-[1520px] px-3 sm:px-5">
        <div className="flex min-h-14 items-center justify-between gap-3 py-1.5 lg:hidden">
          {isMobileMenuOpen ? (
            <span className="h-11 w-[82px] shrink-0" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-3 text-sm font-black text-[#111827] shadow-[0_10px_22px_rgba(33,43,63,0.08)] transition hover:border-[#d8b470] hover:bg-white"
              aria-label={dictionary.openMenu}
              aria-expanded={isMobileMenuOpen}
            >
              <MenuGlyph isOpen={isMobileMenuOpen} />
              <span className="hidden min-[430px]:inline">
                {dictionary.openMenu}
              </span>
            </button>
          )}

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-black text-slate-500">
              {brand.productName}
            </p>
            <h1 className="truncate text-base font-black text-[#111827]">
              {getRouteLabel(currentRoute, dictionary)}
            </h1>
          </div>

          <Link
            href="/"
            onClick={handleLogoHomeClick}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl p-1.5 transition hover:bg-[#fff8eb]/70"
            aria-label={brand.productName}
          >
            <BrandMark />
          </Link>
        </div>

        <div className="hidden min-h-16 items-center gap-2.5 py-2 lg:flex lg:min-h-14 lg:py-1.5">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d8caba] bg-[#fffdf8] text-[#111827] shadow-sm transition hover:bg-white lg:hidden"
            aria-label={dictionary.openMenu}
            aria-expanded={isMobileMenuOpen}
          >
            <MenuGlyph isOpen={isMobileMenuOpen} />
          </button>

          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-[#e6d9c9] bg-white text-sm font-black text-slate-700 shadow-sm transition hover:bg-[#fff8eb] lg:inline-flex"
            aria-label={
              isSidebarCollapsed
                ? dictionary.expandSidebar
                : dictionary.collapseSidebar
            }
          >
            <AppIcon
              name={isSidebarCollapsed ? "chevron-right" : "chevron-left"}
              className="h-4 w-4"
            />
          </button>

          <div
            className={[
              "min-w-0 flex-1",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <div
              className={[
                "hidden flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-600 lg:flex",
                direction === "rtl" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              {breadcrumbs.map((route, index) => (
                <span key={route} className="flex items-center gap-2">
                  {index > 0 && <span className="text-slate-400">/</span>}
                  <Link
                    href={route}
                    className="transition hover:text-[#111827]"
                    onClick={handleNavigate}
                  >
                    {getRouteLabel(route, dictionary)}
                  </Link>
                </span>
              ))}
            </div>

            <div
              className={[
                "flex min-w-0 items-center gap-2 lg:mt-0.5",
                direction === "rtl" ? "justify-end" : "justify-start",
              ].join(" ")}
            >
              <Link
                href="/"
                onClick={handleLogoHomeClick}
                className="flex h-11 shrink-0 items-center gap-2 rounded-2xl px-1.5 text-sm font-black text-[#111827] transition hover:bg-[#fff8eb] lg:h-9 lg:border lg:border-[#eadfcd]/70 lg:bg-white/62 lg:px-3 lg:text-xs lg:shadow-[0_8px_18px_rgba(33,43,63,0.045)]"
                aria-label={`${brand.productName} - ${brand.workspaceName}`}
              >
                <span
                  className="grid h-8 w-8 place-items-center lg:h-5 lg:w-5"
                  aria-hidden="true"
                >
                  <BrandMark compact />
                </span>
                <span>{brand.productName}</span>
                <span className="hidden text-xs font-bold text-slate-500 lg:inline">
                  {brand.workspaceName}
                </span>
              </Link>

              <h1 className="min-w-0 truncate text-base font-black text-[#111827] sm:text-lg md:text-xl">
                {getRouteLabel(currentRoute, dictionary)}
              </h1>
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

          <button
            type="button"
            onClick={openCommandPalette}
            className="hidden h-10 shrink-0 items-center gap-2 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-3 text-xs font-black text-[#111827] shadow-sm transition hover:bg-white md:inline-flex"
            aria-label={language === "en" ? "Open search and commands" : "פתח חיפוש ופעולות"}
          >
            <AppIcon name="spark" className="h-4.5 w-4.5 text-[#7a5212]" />
            <span className="hidden xl:inline">
              {language === "en" ? "Search and actions" : "חיפוש ופעולות"}
            </span>
            <kbd className="rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-500 ring-1 ring-[#eadfcd]">
              Ctrl K
            </kbd>
          </button>

          <div className="hidden items-center gap-2 xl:flex">
            <span className="rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 py-2 text-[11px] font-bold text-slate-700 shadow-sm">
              {getLocalizedDate(language)}
            </span>

            <LanguageSwitcher />

            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() =>
                  setIsNotificationsOpen((currentValue) => !currentValue)
                }
                className="relative h-10 w-10 rounded-2xl border border-[#d9dde5] bg-[#fafafb] text-base font-black text-slate-800 shadow-sm transition hover:bg-white"
                aria-label={dictionary.notifications}
              >
                <span className="grid h-full w-full place-items-center">
                  <AppIcon name="bell" className="h-5 w-5" />
                </span>
                {notifications.length > 0 && (
                  <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#b86f68] px-1 text-[10px] font-black text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className={[
                    "absolute left-0 top-12 z-50 w-80 rounded-2xl border border-[#d9dde5] bg-white/98 p-3 shadow-[0_22px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl",
                    direction === "rtl" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  <p className="mb-3 text-sm font-black text-[#111827]">
                    {dictionary.notifications}
                  </p>
                  {notifications.length > 0 ? (
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.href}
                          onClick={handleNavigate}
                          className="flex gap-3 rounded-xl p-3 transition hover:bg-[#f6f7f9]"
                        >
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full ${getNotificationToneClass(
                              notification.tone
                            )}`}
                          />
                          <span>
                            <span className="block text-sm font-black text-[#111827]">
                              {notification.title}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-600">
                              {notification.description}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-[#fafafb] p-4 text-sm font-semibold text-slate-600">
                      {dictionary.noNotifications}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/security"
              className="flex h-10 max-w-36 items-center justify-center truncate rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-3 text-xs font-black text-[#111827] shadow-sm transition hover:bg-white"
              aria-label={accountDisplayLabel}
              onClick={handleNavigate}
            >
              {accountDisplayLabel}
            </Link>

            <Link
              href="/settings"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d9dde5] bg-[#fafafb] text-slate-800 shadow-sm transition hover:bg-white"
              aria-label={dictionary.nav.settings}
              onClick={handleNavigate}
            >
              <AppIcon name="settings" className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {isMobileMenuOpen && (
          <span className="sr-only">{dictionary.closeMenu}</span>
        )}
      </div>
    </header>
  );
}
