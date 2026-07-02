"use client";

import { LinkButton } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { getDictionary } from "@/i18n/dictionaries";
import { useLanguage } from "@/i18n/useLanguage";

export default function Header() {
  const { direction, language } = useLanguage();
  const dictionary = getDictionary(language);

  return (
    <header
      className={[
        "rounded-[20px] border border-[#e6e8ec] bg-white p-2.5 text-[#1d1d1f] shadow-[0_10px_26px_rgba(15,23,42,0.045)] md:p-3",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="flex flex-col gap-2.5">
        <div className="min-w-0">
          <div
            className={[
              "flex flex-wrap items-center gap-2",
              direction === "rtl" ? "justify-end" : "justify-start",
            ].join(" ")}
          >
            <Badge
              tone="blue"
              className="border-[#111827] bg-[#111827] text-white"
            >
              {dictionary.hero.badge}
            </Badge>
            <h1 className="truncate text-xl font-black tracking-tight md:text-2xl">
              {dictionary.appName}
            </h1>
          </div>

          <div
            className={[
              "mt-2 flex flex-wrap gap-2",
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
