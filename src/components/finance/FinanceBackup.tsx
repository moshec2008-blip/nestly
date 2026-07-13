import ExportTransactionsButton from "@/components/finance/ExportTransactionsButton";
import ImportTransactionsButton from "@/components/finance/ImportTransactionsButton";
import JsonBackupControls from "@/components/finance/JsonBackupControls";
import type { FinanceTransaction } from "@/data/finance";

type FinanceBackupProps = {
  transactions: FinanceTransaction[];
  onImport: (transactions: FinanceTransaction[]) => void;
  onRestore: (transactions: FinanceTransaction[]) => void;
  onClearAll: () => void;
};

export default function FinanceBackup({
  transactions,
  onImport,
  onRestore,
  onClearAll,
}: FinanceBackupProps) {
  return (
    <section className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right text-[#111827] shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
      <div className="mb-3">
        <p className="mb-2 text-sm font-bold text-slate-600">ניהול נתונים</p>
        <h2 className="text-xl font-black">גיבוי, שחזור וייבוא</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          פעולות מתקדמות לניהול המידע: ייבוא, ייצוא, גיבוי ושחזור.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <ImportTransactionsButton onImport={onImport} />
        <ExportTransactionsButton transactions={transactions} />
        <JsonBackupControls transactions={transactions} onRestore={onRestore} />
        <button
          type="button"
          onClick={onClearAll}
          className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
        >
          מחיקת כל הנתונים
        </button>
      </div>
    </section>
  );
}

