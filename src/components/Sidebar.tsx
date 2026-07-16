"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { getDictionary } from "@/i18n/dictionaries";
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

const sidebarLinks: SidebarLink[] = [
  {
    label: "בית",
    href: "/",
    icon: "home",
    description: "מה חשוב היום בבית",
  },
  {
    label: "משימות",
    href: "/tasks",
    icon: "check",
    description: "משימות ותזכורות לכל הבית",
  },
  {
    label: "מרכז המשפחה",
    href: "/command-center",
    icon: "dashboard",
    description: "מה כדאי לטפל בו עכשיו",
  },
  {
    label: "ציר הזמן",
    href: "/timeline",
    icon: "timeline",
    description: "מה קרה לאחרונה בבית",
  },
  {
    label: "קניות",
    href: "/shopping",
    icon: "shopping",
    description: "רשימות קנייה חכמות למשפחה",
  },
  {
    label: "כספים",
    href: "/finance",
    icon: "finance",
    description: "הכנסות, הוצאות ותקציב",
  },
  {
    label: "משפחה",
    href: "/family",
    icon: "family",
    description: "מידע, קשרים ותפקידים",
  },
  {
    label: "מידע משפחתי",
    href: "/knowledge",
    icon: "knowledge",
    description: "דברים שהבית צריך לזכור",
  },
  {
    label: "אירועי משפחה",
    href: "/birthdays",
    icon: "calendar",
    description: "ימי הולדת, נישואין ואירועים",
  },
  {
    label: "רכבים",
    href: "/vehicles",
    icon: "car",
    description: "טיפולים, ביטוחים וטסטים",
  },
  {
    label: "בריאות",
    href: "/health",
    icon: "health",
    description: "תרופות, בדיקות ומעקב רפואי",
  },
  {
    label: "מסמכים",
    href: "/documents",
    icon: "document",
    description: "מסמכים חשובים במקום אחד",
  },
  {
    label: "אבטחה",
    href: "/security",
    icon: "lock",
    description: "התראות ומידע רגיש",
  },
  {
    label: "הגדרות",
    href: "/settings",
    icon: "settings",
    description: "העדפות והתאמה אישית",
  },
];

const navigationAccents: Record<
  AppRoute,
  {
    dot: string;
    icon: string;
    active: string;
    hover: string;
    glow: string;
    shadow: string;
    activeShadow: string;
  }
> = {
  "/": {
    dot: "bg-indigo-400",
    icon: "border-indigo-200 bg-indigo-100 text-indigo-900",
    active: "border-indigo-200 bg-indigo-50 text-[#111827] ring-1 ring-indigo-200/80",
    hover: "hover:bg-indigo-50/90",
    glow: "bg-indigo-400/20",
    shadow: "0 12px 30px rgba(99,102,241,0.24)",
    activeShadow: "0 16px 38px rgba(99,102,241,0.38)",
  },
  "/finance": {
    dot: "bg-emerald-400",
    icon: "border-emerald-200 bg-emerald-100 text-emerald-900",
    active: "border-emerald-200 bg-emerald-50 text-[#111827] ring-1 ring-emerald-200/80",
    hover: "hover:bg-emerald-50/90",
    glow: "bg-emerald-400/20",
    shadow: "0 12px 30px rgba(16,185,129,0.26)",
    activeShadow: "0 16px 38px rgba(4,120,87,0.38)",
  },
  "/tasks": {
    dot: "bg-orange-400",
    icon: "border-orange-200 bg-orange-100 text-orange-900",
    active: "border-orange-200 bg-orange-50 text-[#111827] ring-1 ring-orange-200/80",
    hover: "hover:bg-orange-50/90",
    glow: "bg-orange-400/20",
    shadow: "0 12px 30px rgba(249,115,22,0.26)",
    activeShadow: "0 16px 38px rgba(234,88,12,0.38)",
  },
  "/dashboard": {
    dot: "bg-sky-400",
    icon: "border-sky-200 bg-sky-100 text-sky-900",
    active: "border-sky-200 bg-sky-50 text-[#111827] ring-1 ring-sky-200/80",
    hover: "hover:bg-sky-50/90",
    glow: "bg-sky-400/20",
    shadow: "0 12px 30px rgba(14,165,233,0.24)",
    activeShadow: "0 16px 38px rgba(3,105,161,0.36)",
  },
  "/command-center": {
    dot: "bg-cyan-400",
    icon: "border-cyan-200 bg-cyan-100 text-cyan-900",
    active: "border-cyan-200 bg-cyan-50 text-[#111827] ring-1 ring-cyan-200/80",
    hover: "hover:bg-cyan-50/90",
    glow: "bg-cyan-400/20",
    shadow: "0 12px 30px rgba(6,182,212,0.24)",
    activeShadow: "0 16px 38px rgba(14,116,144,0.36)",
  },
  "/assistant": {
    dot: "bg-violet-400",
    icon: "border-violet-200 bg-violet-100 text-violet-900",
    active: "border-violet-200 bg-violet-50 text-[#111827] ring-1 ring-violet-200/80",
    hover: "hover:bg-violet-50/90",
    glow: "bg-violet-400/20",
    shadow: "0 12px 30px rgba(139,92,246,0.22)",
    activeShadow: "0 16px 38px rgba(109,40,217,0.32)",
  },
  "/timeline": {
    dot: "bg-stone-400",
    icon: "border-stone-200 bg-stone-100 text-stone-900",
    active: "border-stone-200 bg-stone-100 text-[#111827] ring-1 ring-stone-200/80",
    hover: "hover:bg-stone-100/90",
    glow: "bg-stone-400/20",
    shadow: "0 12px 30px rgba(120,113,108,0.22)",
    activeShadow: "0 16px 38px rgba(87,83,78,0.34)",
  },
  "/health": {
    dot: "bg-rose-400",
    icon: "border-rose-200 bg-rose-100 text-rose-900",
    active: "border-rose-200 bg-rose-50 text-[#111827] ring-1 ring-rose-200/80",
    hover: "hover:bg-rose-50/90",
    glow: "bg-rose-400/20",
    shadow: "0 12px 30px rgba(244,63,94,0.24)",
    activeShadow: "0 16px 38px rgba(225,29,72,0.36)",
  },
  "/documents": {
    dot: "bg-violet-400",
    icon: "border-violet-200 bg-violet-100 text-violet-900",
    active: "border-violet-200 bg-violet-50 text-[#111827] ring-1 ring-violet-200/80",
    hover: "hover:bg-violet-50/90",
    glow: "bg-violet-400/20",
    shadow: "0 12px 30px rgba(139,92,246,0.24)",
    activeShadow: "0 16px 38px rgba(109,40,217,0.36)",
  },
  "/vehicles": {
    dot: "bg-blue-400",
    icon: "border-blue-200 bg-blue-100 text-blue-900",
    active: "border-blue-200 bg-blue-50 text-[#111827] ring-1 ring-blue-200/80",
    hover: "hover:bg-blue-50/90",
    glow: "bg-blue-400/20",
    shadow: "0 12px 30px rgba(59,130,246,0.24)",
    activeShadow: "0 16px 38px rgba(29,78,216,0.36)",
  },
  "/family": {
    dot: "bg-purple-400",
    icon: "border-purple-200 bg-purple-100 text-purple-900",
    active: "border-purple-200 bg-purple-50 text-[#111827] ring-1 ring-purple-200/80",
    hover: "hover:bg-purple-50/90",
    glow: "bg-purple-400/20",
    shadow: "0 12px 30px rgba(168,85,247,0.24)",
    activeShadow: "0 16px 38px rgba(126,34,206,0.36)",
  },
  "/knowledge": {
    dot: "bg-teal-400",
    icon: "border-teal-200 bg-teal-100 text-teal-900",
    active: "border-teal-200 bg-teal-50 text-[#111827] ring-1 ring-teal-200/80",
    hover: "hover:bg-teal-50/90",
    glow: "bg-teal-400/20",
    shadow: "0 12px 30px rgba(20,184,166,0.24)",
    activeShadow: "0 16px 38px rgba(15,118,110,0.36)",
  },
  "/birthdays": {
    dot: "bg-pink-400",
    icon: "border-pink-200 bg-pink-100 text-pink-900",
    active: "border-pink-200 bg-pink-50 text-[#111827] ring-1 ring-pink-200/80",
    hover: "hover:bg-pink-50/90",
    glow: "bg-pink-400/20",
    shadow: "0 12px 30px rgba(236,72,153,0.24)",
    activeShadow: "0 16px 38px rgba(219,39,119,0.36)",
  },
  "/shopping": {
    dot: "bg-cyan-400",
    icon: "border-cyan-200 bg-cyan-100 text-cyan-900",
    active: "border-cyan-200 bg-cyan-50 text-[#111827] ring-1 ring-cyan-200/80",
    hover: "hover:bg-cyan-50/90",
    glow: "bg-cyan-400/20",
    shadow: "0 12px 30px rgba(6,182,212,0.24)",
    activeShadow: "0 16px 38px rgba(14,116,144,0.36)",
  },
  "/security": {
    dot: "bg-amber-400",
    icon: "border-amber-200 bg-amber-100 text-amber-900",
    active: "border-amber-200 bg-amber-50 text-[#111827] ring-1 ring-amber-200/80",
    hover: "hover:bg-amber-50/90",
    glow: "bg-amber-400/20",
    shadow: "0 12px 30px rgba(245,158,11,0.24)",
    activeShadow: "0 16px 38px rgba(217,119,6,0.36)",
  },
  "/permissions": {
    dot: "bg-amber-400",
    icon: "border-amber-200 bg-amber-100 text-amber-900",
    active: "border-amber-200 bg-amber-50 text-[#111827] ring-1 ring-amber-200/80",
    hover: "hover:bg-amber-50/90",
    glow: "bg-amber-400/20",
    shadow: "0 12px 30px rgba(245,158,11,0.24)",
    activeShadow: "0 16px 38px rgba(217,119,6,0.36)",
  },
  "/settings": {
    dot: "bg-slate-400",
    icon: "border-slate-200 bg-slate-100 text-slate-900",
    active: "border-slate-200 bg-slate-100 text-[#111827] ring-1 ring-slate-200/80",
    hover: "hover:bg-slate-100/90",
    glow: "bg-slate-400/20",
    shadow: "0 12px 30px rgba(100,116,139,0.22)",
    activeShadow: "0 16px 38px rgba(15,23,42,0.34)",
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
  const showExpandedContent = !isCollapsed || isMobileOpen;
  const primaryLinks = sidebarLinks;

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
          isMobileOpen
            ? "translate-x-0"
            : "translate-x-[calc(100%+1rem)]",
          isCollapsed ? "lg:w-11" : "lg:w-44",
          "lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className={[
          "mb-1 rounded-[16px] bg-white/78 p-1.5 shadow-[0_8px_20px_rgba(33,43,63,0.04)] transition-all duration-300 lg:bg-gradient-to-br lg:from-[#fffdf7] lg:to-[#f6f8fb] lg:p-1.5",
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
              aria-label="סגור תפריט"
            >
              <AppIcon name="close" className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 text-right">
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#e6d9c9] bg-[#fff8eb] p-1 shadow-sm">
                <Image
                  src="/nestly-logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-[#111827]">
                  {brand.workspaceName}
                </h2>
              <p className="truncate text-[11px] font-bold text-slate-600">
                  אזורי המשפחה
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
              className="grid h-8 w-8 place-items-center overflow-hidden rounded-2xl border border-[#e6d9c9] bg-[#fff8eb] p-1 shadow-[0_10px_24px_rgba(154,107,23,0.18)] transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#b86f68]/35"
              aria-label={`${brand.productName} - ${dictionary.nav.home}`}
            >
              <Image
                src="/nestly-logo.png"
                alt=""
                width={32}
                height={32}
                className="h-full w-full object-contain"
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
          {showExpandedContent && (
            <p className="mt-1 hidden truncate text-[11px] font-semibold leading-4 text-slate-600 lg:block">
              {dictionary.workspaceLabel}
            </p>
          )}
        </div>

        <nav className="space-y-0.5" aria-label={dictionary.openMenu}>
          {primaryLinks.map((item) => {
            const isActive = pathname === item.href;
            const accent = navigationAccents[item.href];
            const linkStyle = {
              "--nav-shadow": isActive
                ? "0 10px 24px rgba(15,23,42,0.08)"
                : "0 4px 12px rgba(15,23,42,0.025)",
            } as CSSProperties;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={linkStyle}
                title={!showExpandedContent ? item.label : undefined}
                className={[
                  "group relative flex min-h-[46px] items-center gap-1.5 overflow-hidden rounded-2xl border px-1.5 py-1 text-sm font-bold shadow-[var(--nav-shadow)] transition-all duration-200 lg:min-h-11 lg:gap-1.5 lg:px-1.5 lg:py-1",
                  showExpandedContent ? "justify-start" : "justify-center",
                  isActive
                    ? accent.active
                    : "border-transparent bg-transparent text-slate-800 hover:-translate-y-0.5 hover:bg-white/82 hover:text-[#111827]",
                ].join(" ")}
                onClick={isMobileOpen ? onNavigate : undefined}
              >
                <span
                  className={[
                    "absolute inset-y-2 right-1 w-1 rounded-full transition-opacity",
                    isActive ? `${accent.dot} opacity-100` : `${accent.dot} opacity-25`,
                    showExpandedContent ? "block" : "hidden",
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span
                  className={`pointer-events-none absolute -top-5 h-12 w-12 rounded-full blur-xl transition-opacity ${accent.glow} ${
                    isActive ? "opacity-80" : "opacity-0"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={[
                    "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-2xl border border-white/70 shadow-[0_6px_16px_rgba(15,23,42,0.045)] transition lg:h-8 lg:w-8 lg:rounded-xl",
                    isActive
                      ? `${accent.icon} ring-2 ring-white`
                      : "border-slate-100 bg-white text-slate-700 group-hover:text-[#111827]",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  <AppIcon name={item.icon} className="h-5 w-5 stroke-[2.35] lg:h-[18px] lg:w-[18px]" />
                </span>
                {showExpandedContent && (
                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="block truncate text-sm font-black leading-5">
                      {item.label}
                    </span>
                    <span
                      className={[
                        "mt-0.5 block truncate text-[11px] font-semibold leading-4 lg:text-[10px]",
                        isActive ? "text-slate-700" : "text-slate-600",
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
