"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";
import { getRouteVisual } from "@/lib/routeVisuals";
import {
  getNavigationItemDescription,
  getNavigationItemLabel,
  isMoreActive,
  isRouteActive,
  releaseMoreNavigation,
  releasePrimaryNavigation,
} from "@/services/releaseNavigation";
import type {
  ReleaseNavigationActionItem,
  ReleaseNavigationRouteItem,
} from "@/services/releaseNavigation";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onNavigate: () => void;
};

function openInbox(item: ReleaseNavigationActionItem) {
  window.dispatchEvent(
    new CustomEvent(item.eventName, { detail: item.eventDetail })
  );
}

function RouteLink({
  item,
  isCollapsed,
  isMobileOpen,
  onNavigate,
}: {
  item: ReleaseNavigationRouteItem;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const active = isRouteActive(pathname, item.href);
  const showText = !isCollapsed || isMobileOpen;
  const visual = getRouteVisual(item.href);

  return (
    <Link
      href={item.href}
      title={!showText ? getNavigationItemLabel(item, language) : undefined}
      aria-current={active ? "page" : undefined}
      onClick={isMobileOpen ? onNavigate : undefined}
      className={[
        "group flex min-h-[46px] items-center gap-2 rounded-2xl border px-2 py-1.5 text-sm font-bold transition-all duration-200",
        showText ? "justify-start" : "justify-center",
        active
          ? "border-[#eadfcd] bg-[#fff8eb] text-[#111827] shadow-[0_10px_24px_rgba(126,86,28,0.08)]"
          : "border-transparent bg-transparent text-slate-700 hover:bg-white/82 hover:text-[#111827]",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl shadow-[0_6px_16px_rgba(15,23,42,0.045)]",
          // צבע לפי מודול תמיד קיים; העמוד הפעיל מקבל גם טבעת מודגשת מעליו,
          // כדי שברור גם "איזה מודול" וגם "איפה אני עכשיו".
          visual.className,
          active ? "ring-2 ring-[#d8b470]" : "",
        ].join(" ")}
        aria-hidden="true"
      >
        <AppIcon name={item.icon} className="h-[18px] w-[18px] stroke-[2.35]" />
      </span>
      {showText && (
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-sm font-black leading-5">
            {getNavigationItemLabel(item, language)}
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold leading-4 text-slate-600">
            {getNavigationItemDescription(item, language)}
          </span>
        </span>
      )}
    </Link>
  );
}

function ActionButton({
  item,
  isCollapsed,
  isMobileOpen,
  onNavigate,
}: {
  item: ReleaseNavigationActionItem;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onNavigate: () => void;
}) {
  const { language } = useLanguage();
  const showText = !isCollapsed || isMobileOpen;

  return (
    <button
      type="button"
      onClick={() => {
        if (isMobileOpen) {
          onNavigate();
        }

        openInbox(item);
      }}
      title={!showText ? getNavigationItemLabel(item, language) : undefined}
      className={[
        "group flex min-h-[46px] w-full items-center gap-2 rounded-2xl border border-[#111827] bg-[#111827] px-2 py-1.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(17,24,39,0.14)] transition-all duration-200 active:scale-[0.98]",
        showText ? "justify-start" : "justify-center",
      ].join(" ")}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/12 text-[#f5d99f]"
        aria-hidden="true"
      >
        <AppIcon name={item.icon} className="h-[18px] w-[18px] stroke-[2.35]" />
      </span>
      {showText && (
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-sm font-black leading-5">
            {getNavigationItemLabel(item, language)}
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold leading-4 text-white/62">
            {getNavigationItemDescription(item, language)}
          </span>
        </span>
      )}
    </button>
  );
}

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { direction, language } = useLanguage();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const showExpandedContent = !isCollapsed || isMobileOpen;
  const languageKey = language === "en" ? "en" : "he";
  const moreActive = isMoreActive(pathname);
  const showMoreNavigation = isMoreOpen || moreActive;

  function handleLogoHomeRefresh() {
    onNavigate();
    window.location.assign("/");
  }

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onNavigate}
          className="fixed inset-0 z-20 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "nestly-sidebar-panel premium-scrollbar fixed right-3 z-50 w-[clamp(300px,84vw,360px)] overflow-y-auto overscroll-contain rounded-[22px] border border-white/80 bg-white/92 p-1.5 text-right shadow-[0_24px_70px_rgba(33,43,63,0.18)] backdrop-blur-xl transition-all duration-300 ease-out lg:sticky lg:right-auto lg:top-auto lg:z-10 lg:h-auto lg:shrink-0 lg:p-1.5 lg:shadow-[0_12px_30px_rgba(33,43,63,0.075)]",
          isMobileOpen ? "block" : "hidden lg:block",
          isMobileOpen
            ? "translate-x-0"
            : "translate-x-[calc(100%+1rem)]",
          isCollapsed ? "lg:w-12" : "lg:w-48",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className={[
            "mb-1 rounded-[16px] bg-white/78 p-1.5 shadow-[0_8px_20px_rgba(33,43,63,0.04)] transition-all duration-300 lg:bg-gradient-to-br lg:from-[#fffdf7] lg:to-[#f6f8fb]",
            isCollapsed
              ? "text-center"
              : direction === "rtl"
                ? "text-right"
                : "text-left",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={onNavigate}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#d9dde5] bg-white text-slate-800 shadow-sm transition active:scale-95"
              aria-label={languageKey === "en" ? "Close menu" : "סגור תפריט"}
            >
              <AppIcon name="close" className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-right">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-2xl">
                <Image
                  src="/nestly-logo.png"
                  alt=""
                  width={96}
                  height={96}
                  className="h-full w-full object-contain drop-shadow-[0_3px_8px_rgba(33,43,63,0.12)]"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-[#111827]">
                  {brand.workspaceName}
                </h2>
                <p className="truncate text-[11px] font-bold text-slate-600">
                  {languageKey === "en" ? "Nestly areas" : "אזורי Nestly"}
                </p>
              </div>
            </div>
          </div>

          <div
            className={[
              "hidden items-center gap-2 lg:flex",
              showExpandedContent ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={handleLogoHomeRefresh}
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-2xl transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#b86f68]/35"
              aria-label={`${brand.productName} - ${languageKey === "en" ? "Home" : "בית"}`}
            >
              <Image
                src="/nestly-logo.png"
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-contain drop-shadow-[0_3px_8px_rgba(33,43,63,0.12)]"
                aria-hidden="true"
              />
            </button>
            {showExpandedContent && (
              <div className="min-w-0">
                <h2 className="text-base font-black text-[#1d1d1f]">
                  {brand.productName}
                </h2>
                <p className="truncate text-[11px] font-bold text-slate-600">
                  {brand.workspaceName}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav
          className="space-y-1"
          aria-label={languageKey === "en" ? "Primary navigation" : "ניווט ראשי"}
        >
          {releasePrimaryNavigation.map((item) =>
            item.kind === "route" ? (
              <RouteLink
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onNavigate={onNavigate}
              />
            ) : (
              <ActionButton
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onNavigate={onNavigate}
              />
            )
          )}
        </nav>

        <div className="my-2 border-t border-[#eee8db]/80 pt-2">
          <button
            type="button"
            onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
            className={[
              "group flex min-h-[42px] w-full items-center gap-2 rounded-2xl border px-2 py-1.5 text-sm font-black transition-all duration-200",
              showExpandedContent ? "justify-start" : "justify-center",
              showMoreNavigation
                ? "border-[#eadfcd] bg-[#fff8eb] text-[#111827]"
                : "border-transparent bg-transparent text-slate-700 hover:bg-white/82 hover:text-[#111827]",
            ].join(" ")}
            aria-expanded={showMoreNavigation}
            aria-controls="desktop-more-navigation"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-[#7a5212] ring-1 ring-[#eadfcd]">
              <AppIcon name="dashboard" className="h-[18px] w-[18px]" />
            </span>
            {showExpandedContent && (
              <span className="min-w-0 flex-1 text-start">
                <span className="block truncate text-sm font-black">
                  {languageKey === "en" ? "More" : "עוד"}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold text-slate-600">
                  {languageKey === "en" ? "Workspaces" : "אזורי עבודה"}
                </span>
              </span>
            )}
          </button>
        </div>

        {showMoreNavigation && (
          <nav
            id="desktop-more-navigation"
            className="space-y-0.5"
            aria-label={languageKey === "en" ? "Workspaces and more" : "אזורי עבודה ועוד"}
          >
            {releaseMoreNavigation.map((item) => (
              <RouteLink
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        )}
      </aside>
    </>
  );
}
