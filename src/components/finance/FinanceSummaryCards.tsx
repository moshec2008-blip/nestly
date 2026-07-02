type FinanceSummaryCard = {
  title: string;
  value: string;
  tone: string;
  subtitle: string;
};

type FinanceSummaryCardsProps = {
  cards: FinanceSummaryCard[];
};

const accents = [
  "bg-slate-900",
  "bg-emerald-500",
  "bg-rose-400",
  "bg-amber-400",
];

export default function FinanceSummaryCards({ cards }: FinanceSummaryCardsProps) {
  return (
    <section className="mb-2.5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="rounded-[16px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#fffdf8]"
        >
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className={`h-1.5 w-7 rounded-full ${accents[index % accents.length]}`} />
            <p className="text-xs font-bold text-slate-500">{card.title}</p>
          </div>
          <p className={`truncate text-lg font-black tracking-tight ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  );
}
