import CategoryReport from "@/components/finance/CategoryReport";
import MonthlyCashflow from "@/components/finance/MonthlyCashflow";
import type {
  CategoryReportItem,
  MonthlyCashflowItem,
} from "@/data/finance";

type FinanceReportsProps = {
  categoryReportItems: CategoryReportItem[];
  monthlyCashflowItems: MonthlyCashflowItem[];
};

export default function FinanceReports({
  categoryReportItems,
  monthlyCashflowItems,
}: FinanceReportsProps) {
  return (
    <div className="space-y-2.5">
      <CategoryReport items={categoryReportItems} />
      <details className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right text-[#111827] shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
        <summary className="cursor-pointer list-none text-sm font-black">
          תזרים חודשי מלא
        </summary>
        <div className="mt-3">
          <MonthlyCashflow items={monthlyCashflowItems} />
        </div>
      </details>
    </div>
  );
}
