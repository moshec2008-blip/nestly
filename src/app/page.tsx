"use client";

import Header from "@/components/Header";
import ModuleCard from "@/components/ModuleCard";
import StatCard from "@/components/StatCard";
import DashboardLiveOverview from "@/components/dashboard/DashboardLiveOverview";
import AppShell from "@/components/layout/AppShell";
import { getDashboardContent } from "@/i18n/dashboardContent";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";

export default function HomePage() {
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);
  const dashboardContent = getDashboardContent(language);
  const primaryStats = dashboardContent.stats.slice(0, 2);

  return (
    <AppShell>
      <div className="space-y-3">
        <Header />

        <div className="grid gap-2.5 xl:grid-cols-[240px_minmax(0,1fr)]">
          <section className="grid grid-cols-2 gap-2 xl:grid-cols-1">
            {primaryStats.map((item) => (
              <StatCard
                key={item.title}
                title={item.title}
                value={item.value}
                note={item.note}
              />
            ))}
          </section>

          <DashboardLiveOverview />
        </div>

        <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-[#1d1d1f] shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div
            className={[
              "mb-2.5 flex items-end justify-between gap-4",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {dashboardContent.modules.length} {dictionary.dashboard.modules}
            </span>
            <div>
              <p className="text-xs font-bold text-slate-500">
                {dictionary.dashboard.workspaceAreas}
              </p>
              <h2 className="mt-1 text-base font-black sm:text-lg">
                {dictionary.dashboard.whatCanDo}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {dashboardContent.modules.map((module) => (
              <ModuleCard
                key={module.href}
                title={getRouteLabel(module.href, dictionary)}
                description={module.description}
                href={module.href}
                status={module.status}
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
