"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
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
  icon: AppIconName;
  description: string;
};

const icons: Record<AppRoute, AppIconName> = {
  "/": "home",
  "/finance": "finance",
  "/tasks": "check",
  "/dashboard": "dashboard",
  "/health": "health",
  "/documents": "document",
  "/vehicles": "car",
  "/family": "family",
  "/birthdays": "calendar",
  "/shopping": "shopping",
  "/permissions": "lock",
  "/settings": "settings",
};

const navigationAccents: Record<
  AppRoute,
  { dot: string; icon: string; active: string; hover: string }
> = {
  "/": {
    dot: "bg-indigo-400",
    icon: "border-indigo-200 bg-indigo-100 text-indigo-900",
    active: "bg-[#111827] text-white shadow-[0_14px_35px_rgba(17,24,39,0.18)]",
    hover: "hover:bg-indigo-50/90",
  },
  "/finance": {
    dot: "bg-emerald-400",
    icon: "border-emerald-200 bg-emerald-100 text-emerald-900",
    active: "bg-emerald-700 text-white shadow-[0_14px_35px_rgba(4,120,87,0.2)]",
    hover: "hover:bg-emerald-50/90",
  },
  "/tasks": {
    dot: "bg-orange-400",
    icon: "border-orange-200 bg-orange-100 text-orange-900",
    active: "bg-orange-600 text-white shadow-[0_14px_35px_rgba(234,88,12,0.18)]",
    hover: "hover:bg-orange-50/90",
  },
  "/dashboard": {
    dot: "bg-sky-400",
    icon: "border-sky-200 bg-sky-100 text-sky-900",
    active: "bg-sky-700 text-white shadow-[0_14px_35px_rgba(3,105,161,0.18)]",
    hover: "hover:bg-sky-50/90",
  },
  "/health": {
    dot: "bg-rose-400",
    icon: "border-rose-200 bg-rose-100 text-rose-900",
    active: "bg-rose-600 text-white shadow-[0_14px_35px_rgba(225,29,72,0.16)]",
    hover: "hover:bg-rose-50/90",
  },
  "/documents": {
    dot: "bg-violet-400",
    icon: "border-violet-200 bg-violet-100 text-violet-900",
    active: "bg-violet-700 text-white shadow-[0_14px_35px_rgba(109,40,217,0.17)]",
    hover: "hover:bg-violet-50/90",
  },
  "/vehicles": {
    dot: "bg-blue-400",
    icon: "border-blue-200 bg-blue-100 text-blue-900",
    active: "bg-blue-700 text-white shadow-[0_14px_35px_rgba(29,78,216,0.17)]",
    hover: "hover:bg-blue-50/90",
  },
  "/family": {
    dot: "bg-purple-400",
    icon: "border-purple-200 bg-purple-100 text-purple-900",
    active: "bg-purple-700 text-white shadow-[0_14px_35px_rgba(126,34,206,0.17)]",
    hover: "hover:bg-purple-50/90",
  },
  "/birthdays": {
    dot: "bg-pink-400",
    icon: "border-pink-200 bg-pink-100 text-pink-900",
    active: "bg-pink-600 text-white shadow-[0_14px_35px_rgba(219,39,119,0.16)]",
    hover: "hover:bg-pink-50/90",
  },
  "/shopping": {
    dot: "bg-cyan-400",
    icon: "border-cyan-200 bg-cyan-100 text-cyan-900",
    active: "bg-cyan-700 text-white shadow-[0_14px_35px_rgba(14,116,144,0.17)]",
    hover: "hover:bg-cyan-50/90",
  },
  "/permissions": {
    dot: "bg-amber-400",
    icon: "border-amber-200 bg-amber-100 text-amber-900",
    active: "bg-amber-600 text-white shadow-[0_14px_35px_rgba(217,119,6,0.17)]",
    hover: "hover:bg-amber-50/90",
  },
  "/settings": {
    dot: "bg-slate-400",
    icon: "border-slate-200 bg-slate-100 text-slate-900",
    active: "bg-slate-800 text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)]",
    hover: "hover:bg-slate-100/90",
  },
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
          className="fixed inset-0 z-20 bg-slate-950/34 backdrop-blur-sm lg:hidden"
          aria-label={dictionary.closeMenu}
        />
      )}

      <aside
        className={[
          "premium-scrollbar fixed bottom-3 right-3 top-16 z-30 overflow-y-auto rounded-[24px] border border-white/80 bg-white/88 p-2.5 text-right shadow-[0_24px_70px_rgba(33,43,63,0.16)] backdrop-blur-xl transition-all duration-300 ease-out lg:sticky lg:bottom-auto lg:right-auto lg:top-auto lg:z-10 lg:h-[calc(100vh-5rem)] lg:shrink-0 lg:p-1.5 lg:shadow-[0_14px_34px_rgba(33,43,63,0.08)]",
          isMobileOpen
            ? "w-[min(22rem,calc(100vw-1.5rem))] translate-x-0"
            : "w-[min(22rem,calc(100vw-1.5rem))] translate-x-[120%]",
          isCollapsed ? "lg:w-12" : "lg:w-48",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className={[
            "mb-2 rounded-[20px] border border-[#ebe4d8] bg-gradient-to-br from-[#fffdf7] to-[#f6f8fb] p-2.5 shadow-sm transition-all duration-300 lg:p-1.5",
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
              showExpandedContent ? "justify-start" : "justify-center",
            ].join(" ")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-2xl bg-[#111827] text-xs font-black text-white shadow-[0_10px_24px_rgba(17,24,39,0.16)]">
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
            const accent = navigationAccents[item.href];

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!showExpandedContent ? item.label : undefined}
                className={[
                  "group relative flex min-h-14 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-bold transition-all duration-200 lg:min-h-10 lg:gap-2 lg:px-2 lg:py-1.5",
                  showExpandedContent ? "justify-start" : "justify-center",
                  isActive
                    ? accent.active
                    : `text-slate-800 hover:-translate-y-0.5 ${accent.hover} hover:text-[#111827]`,
                ].join(" ")}
                onClick={isMobileOpen ? onNavigate : undefined}
              >
                <span
                  className={[
                    "absolute inset-y-2 right-1 w-1 rounded-full transition-opacity",
                    isActive ? "bg-white/70 opacity-100" : `${accent.dot} opacity-55`,
                    showExpandedContent ? "block" : "hidden",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span
                  className={[
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/70 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition lg:h-8 lg:w-8 lg:rounded-xl",
                    isActive
                      ? "bg-white/25 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
                      : `${accent.icon}`,
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <AppIcon name={item.icon} className="h-5 w-5 lg:h-4 lg:w-4" />
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
