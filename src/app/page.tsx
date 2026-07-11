"use client";

import Link from "next/link";
import Header from "@/components/Header";
import ModuleCard from "@/components/ModuleCard";
import DashboardLiveOverview from "@/components/dashboard/DashboardLiveOverview";
import TodayForFamily from "@/components/dashboard/TodayForFamily";
import AppShell from "@/components/layout/AppShell";
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
};

const areaShortcuts: AreaShortcut[] = [
  {
    href: "/health",
    icon: "health",
    title: "בריאות",
    description: "תרופות ובדיקות",
  },
  {
    href: "/documents",
    icon: "document",
    title: "מסמכים",
    description: "כל מה שחשוב",
  },
  {
    href: "/vehicles",
    icon: "car",
    title: "רכבים",
    description: "טסטים וביטוחים",
  },
  {
    href: "/family",
    icon: "family",
    title: "משפחה",
    description: "קשרים ותפקידים",
  },
  {
    href: "/birthdays",
    icon: "calendar",
    title: "אירועים",
    description: "ימי משפחה",
  },
];

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
      <div className="space-y-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] lg:pb-0">
        <Header />
        <TodayForFamily />

        <section className="rounded-[18px] bg-white/74 p-2 text-[#1d1d1f] shadow-[0_8px_20px_rgba(33,43,63,0.035)]">
          <div
            className={[
              "mb-1.5 flex items-center justify-between gap-2",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <p className="text-[12px] font-black text-[#111827]">כל האזורים</p>
            <p className="truncate text-[11px] font-semibold text-slate-600">
              קיצור נוח למה שלא מופיע בתחתית
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 min-[430px]:grid-cols-5">
            {areaShortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="flex min-h-11 items-center gap-2 rounded-2xl bg-[#fffdf8]/70 px-2 py-1.5 text-right text-[#111827] ring-1 ring-[#eadfcd]/55 transition hover:bg-[#fff8eb] active:scale-[0.99]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-[#fff8eb] text-[#8a5b16]">
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

        <section className="rounded-[20px] bg-white/82 p-2.5 text-[#1d1d1f] shadow-[0_10px_24px_rgba(33,43,63,0.04)]">
          <div
            className={[
              "mb-1.5 flex items-end justify-between gap-3",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <span className="rounded-full bg-[#fff8eb] px-2.5 py-1 text-[11px] font-black text-[#7a5212]">
              לפי צורך
            </span>
            <div>
              <p className="text-xs font-bold text-slate-600">ניווט מהיר</p>
              <h2 className="text-lg font-black text-[#111827] sm:text-xl">
                אזורי הבית
              </h2>
            </div>
          </div>

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

        <details className="rounded-[20px] bg-white/70 p-3 text-[#1d1d1f] shadow-[0_8px_22px_rgba(33,43,63,0.04)]">
          <summary
            className={[
              "flex cursor-pointer list-none items-center justify-between gap-4",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <span className="rounded-full border border-[#eadfcd] bg-[#fff8eb] px-2.5 py-1 text-[11px] font-bold text-[#7a5212]">
              {dashboardContent.modules.length} אזורים
            </span>
            <div>
              <p className="text-xs font-bold text-slate-600">עוד בבית</p>
              <h2 className="mt-1 text-sm font-black text-[#111827] sm:text-base">
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
      </div>
    </AppShell>
  );
}
