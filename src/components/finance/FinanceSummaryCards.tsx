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
    <section className="flex flex-wrap items-center justify-end gap-x-1 gap-y-1 rounded-[14px] border border-[#ebe4d8] bg-[#fffdf8] px-2 py-1.5 shadow-[0_6px_16px_rgba(33,43,63,0.035)] xl:flex-nowrap">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="flex min-h-8 min-w-[138px] flex-1 items-center justify-end gap-2 rounded-xl px-2 py-1 text-right transition hover:bg-white"
        >
          <p className={`truncate text-sm font-black leading-5 ${card.tone}`}>
            {card.value}
          </p>
          <p className="shrink-0 text-[11px] font-bold leading-4 text-slate-500">
            {card.title}
          </p>
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              accentClasses[index % accentClasses.length]
            }`}
            aria-hidden="true"
          />
        </div>
      ))}
    </section>
  );
}
