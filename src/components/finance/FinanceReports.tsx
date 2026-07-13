import CategoryReport from "@/components/finance/CategoryReport";
import FinanceChart from "@/components/finance/FinanceChart";
import MonthlyCashflow from "@/components/finance/MonthlyCashflow";
import SmartFinanceSummary from "@/components/finance/SmartFinanceSummary";
import type {
  CategoryReportItem,
  MonthlyCashflowItem,
  SmartFinanceInsight,
} from "@/data/finance";

type FinanceReportsProps = {
  insights: SmartFinanceInsight[];
  categoryReportItems: CategoryReportItem[];
  monthlyCashflowItems: MonthlyCashflowItem[];
};

export default function FinanceReports({
  insights,
  categoryReportItems,
  monthlyCashflowItems,
}: FinanceReportsProps) {
  return (
    <div className="space-y-2.5">
      <SmartFinanceSummary insights={insights} />
      <CategoryReport items={categoryReportItems} />
      <FinanceChart items={monthlyCashflowItems} />
      <details className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
        <summary className="cursor-pointer list-none text-sm font-bold text-[#111827]">
          תזרים חודשי מלא
        </summary>
        <div className="mt-3">
          <MonthlyCashflow items={monthlyCashflowItems} />
        </div>
      </details>
    </div>
  );
}
