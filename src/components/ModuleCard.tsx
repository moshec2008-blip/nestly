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
  accent: string;
  border: string;
  surface: string;
};

const moduleVisuals: Record<AppRoute, ModuleVisual> = {
  "/": {
    fallbackStat: "מרכז הבית",
    icon: "home",
    iconTone: "text-indigo-700",
    iconBg: "bg-indigo-50",
    glow: "bg-indigo-400/10",
    accent: "#4f46e5",
    border: "#c7d2fe",
    surface: "#eef2ff",
  },
  "/dashboard": {
    fallbackStat: "סקירה חכמה",
    icon: "dashboard",
    iconTone: "text-sky-700",
    iconBg: "bg-sky-50",
    glow: "bg-sky-400/10",
    accent: "#0284c7",
    border: "#bae6fd",
    surface: "#f0f9ff",
  },
  "/command-center": {
    fallbackStat: "פעולה מומלצת",
    icon: "dashboard",
    iconTone: "text-cyan-700",
    iconBg: "bg-cyan-50",
    glow: "bg-cyan-400/10",
    accent: "#0891b2",
    border: "#a5f3fc",
    surface: "#ecfeff",
  },
  "/handle": {
    fallbackStat: "לטיפול",
    icon: "check",
    iconTone: "text-amber-800",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
    accent: "#b45309",
    border: "#fde68a",
    surface: "#fffbeb",
  },
  "/memory": {
    fallbackStat: "חיפוש משפחתי",
    icon: "knowledge",
    iconTone: "text-teal-700",
    iconBg: "bg-teal-50",
    glow: "bg-teal-400/10",
    accent: "#0f766e",
    border: "#99f6e4",
    surface: "#f0fdfa",
  },
  "/assistant": {
    fallbackStat: "תשובות עם מקורות",
    icon: "spark",
    iconTone: "text-violet-700",
    iconBg: "bg-violet-50",
    glow: "bg-violet-400/10",
    accent: "#7c3aed",
    border: "#ddd6fe",
    surface: "#f5f3ff",
  },
  "/timeline": {
    fallbackStat: "היסטוריה משפחתית",
    icon: "timeline",
    iconTone: "text-stone-700",
    iconBg: "bg-stone-100",
    glow: "bg-stone-400/10",
    accent: "#78716c",
    border: "#e7e5e4",
    surface: "#fafaf9",
  },
  "/life": {
    fallbackStat: "סיפורים פעילים",
    icon: "timeline",
    iconTone: "text-amber-800",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
    accent: "#b45309",
    border: "#fde68a",
    surface: "#fffbeb",
  },
  "/finance": {
    fallbackStat: "תזרים ותקציב",
    icon: "finance",
    iconTone: "text-emerald-700",
    iconBg: "bg-emerald-50",
    glow: "bg-emerald-400/10",
    accent: "#059669",
    border: "#bbf7d0",
    surface: "#ecfdf5",
  },
  "/tasks": {
    fallbackStat: "משימות פתוחות",
    icon: "check",
    iconTone: "text-orange-700",
    iconBg: "bg-orange-50",
    glow: "bg-orange-400/10",
    accent: "#ea580c",
    border: "#fed7aa",
    surface: "#fff7ed",
  },
  "/health": {
    fallbackStat: "תורים ומעקב",
    icon: "health",
    iconTone: "text-rose-700",
    iconBg: "bg-rose-50",
    glow: "bg-rose-400/10",
    accent: "#e11d48",
    border: "#fecdd3",
    surface: "#fff1f2",
  },
  "/vehicles": {
    fallbackStat: "טיפולים ורישוי",
    icon: "car",
    iconTone: "text-blue-700",
    iconBg: "bg-blue-50",
    glow: "bg-blue-400/10",
    accent: "#2563eb",
    border: "#bfdbfe",
    surface: "#eff6ff",
  },
  "/documents": {
    fallbackStat: "קבצים ומסמכים",
    icon: "document",
    iconTone: "text-violet-700",
    iconBg: "bg-violet-50",
    glow: "bg-violet-400/10",
    accent: "#7c3aed",
    border: "#ddd6fe",
    surface: "#f5f3ff",
  },
  "/birthdays": {
    fallbackStat: "אירועים קרובים",
    icon: "calendar",
    iconTone: "text-pink-700",
    iconBg: "bg-pink-50",
    glow: "bg-pink-400/10",
    accent: "#db2777",
    border: "#fbcfe8",
    surface: "#fdf2f8",
  },
  "/shopping": {
    fallbackStat: "רשימות פעילות",
    icon: "shopping",
    iconTone: "text-cyan-700",
    iconBg: "bg-cyan-50",
    glow: "bg-cyan-400/10",
    accent: "#0891b2",
    border: "#a5f3fc",
    surface: "#ecfeff",
  },
  "/family": {
    fallbackStat: "בני משפחה",
    icon: "family",
    iconTone: "text-purple-700",
    iconBg: "bg-purple-50",
    glow: "bg-purple-400/10",
    accent: "#9333ea",
    border: "#e9d5ff",
    surface: "#faf5ff",
  },
  "/knowledge": {
    fallbackStat: "זיכרון משפחתי",
    icon: "knowledge",
    iconTone: "text-teal-700",
    iconBg: "bg-teal-50",
    glow: "bg-teal-400/10",
    accent: "#0f766e",
    border: "#99f6e4",
    surface: "#f0fdfa",
  },
  "/legacy": {
    fallbackStat: "ארכיון משפחתי",
    icon: "timeline",
    iconTone: "text-amber-800",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
    accent: "#b45309",
    border: "#fde68a",
    surface: "#fffbeb",
  },
  "/permissions": {
    fallbackStat: "שיתוף והרשאות",
    icon: "lock",
    iconTone: "text-amber-700",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
    accent: "#d97706",
    border: "#fde68a",
    surface: "#fffbeb",
  },
  "/security": {
    fallbackStat: "חשבון מוגן",
    icon: "lock",
    iconTone: "text-amber-700",
    iconBg: "bg-amber-50",
    glow: "bg-amber-400/10",
    accent: "#d97706",
    border: "#fde68a",
    surface: "#fffbeb",
  },
  "/settings": {
    fallbackStat: "גיבוי והעדפות",
    icon: "settings",
    iconTone: "text-slate-700",
    iconBg: "bg-slate-100",
    glow: "bg-slate-400/10",
    accent: "#475569",
    border: "#cbd5e1",
    surface: "#f8fafc",
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
    "--module-accent": visual.accent,
    borderColor: visual.border,
    background: `linear-gradient(135deg, rgba(255,255,255,0.94), ${visual.surface})`,
  } as CSSProperties;

  return (
    <Link
      href={href}
      style={cardStyle}
      className={[
        "nestly-interactive group relative overflow-hidden rounded-[17px] border text-[#1d1d1f] shadow-[var(--module-shadow)] ring-1 ring-black/[0.026]",
        priority ? "min-h-[70px] p-2.5" : "min-h-[62px] p-2.5",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none absolute inset-y-2 w-1 rounded-full",
          direction === "rtl" ? "right-0" : "left-0",
        ].join(" ")}
        style={{ backgroundColor: visual.accent }}
        aria-hidden="true"
      />

      <span
        className={`pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full blur-2xl transition-opacity duration-200 ${visual.glow} opacity-45 group-hover:opacity-80`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full items-start gap-2.5">
        <span
          className={`grid shrink-0 place-items-center rounded-2xl ${visual.iconBg} ${visual.iconTone} shadow-sm ring-1 ring-white/70 ${
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
