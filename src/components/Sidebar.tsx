"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDashboardContent } from "@/i18n/dashboardContent";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";
import type { AppRoute } from "@/types/navigation";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onNavigate: () => void;
};

type SidebarLink = {
  label: string;
  href: AppRoute;
  icon: string;
  description: string;
};

const icons: Record<AppRoute, string> = {
  "/": "⌂",
  "/finance": "₪",
  "/tasks": "✓",
  "/dashboard": "⌁",
  "/health": "♥",
  "/documents": "□",
  "/vehicles": "🚗",
  "/family": "👥",
  "/birthdays": "✦",
  "/shopping": "🛒",
  "/permissions": "◈",
  "/settings": "⚙",
};

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);
  const dashboardContent = getDashboardContent(language);
  const showExpandedContent = !isCollapsed || isMobileOpen;
  const primaryLinks: SidebarLink[] = [
    {
      label: dictionary.nav.home,
      href: "/",
      icon: icons["/"],
      description: dictionary.hero.badge,
    },
    ...dashboardContent.modules.map((module) => ({
      label: getRouteLabel(module.href, dictionary),
      href: module.href,
      icon: icons[module.href],
      description: module.description,
    })),
  ];

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          onClick={onNavigate}
          className="fixed inset-0 z-20 bg-black/55 backdrop-blur-sm lg:hidden"
          aria-label={dictionary.closeMenu}
        />
      )}

      <aside
        className={[
          "premium-scrollbar fixed bottom-3 right-3 top-16 z-30 overflow-y-auto rounded-[22px] border border-[#d9dde5] bg-white p-2.5 text-right shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-300 ease-out lg:sticky lg:bottom-auto lg:right-auto lg:top-auto lg:z-10 lg:h-[calc(100vh-5rem)] lg:shrink-0 lg:p-1.5 lg:shadow-[0_14px_34px_rgba(15,23,42,0.07)]",
          isMobileOpen
            ? "w-[min(22rem,calc(100vw-1.5rem))] translate-x-0"
            : "w-[min(22rem,calc(100vw-1.5rem))] translate-x-[120%]",
          isCollapsed ? "lg:w-12" : "lg:w-36",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
            className={[
              "mb-2 rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-2.5 shadow-sm transition-all duration-300 lg:p-1.5",
              isCollapsed
                ? "text-center"
                : direction === "rtl"
                  ? "text-right"
                  : "text-left",
            ].join(" ")}
          >
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              onClick={onNavigate}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d9dde5] bg-white text-xl font-black text-slate-800 shadow-sm"
              aria-label={dictionary.closeMenu}
            >
              x
            </button>

            <div className="min-w-0 text-right">
              <h2 className="text-lg font-black text-[#111827]">
                {brand.productName}
              </h2>
              <p className="truncate text-xs font-bold text-slate-600">
                {dictionary.workspaceLabel}: {brand.workspaceName}
              </p>
            </div>
          </div>

          <div
            className={[
              "hidden items-center gap-2 lg:flex",
              showExpandedContent
                ? "justify-start"
                : "justify-center",
            ].join(" ")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-2xl bg-[#111827] text-xs font-black text-white shadow-sm">
              {showExpandedContent ? brand.logoMark : "N"}
            </span>
            {showExpandedContent && (
              <div>
                <h2 className="text-base font-black text-[#1d1d1f]">
                  {brand.productName}
                </h2>
                <p className="mt-1 inline-flex rounded-full bg-[#111827] px-2 py-0.5 text-[10px] font-bold text-white">
                  {dictionary.tagline}
                </p>
              </div>
            )}
          </div>
          {showExpandedContent && (
            <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-700">
              {dictionary.workspaceLabel}: {brand.workspaceName}
            </p>
          )}
        </div>

        <nav className="space-y-1" aria-label={dictionary.openMenu}>
          {primaryLinks.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={!showExpandedContent ? item.label : undefined}
                className={[
                  "group flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold transition-all duration-200 lg:min-h-10 lg:gap-2 lg:px-2 lg:py-1.5",
                  showExpandedContent ? "justify-start" : "justify-center",
                  isActive
                    ? "bg-[#111827] text-white shadow-[0_14px_35px_rgba(15,23,42,0.12)]"
                    : "text-slate-700 hover:-translate-y-0.5 hover:bg-[#fafafb] hover:text-[#111827]",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-base transition lg:h-7 lg:w-7 lg:rounded-xl lg:text-xs",
                    isActive
                      ? "bg-white/12 text-white"
                      : "bg-[#f2f3f5] text-slate-500 group-hover:bg-white",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {showExpandedContent && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-black leading-5 lg:text-sm lg:font-bold">
                      {item.label}
                    </span>
                    <span
                      className={[
                        "mt-0.5 line-clamp-1 text-xs leading-5 lg:hidden",
                        isActive ? "text-white/75" : "text-slate-600",
                      ].join(" ")}
                    >
                      {item.description}
                    </span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
