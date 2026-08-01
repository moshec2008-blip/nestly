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
      className={`home-area-card group relative flex min-h-[112px] flex-col items-stretch justify-between gap-2.5 overflow-hidden rounded-[22px] border border-white/70 px-3 py-3 shadow-[0_10px_24px_rgba(33,43,63,0.1)] transition duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-[0_16px_32px_rgba(33,43,63,0.14)] focus:outline-none focus:ring-2 focus:ring-[#d8b470]/65 active:translate-y-0 active:scale-[0.99] sm:min-h-[118px] sm:rounded-[24px] sm:px-3.5 ${area.tintClass ?? "bg-white/70"} ${direction === "rtl" ? "text-right" : "text-left"}`}
    >
      <span
        className="pointer-events-none absolute -top-10 end-1 h-24 w-24 rounded-full bg-white/55 blur-2xl transition duration-300 group-hover:scale-125"
        aria-hidden="true"
      />
      <span className="relative flex items-start justify-between gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-white/78 text-[#111827] shadow-[0_8px_18px_rgba(33,43,63,0.1)] ring-1 ring-white/80 transition duration-200 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-[17px]"
        >
          <AppIcon name={area.icon} className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/38 text-base font-black text-[#111827]/75 backdrop-blur-sm transition group-hover:bg-white/65" aria-hidden="true">
          {direction === "rtl" ? "‹" : "›"}
        </span>
      </span>
      <span className="relative min-w-0">
        <span className="home-area-title block text-[14px] font-black leading-5 text-[#111827] sm:text-[15px]">
          {area.title}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-bold text-[#253044]/70 sm:text-[11px]">
          {area.subtitle}
        </span>
        <span className="home-area-stat mt-1 block truncate text-[10px] font-black text-[#111827]/72">
          {liveStat}
        </span>
      </span>
    </Link>
  );
}
