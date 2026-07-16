"use client";

import AppShell from "@/components/layout/AppShell";
import HomeHero from "@/components/home/HomeHero";
import HomeQuickActions from "@/components/home/HomeQuickActions";
import ImportantToday from "@/components/home/ImportantToday";
import {
  HomeAreaCard,
  HomeSectionHeader,
  type HomeArea,
} from "@/components/home/HomeAreas";
import { useLanguage } from "@/i18n/useLanguage";

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
  const languageKey = language === "en" ? "en" : "he";
  const copy = sectionCopy[languageKey];
  const homeAreas = homeAreasByLanguage[languageKey];

  return (
    <AppShell>
      <div className="space-y-3.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] lg:space-y-4 lg:pb-0">
        <HomeHero />

        <HomeQuickActions />

        <ImportantToday />

        <section className="home-more-section rounded-[24px] border border-white/80 bg-gradient-to-br from-white/92 via-[#fffdf8]/92 to-white/82 p-3 shadow-[0_12px_30px_rgba(33,43,63,0.055)] ring-1 ring-[#eadfcd]/55">
          <HomeSectionHeader title={copy.title} subtitle={copy.subtitle} />
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
            {homeAreas.map((area) => (
              <HomeAreaCard key={area.href} area={area} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
