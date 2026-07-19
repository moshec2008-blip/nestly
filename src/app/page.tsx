"use client";

import AppShell from "@/components/layout/AppShell";
import HomeDailyCommandCenter from "@/components/home/HomeDailyCommandCenter";
import {
  HomeAreaCard,
  HomeSectionHeader,
  type HomeArea,
} from "@/components/home/HomeAreas";
import { useLanguage } from "@/i18n/useLanguage";

const homeAreasByLanguage: Record<"he" | "en", HomeArea[]> = {
  he: [
    {
      href: "/shopping",
      icon: "shopping",
      title: "קניות",
      subtitle: "הרשימה המשותפת",
      statFallback: "הרשימה ריקה",
      accentClass: "bg-sky-50 text-sky-600 ring-sky-100",
      tintClass: "bg-gradient-to-br from-sky-50/70 via-white to-white",
    },
    {
      href: "/finance",
      icon: "finance",
      title: "כספים",
      subtitle: "הוצאות והכנסות",
      statFallback: "אין פעולות החודש",
      accentClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      tintClass: "bg-gradient-to-br from-emerald-50/70 via-white to-white",
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
      href: "/shopping",
      icon: "shopping",
      title: "Shopping",
      subtitle: "The shared list",
      statFallback: "List is empty",
      accentClass: "bg-sky-50 text-sky-600 ring-sky-100",
      tintClass: "bg-gradient-to-br from-sky-50/70 via-white to-white",
    },
    {
      href: "/finance",
      icon: "finance",
      title: "Finance",
      subtitle: "Spending and income",
      statFallback: "No activity this month",
      accentClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      tintClass: "bg-gradient-to-br from-emerald-50/70 via-white to-white",
    },
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
    title: "שאר הבית",
    subtitle: "כל מה שלא דחוף, מחכה כאן בשקט.",
  },
  en: {
    title: "The rest of home",
    subtitle: "Everything less urgent, waiting quietly.",
  },
} as const;

export default function HomePage() {
  const { language } = useLanguage();
  const languageKey = language === "en" ? "en" : "he";
  const copy = sectionCopy[languageKey];
  const homeAreas = homeAreasByLanguage[languageKey];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-6 overflow-hidden pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.5rem)] lg:space-y-7 lg:pb-0">
        <HomeDailyCommandCenter />

        <section className="home-more-section w-full max-w-full overflow-hidden">
          <HomeSectionHeader title={copy.title} subtitle={copy.subtitle} />
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {homeAreas.map((area) => (
              <HomeAreaCard key={area.href} area={area} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
