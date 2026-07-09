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
  glow: string;
  shadow: string;
  shadowHover: string;
  surface: string;
};

const moduleVisuals: Record<AppRoute, ModuleVisual> = {
  "/": {
    fallbackStat: "מרכז הבית",
    icon: "home",
    iconTone: "text-indigo-700",
    glow: "bg-indigo-400/20",
    shadow:
      "0 18px 44px rgba(99,102,241,0.29), 0 3px 14px rgba(99,102,241,0.16)",
    shadowHover:
      "0 22px 56px rgba(99,102,241,0.42), 0 5px 18px rgba(99,102,241,0.21)",
    surface: "from-indigo-50 to-white",
  },
  "/dashboard": {
    fallbackStat: "סקירה חכמה",
    icon: "dashboard",
    iconTone: "text-sky-700",
    glow: "bg-sky-400/20",
    shadow:
      "0 18px 44px rgba(14,165,233,0.29), 0 3px 14px rgba(14,165,233,0.16)",
    shadowHover:
      "0 22px 56px rgba(14,165,233,0.42), 0 5px 18px rgba(14,165,233,0.21)",
    surface: "from-sky-50 to-white",
  },
  "/finance": {
    fallbackStat: "תזרים ותקציב",
    icon: "finance",
    iconTone: "text-emerald-700",
    glow: "bg-emerald-400/20",
    shadow:
      "0 18px 44px rgba(16,185,129,0.31), 0 3px 14px rgba(16,185,129,0.17)",
    shadowHover:
      "0 22px 56px rgba(16,185,129,0.44), 0 5px 18px rgba(16,185,129,0.22)",
    surface: "from-emerald-50 to-white",
  },
  "/tasks": {
    fallbackStat: "משימות פתוחות",
    icon: "check",
    iconTone: "text-orange-700",
    glow: "bg-orange-400/20",
    shadow:
      "0 18px 44px rgba(249,115,22,0.30), 0 3px 14px rgba(249,115,22,0.16)",
    shadowHover:
      "0 22px 56px rgba(249,115,22,0.43), 0 5px 18px rgba(249,115,22,0.21)",
    surface: "from-orange-50 to-white",
  },
  "/health": {
    fallbackStat: "תורים ומעקב",
    icon: "health",
    iconTone: "text-rose-700",
    glow: "bg-rose-400/20",
    shadow:
      "0 18px 44px rgba(244,63,94,0.29), 0 3px 14px rgba(244,63,94,0.16)",
    shadowHover:
      "0 22px 56px rgba(244,63,94,0.42), 0 5px 18px rgba(244,63,94,0.21)",
    surface: "from-rose-50 to-white",
  },
  "/vehicles": {
    fallbackStat: "טיפולים ורישוי",
    icon: "car",
    iconTone: "text-blue-700",
    glow: "bg-blue-400/20",
    shadow:
      "0 18px 44px rgba(59,130,246,0.29), 0 3px 14px rgba(59,130,246,0.16)",
    shadowHover:
      "0 22px 56px rgba(59,130,246,0.42), 0 5px 18px rgba(59,130,246,0.21)",
    surface: "from-blue-50 to-white",
  },
  "/documents": {
    fallbackStat: "קבצים ומסמכים",
    icon: "document",
    iconTone: "text-violet-700",
    glow: "bg-violet-400/20",
    shadow:
      "0 18px 44px rgba(139,92,246,0.29), 0 3px 14px rgba(139,92,246,0.16)",
    shadowHover:
      "0 22px 56px rgba(139,92,246,0.42), 0 5px 18px rgba(139,92,246,0.21)",
    surface: "from-violet-50 to-white",
  },
  "/birthdays": {
    fallbackStat: "ימי הולדת קרובים",
    icon: "calendar",
    iconTone: "text-pink-700",
    glow: "bg-pink-400/20",
    shadow:
      "0 18px 44px rgba(236,72,153,0.29), 0 3px 14px rgba(236,72,153,0.16)",
    shadowHover:
      "0 22px 56px rgba(236,72,153,0.42), 0 5px 18px rgba(236,72,153,0.21)",
    surface: "from-pink-50 to-white",
  },
  "/shopping": {
    fallbackStat: "רשימות פעילות",
    icon: "shopping",
    iconTone: "text-cyan-700",
    glow: "bg-cyan-400/20",
    shadow:
      "0 18px 44px rgba(6,182,212,0.29), 0 3px 14px rgba(6,182,212,0.16)",
    shadowHover:
      "0 22px 56px rgba(6,182,212,0.42), 0 5px 18px rgba(6,182,212,0.21)",
    surface: "from-cyan-50 to-white",
  },
  "/family": {
    fallbackStat: "בני משפחה",
    icon: "family",
    iconTone: "text-purple-700",
    glow: "bg-purple-400/20",
    shadow:
      "0 18px 44px rgba(168,85,247,0.29), 0 3px 14px rgba(168,85,247,0.16)",
    shadowHover:
      "0 22px 56px rgba(168,85,247,0.42), 0 5px 18px rgba(168,85,247,0.21)",
    surface: "from-purple-50 to-white",
  },
  "/permissions": {
    fallbackStat: "שיתוף והרשאות",
    icon: "lock",
    iconTone: "text-amber-700",
    glow: "bg-amber-400/20",
    shadow:
      "0 18px 44px rgba(245,158,11,0.29), 0 3px 14px rgba(245,158,11,0.16)",
    shadowHover:
      "0 22px 56px rgba(245,158,11,0.42), 0 5px 18px rgba(245,158,11,0.21)",
    surface: "from-amber-50 to-white",
  },
  "/settings": {
    fallbackStat: "גיבוי והעדפות",
    icon: "settings",
    iconTone: "text-slate-700",
    glow: "bg-slate-400/20",
    shadow:
      "0 18px 44px rgba(100,116,139,0.26), 0 3px 14px rgba(100,116,139,0.14)",
    shadowHover:
      "0 22px 56px rgba(100,116,139,0.36), 0 5px 18px rgba(100,116,139,0.20)",
    surface: "from-slate-100 to-white",
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
    "--module-shadow": visual.shadow,
    "--module-shadow-hover": visual.shadowHover,
  } as CSSProperties;

  return (
    <Link
      href={href}
      style={cardStyle}
      className={[
        `nestly-interactive group relative overflow-hidden rounded-[20px] border border-white/85 bg-gradient-to-br ${visual.surface} text-[#1d1d1f] shadow-[var(--module-shadow)]`,
        priority ? "min-h-[84px] p-2.5" : "min-h-[70px] p-2.5",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <span
        className={`pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full blur-2xl transition-opacity duration-200 ${visual.glow} opacity-70 group-hover:opacity-100`}
        aria-hidden="true"
      />
      <span
        className={`pointer-events-none absolute bottom-0 right-0 h-1 w-16 rounded-tl-full ${visual.glow} opacity-80`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full items-start gap-2.5">
        <span
          className={`grid shrink-0 place-items-center rounded-2xl border border-white/90 bg-white/95 shadow-[0_10px_22px_rgba(33,43,63,0.08)] ${visual.iconTone} ${
            priority ? "h-9 w-9" : "h-8 w-8"
          }`}
        >
          <AppIcon
            name={visual.icon}
            className={priority ? "h-[18px] w-[18px]" : "h-4 w-4"}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
              {status}
            </span>
            <h3 className="truncate text-sm font-black leading-5 sm:text-[15px]">
              {title}
            </h3>
          </div>

          {priority && (
            <p className="mt-1 line-clamp-1 text-xs font-semibold leading-4 text-slate-600">
              {getShortDescription(description)}
            </p>
          )}

          <p className="mt-1 truncate text-xs font-black text-slate-900">
            {liveStat}
          </p>
        </div>
      </div>
    </Link>
  );
}
