"use client";

import AppShell from "@/components/layout/AppShell";
import DemoEntryCard from "@/components/layout/DemoEntryCard";
import HomeSummaryCard from "@/components/home/HomeSummaryCard";
import ImportantToday from "@/components/home/ImportantToday";
import {
  AreaShortcutCard,
  HomeAreaCard,
  HomeSectionHeader,
  type AreaShortcut,
  type HomeArea,
} from "@/components/home/HomeAreas";

const areaShortcuts: AreaShortcut[] = [
  {
    href: "/birthdays",
    icon: "calendar",
    title: "אירועים",
    accentClass: "bg-pink-50 text-pink-600 ring-pink-100",
  },
  {
    href: "/family",
    icon: "family",
    title: "משפחה",
    accentClass: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    href: "/vehicles",
    icon: "car",
    title: "רכב",
    accentClass: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  {
    href: "/documents",
    icon: "document",
    title: "מסמכים",
    accentClass: "bg-purple-50 text-purple-600 ring-purple-100",
  },
  {
    href: "/health",
    icon: "health",
    title: "בריאות",
    accentClass: "bg-rose-50 text-rose-600 ring-rose-100",
  },
];

const homeAreas: HomeArea[] = [
  {
    href: "/tasks",
    icon: "check",
    title: "משימות",
    subtitle: "משימות הבית",
    statFallback: "0 פתוחות",
    accentClass: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    href: "/finance",
    icon: "finance",
    title: "כספים",
    subtitle: "ניהול הכנסות והוצאות",
    statFallback: "0 ₪ יתרה",
    accentClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    href: "/shopping",
    icon: "shopping",
    title: "קניות",
    subtitle: "רשימת הקניות",
    statFallback: "0 לקנייה",
    accentClass: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    href: "/family",
    icon: "family",
    title: "משפחה",
    subtitle: "מידע משפחתי",
    statFallback: "0 רשומות",
    accentClass: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    href: "/documents",
    icon: "document",
    title: "מסמכים",
    subtitle: "מסמכים חשובים",
    statFallback: "0 מסמכים",
    accentClass: "bg-purple-50 text-purple-600 ring-purple-100",
  },
  {
    href: "/vehicles",
    icon: "car",
    title: "רכבים",
    subtitle: "טיפולים ותזכורות",
    statFallback: "0 תזכורות",
    accentClass: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  {
    href: "/birthdays",
    icon: "calendar",
    title: "אירועים",
    subtitle: "אירועים קרובים",
    statFallback: "אין אירועים קרובים",
    accentClass: "bg-pink-50 text-pink-600 ring-pink-100",
  },
  {
    href: "/health",
    icon: "health",
    title: "בריאות",
    subtitle: "תורים ומעקב",
    statFallback: "0 פתוחים",
    accentClass: "bg-rose-50 text-rose-600 ring-rose-100",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-4 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.25rem)] lg:space-y-5 lg:pb-0">
        <HomeSummaryCard />

        <ImportantToday />

        <section className="rounded-[22px] border border-[#eadfcd]/80 bg-white/82 p-4 text-[#1d1d1f] shadow-[0_10px_26px_rgba(33,43,63,0.05)]">
          <HomeSectionHeader
            title="כל האזורים"
            subtitle="קיצורים לאזורים שלא תמיד מופיעים בניווט התחתון"
          />
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 min-[430px]:grid min-[430px]:grid-cols-5 min-[430px]:overflow-visible">
            {areaShortcuts.map((shortcut) => (
              <AreaShortcutCard key={shortcut.href} shortcut={shortcut} />
            ))}
          </div>
        </section>

        <section className="rounded-[22px] border border-[#eadfcd]/80 bg-white/86 p-4 text-[#1d1d1f] shadow-[0_10px_26px_rgba(33,43,63,0.05)]">
          <HomeSectionHeader
            title="אזורי הבית"
            subtitle="כל מה שצריך לניהול המשפחה במקום אחד"
            action={
              <span className="rounded-full bg-[#fff8eb] px-2.5 py-1 text-[11px] font-black text-[#7a5212]">
                ניווט מהיר
              </span>
            }
          />
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
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
