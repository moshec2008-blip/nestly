import type { FinanceTransaction } from "@/data/finance";
import {
  formatHebrewDateLabel,
  formatIlsCurrency,
} from "@/utils/formatters";

type FinanceReminderDialogProps = {
  transaction: FinanceTransaction | null;
  onDismiss: () => void;
  onComplete: () => void;
};

export default function FinanceReminderDialog({
  transaction,
  onDismiss,
  onComplete,
}: FinanceReminderDialogProps) {
  if (!transaction) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="finance-reminder-title"
        className="w-full max-w-md rounded-[28px] border border-[#e6d9c9] bg-white p-5 text-right text-[#111827] shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
      >
        <p className="text-xs font-black text-[#9a6b17]">תזכורת כספית</p>
        <h2 id="finance-reminder-title" className="mt-1 text-2xl font-black">
          הגיע הזמן לטפל בפעולה
        </h2>

        <div className="mt-4 rounded-[20px] border border-[#e6e8ec] bg-[#fafafb] p-4">
          <p className="text-lg font-black">{transaction.title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {transaction.category} · {formatIlsCurrency(transaction.amount)}
          </p>
          {transaction.reminderDate && (
            <p className="mt-2 text-xs font-bold text-slate-500">
              תאריך תזכורת: {formatHebrewDateLabel(transaction.reminderDate)}
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-white"
          >
            הזכר לי מחר
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 py-2 text-sm font-black text-[#111827] shadow-sm transition hover:bg-white hover:border-[#d8b470]"
          >
            סמן כבוצע
          </button>
        </div>
      </section>
    </div>
  );
}
