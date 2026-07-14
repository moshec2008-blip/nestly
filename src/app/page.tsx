"use client";

import AppShell from "@/components/layout/AppShell";
import DemoEntryCard from "@/components/layout/DemoEntryCard";
import HomeHero from "@/components/home/HomeHero";
import HomeQuickActions from "@/components/home/HomeQuickActions";
import ImportantToday from "@/components/home/ImportantToday";
import {
  HomeAreaCard,
  HomeSectionHeader,
  type HomeArea,
} from "@/components/home/HomeAreas";

const homeAreas: HomeArea[] = [
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
    href: "/health",
    icon: "health",
    title: "בריאות",
    subtitle: "תורים ומעקב",
    statFallback: "0 פתוחים",
    accentClass: "bg-rose-50 text-rose-600 ring-rose-100",
    tintClass: "bg-gradient-to-br from-rose-50/70 via-white to-white",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-3.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] lg:space-y-4 lg:pb-0">
        <HomeHero />

        <HomeQuickActions />

        <ImportantToday />

        <section>
          <HomeSectionHeader
            title="עוד אזורים"
            subtitle="חלקים חשובים שלא צריכים להיות במרכז כל הזמן"
          />
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {homeAreas.map((area) => (
              <HomeAreaCard key={area.href} area={area} />
            ))}
          </div>
        </section>

        <DemoEntryCard />
      </div>
    </AppShell>
  );
}
