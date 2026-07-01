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
  "border-[#e6e8ec]",
  "border-emerald-100",
  "border-rose-100",
  "border-amber-100",
];

export default function FinanceSummaryCards({ cards }: FinanceSummaryCardsProps) {
  return (
    <section className="mb-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`rounded-[18px] border ${accents[index % accents.length]} bg-white p-3 text-right shadow-[0_10px_26px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="h-2 w-2 rounded-full bg-[#007aff]" />
            <p className="text-sm font-bold text-slate-500">{card.title}</p>
          </div>
          <p className={`text-2xl font-black tracking-tight ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  );
}
