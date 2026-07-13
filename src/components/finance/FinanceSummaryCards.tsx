type FinanceSummaryCard = {
  title: string;
  value: string;
  tone: string;
  subtitle: string;
};

type FinanceSummaryCardsProps = {
  cards: FinanceSummaryCard[];
};

export default function FinanceSummaryCards({ cards }: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 divide-[#e3d8c9]/60 rounded-2xl bg-[#fffdf8] ring-1 ring-[#e3d8c9]/70 sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
      {cards.map((card) => (
        <div key={card.title} className="p-2.5 text-right">
          <p className="text-[11px] font-bold text-slate-600">{card.title}</p>
          <p className={`mt-0.5 text-[15px] font-extrabold leading-5 ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4 text-slate-500">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
