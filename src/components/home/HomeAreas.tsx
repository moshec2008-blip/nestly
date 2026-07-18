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
        "mb-2.5 flex items-start justify-between gap-3",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {action ? <div className="shrink-0">{action}</div> : <span />}
      <div className="min-w-0">
        <h2 className="text-base font-black leading-6 text-[#111827]">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs font-semibold leading-4 text-slate-500">
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
      className={`home-area-card relative flex min-h-[84px] flex-col justify-between overflow-hidden rounded-[18px] bg-white/72 p-3 shadow-[0_7px_18px_rgba(33,43,63,0.035)] transition duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#eadfcd] active:scale-[0.99] ${direction === "rtl" ? "text-right" : "text-left"}`}
    >
      <span
        className={[
          "absolute inset-y-3 w-0.5",
          direction === "rtl" ? "right-0 rounded-l-full" : "left-0 rounded-r-full",
          area.accentClass,
        ].join(" ")}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-2">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-2xl ${area.accentClass}`}
        >
          <AppIcon name={area.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="home-area-title truncate text-[13px] font-black text-[#111827]">
            {area.title}
          </h3>
          <p className="home-area-subtitle truncate text-[11px] font-semibold text-slate-500">
            {area.subtitle}
          </p>
        </div>
      </div>
      <p className="home-area-stat truncate text-[11px] font-black text-slate-600">
        {liveStat}
      </p>
    </Link>
  );
}
