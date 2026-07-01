"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appModules } from "@/data/dashboard";
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
  const primaryLinks: SidebarLink[] = [
    { label: dictionary.nav.home, href: "/", icon: icons["/"] },
    ...appModules.map((module) => ({
      label: getRouteLabel(module.href, dictionary),
      href: module.href,
      icon: icons[module.href],
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
          "premium-scrollbar fixed bottom-3 right-3 top-[4.25rem] z-30 overflow-y-auto rounded-[22px] border border-[#e6e8ec] bg-white/90 p-1.5 text-right shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl transition-all duration-300 ease-out lg:sticky lg:bottom-auto lg:right-auto lg:top-auto lg:z-10 lg:h-[calc(100vh-5rem)] lg:shrink-0",
          isMobileOpen
            ? "w-[min(22rem,calc(100vw-1.5rem))] translate-x-0"
            : "w-[min(22rem,calc(100vw-1.5rem))] translate-x-[120%]",
          isCollapsed ? "lg:w-12" : "lg:w-36",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
            className={[
              "mb-2 rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-1.5 shadow-sm transition-all duration-300",
              isCollapsed
                ? "text-center"
                : direction === "rtl"
                  ? "text-right"
                  : "text-left",
            ].join(" ")}
          >
          <div
            className={[
              "flex items-center gap-2",
              isCollapsed
                ? "justify-center"
                : direction === "rtl"
                  ? "justify-start"
                  : "justify-start",
            ].join(" ")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-2xl bg-[#111827] text-xs font-black text-white shadow-sm">
              {isCollapsed ? "N" : brand.logoMark}
            </span>
            {!isCollapsed && (
              <div>
                <h2 className="text-base font-black text-[#1d1d1f]">
                  {brand.productName}
                </h2>
                <p className="text-[10px] font-bold text-slate-500">
                  {dictionary.tagline}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <p className="mt-1 text-[11px] leading-4 text-slate-500">
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
                title={isCollapsed ? item.label : undefined}
                className={[
                  "group flex items-center gap-2 rounded-2xl px-2 py-1.5 text-sm font-bold transition-all duration-200",
                  isCollapsed ? "justify-center" : "justify-start",
                  isActive
                    ? "bg-[#111827] text-white shadow-[0_14px_35px_rgba(15,23,42,0.12)]"
                    : "text-slate-600 hover:-translate-y-0.5 hover:bg-[#fafafb] hover:text-[#111827]",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-7 w-7 shrink-0 place-items-center rounded-xl text-xs transition",
                    isActive
                      ? "bg-white/12 text-white"
                      : "bg-[#f2f3f5] text-slate-500 group-hover:bg-white",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
