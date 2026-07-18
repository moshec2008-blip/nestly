"use client";

import type { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";
import HomeHero from "@/components/home/HomeHero";
import HomeLifeEvents from "@/components/home/HomeLifeEvents";
import HomeQuickActions from "@/components/home/HomeQuickActions";
import ImportantToday from "@/components/home/ImportantToday";
import {
  HomeAreaCard,
  HomeSectionHeader,
  type HomeArea,
} from "@/components/home/HomeAreas";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useLanguage } from "@/i18n/useLanguage";
import type { HomeSectionId } from "@/types/personalization";

const homeAreasByLanguage: Record<"he" | "en", HomeArea[]> = {
  he: [
    {
      href: "/family",
      icon: "family",
      title: "משפחה",
      subtitle: "מידע משפחתי",
      statFallback: "0 רשומות",
      accentClass: "bg-violet-50 text-violet-600 ring-violet-100",
      tintClass: "bg-gradient-to-br from-violet-50/70 via-white to-white",
    },
    {
      href: "/documents",
      icon: "document",
      title: "מסמכים",
      subtitle: "מסמכים חשובים",
      statFallback: "0 מסמכים",
      accentClass: "bg-purple-50 text-purple-600 ring-purple-100",
      tintClass: "bg-gradient-to-br from-purple-50/70 via-white to-white",
    },
    {
      href: "/vehicles",
      icon: "car",
      title: "רכבים",
      subtitle: "טיפולים ותזכורות",
      statFallback: "0 תזכורות",
      accentClass: "bg-blue-50 text-blue-600 ring-blue-100",
      tintClass: "bg-gradient-to-br from-blue-50/70 via-white to-white",
    },
    {
      href: "/birthdays",
      icon: "calendar",
      title: "אירועים",
      subtitle: "ימי הולדת ואירועים",
      statFallback: "אין אירועים קרובים",
      accentClass: "bg-pink-50 text-pink-600 ring-pink-100",
      tintClass: "bg-gradient-to-br from-pink-50/70 via-white to-white",
    },
    {
      href: "/health",
      icon: "health",
      title: "בריאות",
      subtitle: "תורים ומעקב",
      statFallback: "0 פתוחים",
      accentClass: "bg-rose-50 text-rose-600 ring-rose-100",
      tintClass: "bg-gradient-to-br from-rose-50/70 via-white to-white",
    },
  ],
  en: [
    {
      href: "/family",
      icon: "family",
      title: "Family",
      subtitle: "People and roles",
      statFallback: "0 records",
      accentClass: "bg-violet-50 text-violet-600 ring-violet-100",
      tintClass: "bg-gradient-to-br from-violet-50/70 via-white to-white",
    },
    {
      href: "/documents",
      icon: "document",
      title: "Documents",
      subtitle: "Important files",
      statFallback: "0 documents",
      accentClass: "bg-purple-50 text-purple-600 ring-purple-100",
      tintClass: "bg-gradient-to-br from-purple-50/70 via-white to-white",
    },
    {
      href: "/vehicles",
      icon: "car",
      title: "Vehicles",
      subtitle: "Service and reminders",
      statFallback: "0 reminders",
      accentClass: "bg-blue-50 text-blue-600 ring-blue-100",
      tintClass: "bg-gradient-to-br from-blue-50/70 via-white to-white",
    },
    {
      href: "/birthdays",
      icon: "calendar",
      title: "Events",
      subtitle: "Birthdays and family dates",
      statFallback: "No upcoming events",
      accentClass: "bg-pink-50 text-pink-600 ring-pink-100",
      tintClass: "bg-gradient-to-br from-pink-50/70 via-white to-white",
    },
    {
      href: "/health",
      icon: "health",
      title: "Health",
      subtitle: "Care and appointments",
      statFallback: "0 open",
      accentClass: "bg-rose-50 text-rose-600 ring-rose-100",
      tintClass: "bg-gradient-to-br from-rose-50/70 via-white to-white",
    },
  ],
};

const sectionCopy = {
  he: {
    title: "עוד בבית",
    subtitle: "כל האזורים הפחות דחופים, במקום אחד",
  },
  en: {
    title: "More at home",
    subtitle: "Less urgent areas, all in one place",
  },
} as const;

export default function HomePage() {
  const { language } = useLanguage();
  const personalization = usePersonalization();
  const languageKey = language === "en" ? "en" : "he";
  const copy = sectionCopy[languageKey];
  const homeAreas = homeAreasByLanguage[languageKey];
  const visibleHomeSections = personalization.homeSections.filter(
    (section) => section.visible
  );
  const sectionRenderers: Record<HomeSectionId, ReactNode> = {
    quickActions: <HomeQuickActions />,
    importantToday: <ImportantToday />,
    moreAreas: (
      <section className="home-more-section w-full max-w-full overflow-hidden rounded-[24px] bg-white/58 p-3 shadow-[0_10px_26px_rgba(33,43,63,0.045)]">
        <HomeSectionHeader title={copy.title} subtitle={copy.subtitle} />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          {homeAreas.map((area) => (
            <HomeAreaCard key={area.href} area={area} />
          ))}
        </div>
      </section>
    ),
  };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-3 overflow-hidden pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] lg:space-y-4 lg:pb-0">
        <HomeHero />
        <HomeLifeEvents />

        {visibleHomeSections.map((section) => (
          <div key={section.id}>{sectionRenderers[section.id]}</div>
        ))}
      </div>
    </AppShell>
  );
}
