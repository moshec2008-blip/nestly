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
    <div className="grid grid-cols-2 divide-[#e3d8c9]/45 rounded-[22px] bg-[#fffdf8]/85 shadow-[0_10px_24px_rgba(33,43,63,0.04)] ring-1 ring-[#e3d8c9]/55 sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
      {cards.map((card) => (
        <div key={card.title} className="p-4 text-right">
          <p className="text-xs font-bold text-slate-400">{card.title}</p>
          <p className={`mt-1 text-base font-black leading-6 ${card.tone}`}>
            {card.value}
          </p>
          <p className="mt-1 line-clamp-1 text-xs font-semibold leading-4 text-slate-400">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
