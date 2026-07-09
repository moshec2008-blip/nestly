"use client";

import { LinkButton } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/dictionaries";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";

export default function Header() {
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);

  return (
    <header
      className={[
        "nestly-hero rounded-[22px] p-3 text-[#1d1d1f]",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="relative z-10 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div
            className={[
              "flex flex-wrap items-center gap-2",
              direction === "rtl" ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <span className="nestly-eyebrow">היום במשפחה</span>
            <h1 className="text-xl font-extrabold tracking-tight text-[#111827] md:text-2xl">
              מה צריך תשומת לב עכשיו
            </h1>
          </div>

          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            {brand.productName} מרכזת את המשימות, הכספים, הקניות והתזכורות
            החשובות של הבית במקום אחד רגוע.
          </p>

          <div
            className={[
              "mt-2.5 flex flex-wrap gap-2",
              direction === "rtl" ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <LinkButton href="/dashboard" tone="primary">
              {dictionary.hero.dailyReview}
            </LinkButton>
            <LinkButton href="/tasks" tone="secondary">
              {dictionary.hero.tasks}
            </LinkButton>
            <LinkButton href="/finance" tone="ghost">
              {dictionary.hero.finance}
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
