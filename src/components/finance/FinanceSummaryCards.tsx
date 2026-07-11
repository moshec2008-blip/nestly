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
    <section className="grid grid-cols-2 gap-1.5 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={[
            "rounded-[16px] border p-2.5 text-right shadow-[0_8px_20px_rgba(33,43,63,0.045)]",
            index === 0
              ? "finance-balance-card border-[#d8b470]/55 bg-gradient-to-br from-[#fff8eb] to-white text-[#111827] shadow-[0_10px_24px_rgba(154,107,23,0.1)]"
              : "border-[#eadfcd] bg-white/95 text-[#111827]",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                accentClasses[index % accentClasses.length]
              }`}
              aria-hidden="true"
            />
            <p
              className={[
                "text-[10px] font-black uppercase tracking-[0.08em]",
                index === 0 ? "text-[#7a5212]" : "text-slate-600",
              ].join(" ")}
            >
              {card.title}
            </p>
          </div>
          <p
            className={[
              "mt-1 font-black leading-5",
              index === 0 ? "text-lg text-[#111827]" : `text-[15px] ${card.tone}`,
            ].join(" ")}
          >
            {card.value}
          </p>
          <p
            className={[
              "mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4",
              index === 0 ? "text-slate-700" : "text-slate-600",
            ].join(" ")}
          >
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  );
}
