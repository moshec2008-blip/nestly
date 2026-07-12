"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import ModuleCard from "@/components/ModuleCard";
import DashboardLiveOverview from "@/components/dashboard/DashboardLiveOverview";
import TodayForFamily from "@/components/dashboard/TodayForFamily";
import AppShell from "@/components/layout/AppShell";
import DemoEntryCard from "@/components/layout/DemoEntryCard";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import { getDashboardContent } from "@/i18n/dashboardContent";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";
import type { AppRoute } from "@/types/navigation";

type AreaShortcut = {
  href: AppRoute;
  icon: AppIconName;
  title: string;
  description: string;
  accent: string;
  bg: string;
  border: string;
};

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

const areaShortcuts: AreaShortcut[] = [
  {
    href: "/health",
    icon: "health",
    title: "בריאות",
    description: "תרופות ובדיקות",
    accent: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
  },
  {
    href: "/documents",
    icon: "document",
    title: "מסמכים",
    description: "כל מה שחשוב",
    accent: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    href: "/vehicles",
    icon: "car",
    title: "רכבים",
    description: "טסטים וביטוחים",
    accent: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    href: "/family",
    icon: "family",
    title: "משפחה",
    description: "קשרים ותפקידים",
    accent: "#9333ea",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
  {
    href: "/birthdays",
    icon: "calendar",
    title: "אירועים",
    description: "ימי משפחה",
    accent: "#db2777",
    bg: "#fdf2f8",
    border: "#fbcfe8",
  },
];

function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3 text-right">
      {action ? <div className="shrink-0">{action}</div> : <span />}
      <div className="min-w-0">
        <h2 className="text-base font-black text-[#111827] sm:text-lg">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);
  const dashboardContent = getDashboardContent(language);
  const primaryModuleRoutes = new Set([
    "/tasks",
    "/shopping",
    "/finance",
    "/birthdays",
    "/family",
    "/vehicles",
    "/health",
    "/documents",
  ]);
  const primaryModules = dashboardContent.modules.filter((module) =>
    primaryModuleRoutes.has(module.href)
  );
  const secondaryModules = dashboardContent.modules.filter(
    (module) => !primaryModuleRoutes.has(module.href)
  );

  return (
    <AppShell>
      <div className="space-y-4 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.25rem)] lg:space-y-5 lg:pb-0">
        <Header />
        <TodayForFamily />

        <section className="rounded-[22px] border border-[#eadfcd]/80 bg-white/82 p-4 text-[#1d1d1f] shadow-[0_12px_30px_rgba(33,43,63,0.055)]">
          <SectionHeader
            title="כל האזורים"
            description="קיצורים לאזורים שלא תמיד מופיעים בניווט התחתון"
          />

          <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-5">
            {areaShortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="relative flex min-h-12 items-center gap-2 overflow-hidden rounded-2xl border bg-white px-2.5 py-2 text-right text-[#111827] shadow-[0_6px_16px_rgba(33,43,63,0.035)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#eadfcd] active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, #ffffff, ${shortcut.bg})`,
                  borderColor: shortcut.border,
                }}
              >
                <span
                  className="absolute inset-y-2 right-0 w-1 rounded-full"
                  style={{ backgroundColor: shortcut.accent }}
                  aria-hidden="true"
                />
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-white/80"
                  style={{ color: shortcut.accent }}
                >
                  <AppIcon name={shortcut.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-black">
                    {shortcut.title}
                  </span>
                  <span className="block truncate text-[10px] font-semibold text-slate-600">
                    {shortcut.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eadfcd]/80 bg-white/86 p-4 text-[#1d1d1f] shadow-[0_12px_30px_rgba(33,43,63,0.055)]">
          <SectionHeader
            title="אזורי הבית"
            description="כל מה שצריך לניהול המשפחה במקום אחד"
            action={
              <span className="rounded-full bg-[#fff8eb] px-2.5 py-1 text-[11px] font-black text-[#7a5212]">
                ניווט מהיר
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:grid-cols-4">
            {primaryModules.map((module) => (
              <ModuleCard
                key={module.href}
                title={getRouteLabel(module.href, dictionary)}
                description={module.description}
                href={module.href}
                status={module.status}
                priority
              />
            ))}
          </div>
        </section>

        <details className="rounded-[22px] border border-[#eadfcd]/75 bg-white/78 p-4 text-[#1d1d1f] shadow-[0_10px_26px_rgba(33,43,63,0.045)]">
          <summary
            className={[
              "flex min-h-11 cursor-pointer list-none items-center justify-between gap-4",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <span className="rounded-full border border-[#eadfcd] bg-[#fff8eb] px-2.5 py-1 text-[11px] font-bold text-[#7a5212]">
              {dashboardContent.modules.length} אזורים
            </span>
            <div>
              <p className="text-xs font-bold text-slate-600">עוד בבית</p>
              <h2 className="mt-0.5 text-sm font-black text-[#111827] sm:text-base">
                לפתיחה רק כשצריך
              </h2>
            </div>
          </summary>

          {secondaryModules.length > 0 && (
            <section className="premium-details-panel mt-2.5 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:grid-cols-4">
              {secondaryModules.map((module) => (
                <ModuleCard
                  key={module.href}
                  title={getRouteLabel(module.href, dictionary)}
                  description={module.description}
                  href={module.href}
                  status={module.status}
                />
              ))}
            </section>
          )}
        </details>

        <DashboardLiveOverview />

        <DemoEntryCard />
      </div>
    </AppShell>
  );
}
