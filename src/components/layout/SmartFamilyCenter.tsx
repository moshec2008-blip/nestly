"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { useLanguage } from "@/i18n/useLanguage";
import {
  getDailyFocus,
  getFamilyActivityFeed,
  getOrganizationScore,
  getTodayAttentionItems,
  type DailyFocus,
  type FamilyActivity,
  type IntelligenceTone,
  type OrganizationScore,
  type TodayAttentionItem,
} from "@/services/familyIntelligence";

function toneClass(tone: IntelligenceTone) {
  if (tone === "danger") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (tone === "warning") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (tone === "good") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  return "bg-sky-50 text-sky-700 ring-sky-100";
}

const copy = {
  he: {
    title: "מרכז היום",
    subtitle: "רק מה שכדאי לראות עכשיו.",
    focus: "פעולה מומלצת",
    today: "דורש תשומת לב",
    calm: "אין פריטים דחופים כרגע.",
    score: "מצב משפחתי",
    activity: "פעילות אחרונה",
    emptyActivity: "עדיין אין פעילות משמעותית להצגה.",
  },
  en: {
    title: "Today Center",
    subtitle: "Only what is worth seeing now.",
    focus: "Recommended action",
    today: "Needs attention",
    calm: "No urgent items right now.",
    score: "Family calm",
    activity: "Recent activity",
    emptyActivity: "No meaningful activity to show yet.",
  },
} as const;

export default function SmartFamilyCenter() {
  const { language, direction } = useLanguage();
  const languageKey = language === "en" ? "en" : "he";
  const text = copy[languageKey];
  const [isEnabled, setIsEnabled] = useState(false);
  const [focus, setFocus] = useState<DailyFocus | null>(null);
  const [items, setItems] = useState<TodayAttentionItem[]>([]);
  const [activity, setActivity] = useState<FamilyActivity[]>([]);
  const [score, setScore] = useState<OrganizationScore | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1536px)");

    function updateEnabledState() {
      setIsEnabled(mediaQuery.matches);
    }

    updateEnabledState();
    mediaQuery.addEventListener("change", updateEnabledState);

    return () => mediaQuery.removeEventListener("change", updateEnabledState);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFocus(getDailyFocus(language));
      setItems(getTodayAttentionItems(language));
      setActivity(getFamilyActivityFeed(language));
      setScore(getOrganizationScore(language));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isEnabled, language]);

  if (!isEnabled) {
    return null;
  }

  return (
    <aside
      className={[
        "hidden w-60 shrink-0 self-start rounded-[24px] border border-white/80 bg-white/90 p-3 shadow-[0_16px_42px_rgba(33,43,63,0.08)] backdrop-blur 2xl:block",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="rounded-[20px] border border-[#ebe4d8] bg-gradient-to-br from-[#fff8eb] to-[#f7f9fd] p-3 shadow-sm">
        <p className="text-[11px] font-bold text-[#007aff]">{text.title}</p>
        <h2 className="mt-1 text-base font-black text-[#111827]">
          {text.focus}
        </h2>
        <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
          {text.subtitle}
        </p>
      </div>

      {focus && (
        <Link
          href={focus.href}
          className="mt-2 block rounded-[20px] border border-white/80 bg-[#fffdf8] p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.09)]"
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ring-1 ${toneClass(
                focus.tone
              )}`}
            >
              <AppIcon name={focus.icon} className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#111827]">{focus.title}</p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                {focus.description}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs font-black text-[#7a5212]">
            {focus.actionLabel}
          </p>
        </Link>
      )}

      {score && (
        <div className="mt-2 rounded-[20px] border border-white/80 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${toneClass(
                score.tone
              )}`}
            >
              {score.label}
            </span>
            <p className="text-xs font-black text-slate-950">{text.score}</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-gradient-to-l from-emerald-300 to-sky-300"
              style={{ width: `${score.score}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-600">
            {score.description}
          </p>
        </div>
      )}

      <div className="mt-2 rounded-[20px] border border-white/80 bg-[#fffdf8] p-2.5 shadow-sm">
        <p className="mb-2 text-xs font-black text-slate-950">{text.today}</p>
        <div className="space-y-1.5">
          {items.length > 0 ? (
            items.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl bg-white p-2.5 transition hover:bg-[#fff8eb]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${toneClass(
                      item.tone
                    )}`}
                  >
                    {item.statusLabel}
                  </span>
                  <p className="min-w-0 truncate text-xs font-black text-slate-950">
                    {item.title}
                  </p>
                </div>
                <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
                  {item.description}
                </p>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl bg-white p-3 text-xs font-semibold text-slate-500">
              {text.calm}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 rounded-[20px] border border-white/80 bg-white p-2.5 shadow-sm">
        <p className="mb-2 text-xs font-black text-slate-950">{text.activity}</p>
        <div className="space-y-1.5">
          {activity.length > 0 ? (
            activity.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-2xl p-2 transition hover:bg-[#fff8eb]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                  <AppIcon name={item.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-black text-slate-950">
                    {item.title}
                  </span>
                  <span className="block truncate text-[10px] font-semibold text-slate-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl bg-[#fafafb] p-3 text-xs font-semibold text-slate-500">
              {text.emptyActivity}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
