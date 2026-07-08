import FinanceChart from "@/components/finance/FinanceChart";
import MonthlyCashflow from "@/components/finance/MonthlyCashflow";
import SmartFinanceSummary from "@/components/finance/SmartFinanceSummary";
import type {
  MonthlyCashflowItem,
  SmartFinanceInsight,
} from "@/data/finance";

type FinanceOverviewProps = {
  insights: SmartFinanceInsight[];
  monthlyCashflowItems: MonthlyCashflowItem[];
};

export default function FinanceOverview({
  insights,
  monthlyCashflowItems,
}: FinanceOverviewProps) {
  return (
    <div className="grid gap-2.5 xl:grid-cols-[minmax(0,420px)_1fr]">
      <SmartFinanceSummary insights={insights} />
      <details className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right text-[#111827] shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="rounded-full bg-[#fff8eb] px-3 py-1 text-xs font-black text-[#9a6b17]">
            פתיחה לפי צורך
          </span>
          <span className="text-sm font-black">גרפים ותזרים</span>
        </summary>
        <div className="mt-2.5 space-y-2.5">
          <FinanceChart items={monthlyCashflowItems} />
          <details className="rounded-[18px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
            <summary className="cursor-pointer list-none text-sm font-black text-slate-900">
              תזרים חודשי מפורט
            </summary>
            <div className="mt-2.5">
              <MonthlyCashflow items={monthlyCashflowItems} />
            </div>
          </details>
        </div>
      </details>
    </div>
  );
}

