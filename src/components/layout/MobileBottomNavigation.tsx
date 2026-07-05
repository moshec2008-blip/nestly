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
      className="fixed inset-x-2 bottom-2.5 z-40 rounded-[24px] border border-[#e6d9c9] bg-white/95 px-2 py-2 shadow-[0_18px_48px_rgba(33,43,63,0.18)] backdrop-blur-2xl lg:hidden"
      aria-label="ניווט תחתון"
    >
      <div className="grid grid-cols-5 gap-1.5">
        {primaryTabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-[18px] px-1.5 py-1.5 text-[10px] font-black transition-colors duration-200",
                isActive
                  ? "bg-[#111827] text-white shadow-[0_10px_24px_rgba(17,24,39,0.16)]"
                  : "text-slate-600 hover:bg-[#fff8eb] hover:text-[#111827]",
              ].join(" ")}
            >
              <AppIcon name={tab.icon} className="h-5 w-5" />
              <span className="truncate leading-none">{getRouteLabel(tab.href, dictionary)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-[18px] px-1.5 py-1.5 text-[10px] font-black text-slate-600 transition-colors duration-200 hover:bg-[#fff8eb] hover:text-[#111827]"
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
