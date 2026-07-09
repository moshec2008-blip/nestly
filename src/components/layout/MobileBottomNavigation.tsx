"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute } from "@/types/navigation";

type MobileBottomNavigationProps = {
  onOpenMenu: () => void;
};

type PrimaryTab = {
  href: AppRoute;
  icon: AppIconName;
  glow: string;
  shadow: string;
  activeShadow: string;
};

const primaryTabs: PrimaryTab[] = [
  {
    href: "/",
    icon: "home",
    glow: "bg-indigo-400/20",
    shadow: "0 12px 28px rgba(99,102,241,0.24)",
    activeShadow: "0 14px 34px rgba(99,102,241,0.36)",
  },
  {
    href: "/finance",
    icon: "finance",
    glow: "bg-emerald-400/20",
    shadow: "0 12px 28px rgba(16,185,129,0.26)",
    activeShadow: "0 14px 34px rgba(16,185,129,0.38)",
  },
  {
    href: "/tasks",
    icon: "check",
    glow: "bg-orange-400/20",
    shadow: "0 12px 28px rgba(249,115,22,0.26)",
    activeShadow: "0 14px 34px rgba(249,115,22,0.38)",
  },
  {
    href: "/shopping",
    icon: "shopping",
    glow: "bg-cyan-400/20",
    shadow: "0 12px 28px rgba(6,182,212,0.26)",
    activeShadow: "0 14px 34px rgba(6,182,212,0.38)",
  },
];

export default function MobileBottomNavigation({
  onOpenMenu,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const dictionary = getDictionary(language);
  const navRef = useRef<HTMLElement | null>(null);

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

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-2 bottom-2.5 z-40 rounded-[24px] border border-[#e6d9c9] bg-[#fffdf8]/96 px-2 py-2 shadow-[0_18px_48px_rgba(33,43,63,0.16)] backdrop-blur-2xl lg:hidden"
      aria-label="ניווט תחתון"
    >
      <div className="grid grid-cols-5 gap-1.5">
        {primaryTabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const tabStyle = {
            "--tab-shadow": isActive ? tab.activeShadow : tab.shadow,
          } as CSSProperties;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={tabStyle}
              className={[
                "relative flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] px-1.5 py-1.5 text-[10px] font-black shadow-[var(--tab-shadow)] transition duration-200 active:scale-[0.98]",
                isActive
                  ? "bg-[#111827] text-white"
                  : "border border-[#eadfcd] bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-[#fff8eb] hover:text-[#111827]",
              ].join(" ")}
            >
              <span
                className={`pointer-events-none absolute -top-4 h-9 w-9 rounded-full blur-xl ${tab.glow}`}
                aria-hidden="true"
              />
              <AppIcon name={tab.icon} className="relative h-5 w-5" />
              <span className="relative truncate leading-none">{getRouteLabel(tab.href, dictionary)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-h-[52px] min-w-[52px] flex-col items-center justify-center gap-1 rounded-[18px] border border-[#eadfcd] bg-white px-1.5 py-1.5 text-[10px] font-black text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-[#fff8eb] hover:text-[#111827] active:scale-[0.98]"
          aria-label={dictionary.openMenu}
        >
          <span className="flex h-5 w-5 flex-col justify-center gap-0.5">
            <span className="block h-0.5 rounded-full bg-current" />
            <span className="block h-0.5 rounded-full bg-current" />
            <span className="block h-0.5 rounded-full bg-current" />
          </span>
          <span className="leading-none">עוד</span>
        </button>
      </div>
    </nav>
  );
}
