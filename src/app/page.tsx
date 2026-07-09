"use client";

import Header from "@/components/Header";
import ModuleCard from "@/components/ModuleCard";
import StatCard from "@/components/StatCard";
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
    "/finance",
    "/tasks",
    "/shopping",
    "/documents",
    "/birthdays",
    "/family",
    "/health",
    "/vehicles",
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

        <section className="nestly-card rounded-[22px] p-3 text-[#1d1d1f]">
          <div
            className={[
              "mb-3 flex items-end",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <div>
              <p className="text-xs font-bold text-slate-600">
                ניווט מהיר לפי מה שצריך עכשיו
              </p>
              <h2 className="text-lg font-black text-[#111827] sm:text-xl">
                אזורי הבית המרכזיים
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

        <details className="nestly-card rounded-[20px] p-3 text-[#1d1d1f]">
          <summary
            className={[
              "flex cursor-pointer list-none items-center justify-between gap-4",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <span className="rounded-full border border-[#eadfcd] bg-[#fff8eb] px-2.5 py-1 text-[11px] font-bold text-[#7a5212]">
              {dashboardContent.modules.length} {dictionary.dashboard.modules}
            </span>
            <div>
              <p className="text-xs font-bold text-slate-600">
                מדדים ואזורים נוספים
              </p>
              <h2 className="mt-1 text-sm font-black text-[#111827] sm:text-base">
                לפתיחה לפי צורך
              </h2>
            </div>
          </summary>

          <div className="premium-details-panel mt-2.5 space-y-2.5">
            <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {dashboardContent.stats.map((item) => (
                <StatCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  note={item.note}
                />
              ))}
            </section>

            {secondaryModules.length > 0 && (
              <section className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:grid-cols-4">
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
          </div>
        </details>

        <DashboardLiveOverview />
      </div>
    </AppShell>
  );
}
