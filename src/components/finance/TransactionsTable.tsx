"use client";

import { useState } from "react";
import type { FinanceTransaction } from "@/data/finance";

type TransactionsTableProps = {
  transactions: FinanceTransaction[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
};

const typeLabels: Record<FinanceTransaction["type"], string> = {
  income: "הכנסה",
  expense: "הוצאה",
};

const statusLabels: Record<FinanceTransaction["status"], string> = {
  done: "בוצע",
  pending: "עתידי",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

function getAmountClass(type: FinanceTransaction["type"]) {
  return type === "income"
    ? "font-black text-emerald-700"
    : "font-black text-rose-700";
}

function getStatusClass(status: FinanceTransaction["status"]) {
  return status === "done"
    ? "rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-100"
    : "rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-800 transition hover:bg-amber-100";
}

function getSignedAmount(transaction: FinanceTransaction) {
  return `${transaction.type === "income" ? "+" : "-"}${formatCurrency(
    transaction.amount
  )}`;
}

export default function TransactionsTable({
  transactions,
  onDelete,
  onEdit,
  onToggleStatus,
}: TransactionsTableProps) {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 7);

  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-[11px] font-bold text-slate-600">
          {transactions.length} פעולות
        </span>
        <h2 className="text-sm font-black text-[#111827]">פעולות אחרונות</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#fafafb] p-5 text-center text-sm font-semibold text-slate-600">
          אין פעולות להצגה לפי הסינון הנוכחי.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-[#e6e8ec]">
          <div className="hidden grid-cols-[70px_minmax(150px,1.6fr)_minmax(90px,1fr)_70px_76px_92px_92px] bg-[#fafafb] px-3 py-2 text-right text-[11px] font-black text-slate-500 md:grid">
            <span>תאריך</span>
            <span>פעולה</span>
            <span>קטגוריה</span>
            <span>סוג</span>
            <span>סטטוס</span>
            <span>סכום</span>
            <span>פעולות</span>
          </div>

          <div className="divide-y divide-[#e6e8ec]">
            {displayedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid min-h-11 grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-2 text-right text-sm transition hover:bg-[#fffdf8] md:grid-cols-[70px_minmax(150px,1.6fr)_minmax(90px,1fr)_70px_76px_92px_92px] md:px-3 md:py-2"
              >
                <span className="text-xs font-semibold text-slate-500">
                  {formatDate(transaction.date)}
                </span>

                <div className="min-w-0">
                  <p className="truncate font-black text-[#111827]">
                    {transaction.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500 md:hidden">
                    {transaction.category} · {typeLabels[transaction.type]}
                  </p>
                </div>

                <span className="hidden truncate text-xs font-semibold text-slate-600 md:block">
                  {transaction.category}
                </span>

                <span className="hidden text-xs font-semibold text-slate-600 md:block">
                  {typeLabels[transaction.type]}
                </span>

                <button
                  type="button"
                  onClick={() => onToggleStatus(transaction.id)}
                  className={getStatusClass(transaction.status)}
                >
                  {statusLabels[transaction.status]}
                </button>

                <span className={`${getAmountClass(transaction.type)} text-left md:text-right`}>
                  {getSignedAmount(transaction)}
                </span>

                <div className="col-span-3 flex justify-end gap-1 md:col-span-1 md:justify-start">
                  <button
                    type="button"
                    onClick={() => onEdit(transaction.id)}
                    className="rounded-xl bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                  >
                    עריכה
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                    className="rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                  >
                    מחיקה
                  </button>
                </div>
              </div>
            ))}
          </div>

          {transactions.length > 7 && (
            <button
              type="button"
              onClick={() =>
                setShowAllTransactions((currentValue) => !currentValue)
              }
              className="w-full border-t border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 hover:bg-white"
            >
              {showAllTransactions
                ? "הצג פחות"
                : `הצג עוד ${transactions.length - 7}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
