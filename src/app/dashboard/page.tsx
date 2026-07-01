"use client";

import ModuleCard from "@/components/ModuleCard";
import StatCard from "@/components/StatCard";
import DashboardLiveOverview from "@/components/dashboard/DashboardLiveOverview";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import { getDashboardContent } from "@/i18n/dashboardContent";
import { getDictionary } from "@/i18n/dictionaries";
import { getRouteLabel } from "@/i18n/navigation";
import { useLanguage } from "@/i18n/useLanguage";

export default function DashboardPage() {
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);
  const dashboardContent = getDashboardContent(language);

  return (
    <AppShell>
      <PageHero
        eyebrow={dictionary.dashboard.workspaceAreas}
        title={dictionary.nav.dashboard}
        description={dictionary.hero.description}
        showBackHome
        backLabel={dictionary.home}
      />

      <section className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardContent.stats.map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={item.value}
            note={item.note}
          />
        ))}
      </section>

      <DashboardLiveOverview />

      <section className="mt-3 rounded-[20px] border border-[#e6e8ec] bg-white p-3 text-[#1d1d1f] shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
        <div
          className={[
            "mb-3 flex items-end justify-between gap-4",
            direction === "rtl" ? "text-right" : "text-left",
          ].join(" ")}
        >
          <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {dictionary.dashboard.whatCanDo}
          </span>
          <div>
            <p className="text-xs font-bold text-slate-500">
              {dictionary.dashboard.modules}
            </p>
            <h2 className="mt-1 text-lg font-black text-[#1d1d1f]">
              {dictionary.nav.dashboard}
            </h2>
          </div>
        </div>

        <div className="grid gap-2 min-[380px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
    </AppShell>
  );
}
