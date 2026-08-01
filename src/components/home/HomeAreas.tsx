"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { useModuleLiveStat } from "@/hooks/useModuleLiveStat";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute } from "@/types/navigation";

export function HomeSectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const { direction } = useLanguage();

  return (
    <div
      className={[
        "mb-3 flex items-end justify-between gap-3 px-1",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {action ? <div className="shrink-0">{action}</div> : <span />}
      <div className="min-w-0">
        <h2 className="text-base font-black leading-6 text-[#111827]">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 max-w-[18rem] text-xs font-semibold leading-5 text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export type AreaShortcut = {
  href: AppRoute;
  icon: AppIconName;
  title: string;
  accentClass: string;
};

export function AreaShortcutCard({ shortcut }: { shortcut: AreaShortcut }) {
  return (
    <Link
      href={shortcut.href}
      className="flex min-h-[74px] w-[86px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#eee8db] bg-white px-2 py-2.5 text-center shadow-[0_6px_16px_rgba(33,43,63,0.04)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#eadfcd] min-[430px]:w-auto"
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-2xl ring-1 ${shortcut.accentClass}`}
      >
        <AppIcon name={shortcut.icon} className="h-4.5 w-4.5" />
      </span>
      <span className="w-full truncate text-[11px] font-black text-[#111827]">
        {shortcut.title}
      </span>
    </Link>
  );
}

export type HomeArea = {
  href: AppRoute;
  icon: AppIconName;
  title: string;
  subtitle: string;
  statFallback: string;
  accentClass: string;
  tintClass?: string;
};

export function HomeAreaCard({ area }: { area: HomeArea }) {
  const { direction } = useLanguage();
  const liveStat = useModuleLiveStat(area.href, area.statFallback);

  return (
    <Link
      href={area.href}
      className={`home-area-card group relative flex min-h-[82px] items-center gap-2.5 overflow-hidden rounded-[20px] border border-white/70 px-2.5 py-2.5 shadow-[0_8px_20px_rgba(33,43,63,0.09)] transition duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-[0_12px_26px_rgba(33,43,63,0.13)] focus:outline-none focus:ring-2 focus:ring-[#d8b470]/65 active:translate-y-0 active:scale-[0.99] sm:min-h-[86px] sm:px-3 ${area.tintClass ?? "bg-white/70"} ${direction === "rtl" ? "text-right" : "text-left"}`}
    >
      <span
        className="pointer-events-none absolute -top-10 end-1 h-24 w-24 rounded-full bg-white/55 blur-2xl transition duration-300 group-hover:scale-125"
        aria-hidden="true"
      />
      <span
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-[14px] bg-white/78 text-[#111827] shadow-[0_6px_14px_rgba(33,43,63,0.1)] ring-1 ring-white/80 transition duration-200 group-hover:scale-105 sm:h-10 sm:w-10 sm:rounded-[15px]"
      >
        <AppIcon name={area.icon} className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="home-area-title block truncate text-[13px] font-black leading-5 text-[#111827] sm:text-[14px]">
          {area.title}
        </span>
        <span className="home-area-stat mt-0.5 block truncate text-[9px] font-bold text-[#111827]/65 sm:text-[10px]">
          {liveStat}
        </span>
      </span>
    </Link>
  );
}
