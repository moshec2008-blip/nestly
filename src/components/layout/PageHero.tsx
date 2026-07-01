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
    <section className="mb-3 overflow-hidden rounded-[20px] border border-[#e6e8ec] bg-white p-4 text-right text-[#1d1d1f] shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {showBackHome ? (
          <Link
            href="/"
            className="w-fit rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-[#007aff]"
          >
            {backLabel}
          </Link>
        ) : (
          <div />
        )}

        <div className="max-w-3xl">
          <Badge tone="neutral">{eyebrow}</Badge>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1d1d1f] md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
