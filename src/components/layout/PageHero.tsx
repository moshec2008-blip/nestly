import Link from "next/link";
import Badge from "@/components/ui/Badge";

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
  backLabel = "חזרה לבית",
}: PageHeroProps) {
  return (
    <section className="nestly-card relative mb-3 overflow-hidden rounded-[20px] p-3 text-right text-[#1d1d1f]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-[#111827] via-[#007aff] to-[#d8b470]" />
      <div className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-[#007aff]/5 blur-3xl" />
      <div className="relative flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        {showBackHome ? (
          <Link
            href="/"
            className="w-fit rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3.5 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-[#007aff]"
          >
            {backLabel}
          </Link>
        ) : (
          <div />
        )}

        <div className="max-w-3xl">
          <Badge tone="neutral">{eyebrow}</Badge>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-[#1d1d1f] md:text-2xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
