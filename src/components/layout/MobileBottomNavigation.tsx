"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
};

const primaryTabs: PrimaryTab[] = [
  { href: "/", icon: "home" },
  { href: "/finance", icon: "finance" },
  { href: "/tasks", icon: "check" },
  { href: "/shopping", icon: "shopping" },
];

export default function MobileBottomNavigation({
  onOpenMenu,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const dictionary = getDictionary(language);

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-[22px] border border-[#e6d9c9] bg-white/94 px-2 py-1.5 shadow-[0_18px_48px_rgba(33,43,63,0.18)] backdrop-blur-2xl lg:hidden"
      aria-label="ניווט תחתון"
    >
      <div className="grid grid-cols-5 gap-1">
        {primaryTabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-black transition",
                isActive
                  ? "bg-[#111827] text-white shadow-[0_10px_24px_rgba(17,24,39,0.16)]"
                  : "text-slate-600 hover:bg-[#fff8eb] hover:text-[#111827]",
              ].join(" ")}
            >
              <AppIcon name={tab.icon} className="h-4 w-4" />
              <span className="truncate">{getRouteLabel(tab.href, dictionary)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[11px] font-black text-slate-600 transition hover:bg-[#fff8eb] hover:text-[#111827]"
          aria-label={dictionary.openMenu}
        >
          <span className="flex h-4 w-4 flex-col justify-center gap-0.5">
            <span className="block h-0.5 rounded-full bg-current" />
            <span className="block h-0.5 rounded-full bg-current" />
            <span className="block h-0.5 rounded-full bg-current" />
          </span>
          <span>עוד</span>
        </button>
      </div>
    </nav>
  );
}
