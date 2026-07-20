"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import { getRouteVisual } from "@/lib/routeVisuals";
import {
  getNavigationItemDescription,
  getNavigationItemLabel,
  isMoreActive,
  isRouteActive,
  releaseMoreNavigation,
  releasePrimaryNavigation,
} from "@/services/releaseNavigation";

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const navRef = useRef<HTMLElement | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreActive = isMoreActive(pathname);
  const languageKey = language === "en" ? "en" : "he";

  useEffect(() => {
    const navElement = navRef.current;

    if (!navElement) {
      return;
    }

    function updateBottomNavHeight() {
      const measuredNavElement = navRef.current;

      if (!measuredNavElement) {
        return;
      }

      document.documentElement.style.setProperty(
        "--nestly-bottom-nav-height",
        `${Math.ceil(measuredNavElement.getBoundingClientRect().height + 12)}px`
      );
    }

    updateBottomNavHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateBottomNavHeight);

      return () => window.removeEventListener("resize", updateBottomNavHeight);
    }

    const resizeObserver = new ResizeObserver(updateBottomNavHeight);
    resizeObserver.observe(navElement);
    window.addEventListener("resize", updateBottomNavHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBottomNavHeight);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsMoreOpen(false), 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMoreOpen]);

  function closeMoreMenu() {
    setIsMoreOpen(false);
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeMoreMenu();
    }
  }

  function openInbox() {
    closeMoreMenu();
    window.dispatchEvent(
      new CustomEvent("nestly-open-universal-inbox", {
        detail: { source: "text", mode: "text" },
      })
    );
  }

  return (
    <>
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#111827]/22 px-3 pb-[calc(var(--nestly-bottom-nav-height)+0.75rem)] pt-20 backdrop-blur-[2px] lg:hidden"
          onClick={handleOverlayClick}
          role="presentation"
        >
          <section
            id="mobile-more-navigation"
            className="mx-auto flex max-h-[min(72vh,34rem)] w-full max-w-md flex-col overflow-hidden rounded-[26px] border border-[#e6d9c9] bg-[#fffdf8] text-[#111827] shadow-[0_24px_70px_rgba(33,43,63,0.24)]"
            aria-label={languageKey === "en" ? "More areas" : "עוד אזורים"}
            aria-modal="true"
            dir={languageKey === "he" ? "rtl" : "ltr"}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#efe5d7] px-4 py-3">
              <div className={languageKey === "he" ? "text-right" : "text-left"}>
                <p className="text-[11px] font-black text-[#8a5b16]">
                  {languageKey === "en" ? "Workspaces" : "אזורי עבודה"}
                </p>
                <h2 className="text-lg font-black text-[#111827]">
                  {languageKey === "en" ? "Everything else" : "כל מה שלא דחוף עכשיו"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeMoreMenu}
                className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-[#eadfcd] bg-white text-slate-700 transition active:scale-95"
                aria-label={languageKey === "en" ? "Close more menu" : "סגור תפריט עוד"}
              >
                <AppIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-1.5 overflow-y-auto p-2.5">
              {releaseMoreNavigation.map((item) => {
                const active = isRouteActive(pathname, item.href);
                const visual = getRouteVisual(item.href);

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={closeMoreMenu}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "flex min-h-[58px] items-center gap-3 rounded-[20px] px-3 py-2 transition active:scale-[0.99]",
                      languageKey === "he" ? "text-right" : "text-left",
                      active
                        ? "bg-[#fff8eb] shadow-[inset_0_0_0_1px_rgba(154,107,23,0.18)]"
                        : "hover:bg-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        visual.className,
                        active ? "ring-2 ring-[#d8b470]" : "",
                      ].join(" ")}
                    >
                      <AppIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#111827]">
                        {getNavigationItemLabel(item, language)}
                      </span>
                      <span className="block truncate text-[12px] font-semibold text-slate-600">
                        {getNavigationItemDescription(item, language)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <nav
        data-nestly-bottom-nav="true"
        ref={navRef}
        className="fixed inset-x-3 bottom-2.5 z-40 rounded-[24px] bg-white/76 px-1.5 py-1.5 shadow-[0_10px_26px_rgba(33,43,63,0.085)] ring-1 ring-white/70 backdrop-blur-2xl lg:hidden"
        aria-label={languageKey === "en" ? "Primary navigation" : "ניווט ראשי"}
      >
        <div className="grid grid-cols-5 gap-1">
          {releasePrimaryNavigation.map((item) => {
            if (item.kind === "action") {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={openInbox}
                  className="relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 overflow-hidden rounded-[17px] border border-transparent bg-[#111827] px-1 py-1 text-[10px] font-black text-white shadow-[0_6px_14px_rgba(17,24,39,0.13)] transition duration-200 active:scale-[0.98]"
                  aria-label={getNavigationItemLabel(item, language)}
                >
                  <AppIcon name={item.icon} className="relative h-5 w-5" />
                  <span className="relative truncate leading-none">
                    {getNavigationItemLabel(item, language)}
                  </span>
                </button>
              );
            }

            const active = isRouteActive(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 overflow-hidden rounded-[17px] px-1 py-1 text-[10px] font-black ring-offset-2 ring-offset-[#fffdf8] transition duration-200 active:scale-[0.98]",
                  active
                    ? "border border-transparent bg-[#fff8eb] text-[#111827] shadow-[0_6px_14px_rgba(126,86,28,0.09)]"
                    : "border border-transparent bg-transparent text-slate-600 hover:bg-white/72 hover:text-[#111827]",
                ].join(" ")}
              >
                <AppIcon name={item.icon} className="relative h-5 w-5" />
                <span className="relative truncate leading-none">
                  {getNavigationItemLabel(item, language)}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
            className={[
              "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-[17px] border px-1 py-1 text-[10px] font-black transition duration-200 active:scale-[0.98]",
              moreActive || isMoreOpen
                ? "border-transparent bg-[#fff8eb] text-[#111827] shadow-[0_6px_14px_rgba(126,86,28,0.09)]"
                : "border-transparent bg-transparent text-slate-600 hover:bg-white/72 hover:text-[#111827]",
            ].join(" ")}
            aria-label={languageKey === "en" ? "Open more areas" : "פתח עוד אזורים"}
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-navigation"
          >
            <AppIcon name="dashboard" className="h-5 w-5" />
            <span className="leading-none">
              {languageKey === "en" ? "More" : "עוד"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
