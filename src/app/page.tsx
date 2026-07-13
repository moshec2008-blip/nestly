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
    href: "/tasks",
    icon: "check",
    title: "משימות",
    subtitle: "משימות הבית",
    statFallback: "0 פתוחות",
    accentClass: "bg-amber-50 text-amber-600 ring-amber-100",
    tintClass: "bg-gradient-to-br from-amber-50/70 via-white to-white",
  },
  {
    href: "/finance",
    icon: "finance",
    title: "כספים",
    subtitle: "ניהול הכנסות והוצאות",
    statFallback: "0 ₪ יתרה",
    accentClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    tintClass: "bg-gradient-to-br from-emerald-50/70 via-white to-white",
  },
  {
    href: "/shopping",
    icon: "shopping",
    title: "קניות",
    subtitle: "רשימת הקניות",
    statFallback: "0 לקנייה",
    accentClass: "bg-sky-50 text-sky-600 ring-sky-100",
    tintClass: "bg-gradient-to-br from-sky-50/70 via-white to-white",
  },
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
    subtitle: "אירועים קרובים",
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
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.25rem)] lg:space-y-4 lg:pb-0">
        <HomeHero />

        <HomeQuickActions />

        <ImportantToday />

        <section>
          <HomeSectionHeader
            title="אזורי הבית"
            subtitle="כל מה שצריך לניהול המשפחה במקום אחד"
          />
          <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-4">
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
