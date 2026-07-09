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
          className={[
            "rounded-[18px] border p-3 text-right shadow-[0_12px_28px_rgba(33,43,63,0.065)]",
            index === 0
              ? "border-[#d8b470]/45 bg-gradient-to-br from-[#111827] to-[#243044] text-white"
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
                "text-[10px] font-black uppercase tracking-[0.14em]",
                index === 0 ? "text-white/75" : "text-slate-600",
              ].join(" ")}
            >
              {card.title}
            </p>
          </div>
          <p
            className={[
              "mt-2 font-black leading-6",
              index === 0 ? "text-xl text-white" : `text-base ${card.tone}`,
            ].join(" ")}
          >
            {card.value}
          </p>
          <p
            className={[
              "mt-1 text-[11px] font-semibold leading-4",
              index === 0 ? "text-white/72" : "text-slate-600",
            ].join(" ")}
          >
            {card.subtitle}
          </p>
        </div>
      ))}
    </section>
  );
}
