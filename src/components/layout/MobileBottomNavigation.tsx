"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute } from "@/types/navigation";

type PrimaryTab = {
  href: AppRoute;
  icon: AppIconName;
  glow: string;
  shadow: string;
  activeShadow: string;
};

type MoreItem = {
  href: AppRoute;
  icon: AppIconName;
  title: string;
  description: string;
  accent: string;
  background: string;
};

const primaryTabs: PrimaryTab[] = [
  {
    href: "/",
    icon: "home",
    glow: "bg-indigo-400/20",
    shadow: "0 12px 28px rgba(99,102,241,0.22)",
    activeShadow: "0 14px 34px rgba(99,102,241,0.34)",
  },
  {
    href: "/tasks",
    icon: "check",
    glow: "bg-orange-400/20",
    shadow: "0 12px 28px rgba(249,115,22,0.24)",
    activeShadow: "0 14px 34px rgba(249,115,22,0.36)",
  },
  {
    href: "/shopping",
    icon: "shopping",
    glow: "bg-cyan-400/20",
    shadow: "0 12px 28px rgba(6,182,212,0.24)",
    activeShadow: "0 14px 34px rgba(6,182,212,0.36)",
  },
  {
    href: "/finance",
    icon: "finance",
    glow: "bg-emerald-400/20",
    shadow: "0 12px 28px rgba(16,185,129,0.24)",
    activeShadow: "0 14px 34px rgba(16,185,129,0.36)",
  },
];

const moreItems: MoreItem[] = [
  {
    href: "/health",
    icon: "health",
    title: "בריאות",
    description: "תרופות, בדיקות ומעקב משפחתי",
    accent: "text-rose-700",
    background: "bg-rose-50",
  },
  {
    href: "/documents",
    icon: "document",
    title: "מסמכים",
    description: "מסמכים חשובים במקום אחד",
    accent: "text-sky-700",
    background: "bg-sky-50",
  },
  {
    href: "/command-center",
    icon: "dashboard",
    title: "מרכז המשפחה",
    description: "מה דורש טיפול עכשיו",
    accent: "text-cyan-700",
    background: "bg-cyan-50",
  },
  {
    href: "/assistant",
    icon: "spark",
    title: "העוזר של Nestly",
    description: "תשובות מתוך המידע המשפחתי",
    accent: "text-violet-700",
    background: "bg-violet-50",
  },
  {
    href: "/timeline",
    icon: "timeline",
    title: "ציר הזמן",
    description: "מה קרה לאחרונה בבית",
    accent: "text-stone-700",
    background: "bg-stone-100",
  },
  {
    href: "/vehicles",
    icon: "car",
    title: "רכבים",
    description: "טיפולים, ביטוחים וטסטים",
    accent: "text-amber-700",
    background: "bg-amber-50",
  },
  {
    href: "/family",
    icon: "family",
    title: "משפחה",
    description: "מידע, קשרים ותפקידים",
    accent: "text-violet-700",
    background: "bg-violet-50",
  },
  {
    href: "/knowledge",
    icon: "knowledge",
    title: "מידע משפחתי",
    description: "דברים שהבית צריך לזכור",
    accent: "text-teal-700",
    background: "bg-teal-50",
  },
  {
    href: "/birthdays",
    icon: "calendar",
    title: "אירועי משפחה",
    description: "ימי הולדת ואירועים חשובים",
    accent: "text-orange-700",
    background: "bg-orange-50",
  },
  {
    href: "/security",
    icon: "lock",
    title: "אבטחה",
    description: "הרשאות ומידע רגיש",
    accent: "text-slate-700",
    background: "bg-slate-100",
  },
  {
    href: "/settings",
    icon: "settings",
    title: "הגדרות",
    description: "העדפות והתאמה אישית",
    accent: "text-stone-700",
    background: "bg-stone-100",
  },
];

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const dictionary = getDictionary(language);
  const navRef = useRef<HTMLElement | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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

  function openCommandPalette() {
    closeMoreMenu();
    window.dispatchEvent(new CustomEvent("nestly-open-command-palette"));
  }

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

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
            aria-label="כל האזורים בנסטלי"
            aria-modal="true"
            dir="rtl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#efe5d7] px-4 py-3">
              <div className="text-right">
                <p className="text-[11px] font-black text-[#8a5b16]">
                  כל האזורים
                </p>
                <h2 className="text-lg font-black text-[#111827]">
                  לאן ממשיכים?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeMoreMenu}
                className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-[#eadfcd] bg-white text-slate-700 transition active:scale-95"
                aria-label="סגירת תפריט האזורים"
              >
                <AppIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-1.5 overflow-y-auto p-2.5">
              <button
                type="button"
                onClick={openCommandPalette}
                className="flex min-h-[60px] items-center gap-3 rounded-[20px] bg-white px-3 py-2 text-right shadow-sm ring-1 ring-[#eadfcd] transition active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff8eb] text-[#7a5212]">
                  <AppIcon name="spark" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-[#111827]">
                    חיפוש ופעולות
                  </span>
                  <span className="block truncate text-[12px] font-semibold text-slate-600">
                    מצאו כל דבר או פתחו פעולה מהירה
                  </span>
                </span>
              </button>

              {moreItems.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMoreMenu}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "flex min-h-[58px] items-center gap-3 rounded-[20px] px-3 py-2 text-right transition active:scale-[0.99]",
                      isActive
                        ? "bg-[#fff8eb] shadow-[inset_0_0_0_1px_rgba(154,107,23,0.18)]"
                        : "hover:bg-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                        item.background,
                        item.accent,
                      ].join(" ")}
                    >
                      <AppIcon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-[#111827]">
                        {item.title}
                      </span>
                      <span className="block truncate text-[12px] font-semibold text-slate-600">
                        {item.description}
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
        ref={navRef}
        className="fixed inset-x-2 bottom-2.5 z-40 rounded-[24px] border border-[#e6d9c9] bg-[#fffdf8]/96 px-2 py-2 shadow-[0_18px_48px_rgba(33,43,63,0.16)] backdrop-blur-2xl lg:hidden"
        aria-label="ניווט תחתון"
      >
        <div className="grid grid-cols-5 gap-1.5">
          {primaryTabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            const tabStyle = {
              "--tab-shadow": isActive ? tab.activeShadow : tab.shadow,
            } as CSSProperties;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={tabStyle}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] px-1.5 py-1.5 text-[10px] font-black shadow-[var(--tab-shadow)] ring-offset-2 ring-offset-[#fffdf8] transition duration-200 active:scale-[0.98]",
                  isActive
                    ? "border border-[#111827]/12 bg-[#fff8eb] text-[#111827] ring-1 ring-[#d8b470]/35"
                    : "border border-[#eadfcd] bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-[#fff8eb] hover:text-[#111827]",
                ].join(" ")}
              >
                <span
                  className={`pointer-events-none absolute -top-4 h-9 w-9 rounded-full blur-xl ${tab.glow}`}
                  aria-hidden="true"
                />
                <AppIcon name={tab.icon} className="relative h-5 w-5" />
                <span className="relative truncate leading-none">
                  {getRouteLabel(tab.href, dictionary)}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen((currentValue) => !currentValue)}
            className={[
              "flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-[18px] border px-1.5 py-1.5 text-[10px] font-black transition duration-200 active:scale-[0.98]",
              isMoreActive || isMoreOpen
                ? "border-[#111827]/12 bg-[#fff8eb] text-[#111827] shadow-[0_14px_34px_rgba(154,107,23,0.24)] ring-1 ring-[#d8b470]/35"
                : "border-[#eadfcd] bg-white text-slate-700 shadow-[0_12px_28px_rgba(33,43,63,0.1)] hover:-translate-y-0.5 hover:bg-[#fff8eb] hover:text-[#111827]",
            ].join(" ")}
            aria-label="פתיחת כל אזורי נסטלי"
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-navigation"
          >
            <AppIcon name="dashboard" className="h-5 w-5" />
            <span className="leading-none">עוד</span>
          </button>
        </div>
      </nav>
    </>
  );
}
