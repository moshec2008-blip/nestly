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
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="nestly-card flex min-w-[110px] items-center justify-between rounded-2xl px-3 py-2.5 text-right"
        >
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black text-slate-600">
              {card.title}
            </p>
            <p className="text-lg font-black text-[#111827]">{card.value}</p>
          </div>
          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${card.accent}`} />
        </div>
      ))}
    </div>
  );
}
