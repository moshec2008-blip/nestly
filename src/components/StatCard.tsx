type StatCardProps = {
  title: string;
  value: string;
  note: string;
};

export default function StatCard({ title, value, note }: StatCardProps) {
  return (
    <div className="nestly-interactive group rounded-[16px] border border-[#eadfcd] bg-white p-2.5 text-right text-[#1d1d1f] shadow-[0_10px_24px_rgba(33,43,63,0.06)]">
      <div className="mb-1.5 h-1 w-7 rounded-full bg-gradient-to-l from-[#111827] via-[#007aff] to-[#d8b470]" />
      <p className="truncate text-[11px] font-bold text-slate-500 sm:text-xs">{title}</p>
      <p className="mt-1 truncate text-lg font-black tracking-tight text-[#1d1d1f]">
        {value}
      </p>
      <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{note}</p>
    </div>
  );
}
