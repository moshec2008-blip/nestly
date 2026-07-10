"use client";

import Header from "@/components/Header";
import ModuleCard from "@/components/ModuleCard";
import DashboardLiveOverview from "@/components/dashboard/DashboardLiveOverview";
import TodayForFamily from "@/components/dashboard/TodayForFamily";
import AppShell from "@/components/layout/AppShell";
import { getDashboardContent } from "@/i18n/dashboardContent";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";

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
      <div className="space-y-3">
        <Header />
        <TodayForFamily />

        <section className="rounded-[22px] bg-white/82 p-3 text-[#1d1d1f] shadow-[0_10px_28px_rgba(33,43,63,0.045)]">
          <div
            className={[
              "mb-2 flex items-end justify-between gap-3",
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
