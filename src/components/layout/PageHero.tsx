"use client";

import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { useLanguage } from "@/i18n/useLanguage";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  showBackHome?: boolean;
  backLabel?: string;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  showBackHome = false,
  backLabel,
}: PageHeroProps) {
  const { language, direction } = useLanguage();
  const resolvedBackLabel =
    backLabel ?? (language === "en" ? "Back home" : "חזרה לבית");

  return (
    <section
      className={[
        "relative mb-3 overflow-hidden rounded-[26px] border border-white/80 bg-white/95 p-5 text-[#1d1d1f] shadow-[0_18px_42px_rgba(33,43,63,0.085)] ring-1 ring-[#eadfcd]/65 backdrop-blur-xl",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <span
        className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-sky-100/40 blur-2xl"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -bottom-14 right-1 h-32 w-32 rounded-full bg-emerald-100/30 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {showBackHome ? (
          <LinkButton href="/" tone="ghost" size="sm" className="w-fit">
            {resolvedBackLabel}
          </LinkButton>
        ) : (
          <div />
        )}

        <div className="max-w-3xl">
          <Badge tone="neutral" size="md" withDot>
            {eyebrow}
          </Badge>
          <h1 className="mt-2 text-[25px] font-black leading-8 tracking-tight text-[#0f172a] md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
