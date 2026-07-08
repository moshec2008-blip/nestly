type TaskStatCard = {
  title: string;
  value: number;
  accent: string;
};

type TaskStatsProps = {
  cards: TaskStatCard[];
};

export default function TaskStats({ cards }: TaskStatsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="flex min-w-[110px] flex-1 items-center justify-between rounded-2xl border border-[#e6e8ec] bg-white px-2.5 py-2 text-right shadow-[0_6px_16px_rgba(15,23,42,0.04)]"
        >
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black text-slate-500">
              {card.title}
            </p>
            <p className="text-sm font-black text-[#111827]">{card.value}</p>
          </div>
          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${card.accent}`} />
        </div>
      ))}
    </div>
  );
}

