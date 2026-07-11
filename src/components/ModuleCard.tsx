"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { useModuleLiveStat } from "@/hooks/useModuleLiveStat";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute, NavigationItem } from "@/types/navigation";

type ModuleCardProps = {
  title: string;
  description: string;
  href: AppRoute;
  status: NavigationItem["status"];
  priority?: boolean;
};

type ModuleVisual = {
  fallbackStat: string;
  icon: AppIconName;
  iconTone: string;
  iconBg: string;
  glow: string;
};

const moduleVisuals: Record<AppRoute, ModuleVisual> = {
  "/": {
    fallbackStat: "מרכז הבית",
    icon: "home",
    iconTone: "text-indigo-700",
    iconBg: "bg-indigo-50",
    glow: "bg-indigo-400/10",
  },
  "/dashboard": {
    fallbackStat: "סקירה חכמה",
    icon: "dashboard",
    iconTone: "text-sky-700",
    iconBg: "bg-sky-50",
    glow: "bg-sky-400/10",
  },
  "/finance": {
    fallbackStat: "תזרים ותקציב",
    icon: "finance",
    iconTone: "text-emerald-700",
    iconBg: "bg-emerald-50",
    glow: "bg-emerald-400/10",
  },
  "/tasks": {
    fallbackStat: "משימות פתוחות",
    icon: "check",
    iconTone: "text-orange-700",
    iconBg: "bg-orange-50",
    glow: "bg-orange-400/10",
  },
  "/health": {
    fallbackStat: "תורים ומעקב",
    icon: "health",
    iconTone: "text-rose-700",
    iconBg: "bg-rose-50",
    glow: "bg-rose-400/10",
  },
  "/vehicles": {
    fallbackStat: "טיפולים ורישוי",
    icon: "car",
    iconTone: "text-blue-700",
    iconBg: "bg-blue-50",
    glow: "bg-blue-400/10",
  },
  "/documents": {
    fallbackStat: "קבצים ומסמכים",
    icon: "document",
    iconTone: "text-violet-700",
    iconBg: "bg-violet-50",
    glow: "bg-violet-400/10",
  },
  "/birthdays": {
    fallbackStat: "אירועים קרובים",
    icon: "calendar",
    iconTone: "text-pink-700",
    iconBg: "bg-pink-50",
    glow: "bg-pink-400/10",
  },
  "/shopping": {
    fallbackStat: "רשימות פעילות",
    icon: "shopping",
    iconTone: "text-cyan-700",
    iconBg: "bg-cyan-50",
    glow: "bg-cyan-400/10",
  },
  "/family": {
    fallbackStat: "בני משפחה",
    icon: "family",
    iconTone: "text-purple-700",
    iconBg: "bg-purple-50",
    glow: "bg-purple-400/10",
  },
  "/permissions": {
    fallbackStat: "שיתוף והרשאות",
    icon: "lock",
    iconTone: "text-amber-700",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
  },
  "/security": {
    fallbackStat: "חשבון מוגן",
    icon: "lock",
    iconTone: "text-amber-700",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
  },
  "/settings": {
    fallbackStat: "גיבוי והעדפות",
    icon: "settings",
    iconTone: "text-slate-700",
    iconBg: "bg-slate-100",
    glow: "bg-slate-400/10",
  },
};

function getShortDescription(description: string) {
  const firstPart = description.split(",")[0]?.trim();
  return firstPart || description;
}

export default function ModuleCard({
  title,
  description,
  href,
  status,
  priority = false,
}: ModuleCardProps) {
  const { direction } = useLanguage();
  const visual = moduleVisuals[href];
  const liveStat = useModuleLiveStat(href, visual.fallbackStat);
  const cardStyle = {
    "--module-shadow": priority
      ? "0 12px 28px rgba(33,43,63,0.055)"
      : "0 8px 20px rgba(33,43,63,0.04)",
  } as CSSProperties;

  return (
    <Link
      href={href}
      style={cardStyle}
      className={[
        "nestly-interactive group relative overflow-hidden rounded-[17px] bg-white/82 text-[#1d1d1f] shadow-[var(--module-shadow)] ring-1 ring-black/[0.028]",
        priority ? "min-h-[70px] p-2.5" : "min-h-[62px] p-2.5",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <span
        className={`pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full blur-2xl transition-opacity duration-200 ${visual.glow} opacity-45 group-hover:opacity-80`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full items-start gap-2.5">
        <span
          className={`grid shrink-0 place-items-center rounded-2xl ${visual.iconBg} ${visual.iconTone} ${
            priority ? "h-9 w-9" : "h-8 w-8"
          }`}
          aria-hidden="true"
        >
          <AppIcon
            name={visual.icon}
            className={priority ? "h-[18px] w-[18px]" : "h-4 w-4"}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${visual.iconBg}`}
              aria-label={status}
              title={status}
            />
            <h3 className="truncate text-sm font-black leading-5 sm:text-[15px]">
              {title}
            </h3>
          </div>

          {priority && (
            <p className="mt-1 line-clamp-1 text-xs font-medium leading-4 text-slate-500">
              {getShortDescription(description)}
            </p>
          )}

          <p className="mt-1 truncate text-xs font-bold text-slate-800">
            {liveStat}
          </p>
        </div>
      </div>
    </Link>
  );
}
