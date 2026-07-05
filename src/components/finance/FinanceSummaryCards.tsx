type FinanceSummaryCard = {
  title: string;
  value: string;
  tone: string;
  subtitle: string;
};

type FinanceSummaryCardsProps = {
  cards: FinanceSummaryCard[];
};

const accentClasses = [
  "bg-slate-900",
  "bg-emerald-500",
  "bg-rose-400",
  "bg-amber-400",
];

export default function FinanceSummaryCards({ cards }: FinanceSummaryCardsProps) {
  return (
    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="rounded-[18px] border border-[#e6e8ec] bg-white/95 p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.035)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                accentClasses[index % accentClasses.length]
              }`}
              aria-hidden="true"
            />
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              {card.title}
            </p>
          </div>
          <p className={`mt-2 text-base font-black leading-6 ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  );
}
