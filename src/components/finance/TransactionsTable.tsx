"use client";

import { useMemo, useState } from "react";
import type { FinanceTransaction } from "@/data/finance";

type TransactionsTableProps = {
  transactions: FinanceTransaction[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
};

type TransactionsSummary = {
  income: number;
  expenses: number;
  balance: number;
  doneCount: number;
  pendingCount: number;
};

const typeLabels: Record<FinanceTransaction["type"], string> = {
  income: "הכנסה",
  expense: "הוצאה",
};

const statusLabels: Record<FinanceTransaction["status"], string> = {
  done: "בוצע",
  pending: "ממתין",
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

function getTransactionsSummary(
  transactions: FinanceTransaction[]
): TransactionsSummary {
  return transactions.reduce(
    (summary, transaction) => {
      const isIncome = transaction.type === "income";
      const isDone = transaction.status === "done";

      return {
        income: summary.income + (isIncome ? transaction.amount : 0),
        expenses: summary.expenses + (!isIncome ? transaction.amount : 0),
        balance:
          summary.balance + (isIncome ? transaction.amount : -transaction.amount),
        doneCount: summary.doneCount + (isDone ? 1 : 0),
        pendingCount: summary.pendingCount + (!isDone ? 1 : 0),
      };
    },
    {
      income: 0,
      expenses: 0,
      balance: 0,
      doneCount: 0,
      pendingCount: 0,
    }
  );
}

function getAmountClass(type: FinanceTransaction["type"]) {
  return type === "income"
    ? "font-black text-emerald-600"
    : "font-black text-rose-600";
}

function getStatusClass(status: FinanceTransaction["status"]) {
  return status === "done"
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700"
    : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700";
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
  const summary = useMemo(() => getTransactionsSummary(transactions), [transactions]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 5);

  return (
    <section className="rounded-[20px] border border-[#e6e8ec] bg-white/95 p-2.5 text-right shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5 text-[11px] font-black">
          <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-slate-600">
            {transactions.length} פעולות
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
            {summary.doneCount} בוצעו
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
            {summary.pendingCount} ממתינות
          </span>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            תנועות כספיות
          </p>
          <h2 className="text-sm font-black text-[#111827]">פעולות אחרונות</h2>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#cbd5e1] bg-[#fafafb] p-6 text-center text-sm font-semibold text-slate-600">
          אין פעולות להצגה לפי הסינון הנוכחי.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">הכנסות</p>
              <p className="mt-1 text-sm font-black text-emerald-700">{formatCurrency(summary.income)}</p>
            </div>
            <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">הוצאות</p>
              <p className="mt-1 text-sm font-black text-rose-700">{formatCurrency(summary.expenses)}</p>
            </div>
            <div className="rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">יתרה</p>
              <p className="mt-1 text-sm font-black text-[#111827]">{formatCurrency(summary.balance)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {displayedTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-2.5 text-right"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={getAmountClass(transaction.type)}>
                        {getSignedAmount(transaction)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-[#111827]">
                          {transaction.title}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                          {formatDate(transaction.date)} · {transaction.category}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={getStatusClass(transaction.status)}>
                        {statusLabels[transaction.status]}
                      </span>
                      <span className="rounded-full border border-[#e6e8ec] bg-white px-2.5 py-1 text-[10px] font-black text-slate-600">
                        {typeLabels[transaction.type]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(transaction.id)}
                    className="min-h-[36px] rounded-full border border-[#e6e8ec] bg-white px-2.5 py-1 text-[11px] font-black text-slate-700"
                  >
                    {transaction.status === "done" ? "פתח מחדש" : "סיים"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(transaction.id)}
                    className="min-h-[36px] rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700"
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(transaction.id)}
                    className="min-h-[36px] rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700"
                  >
                    מחיקה
                  </button>
                </div>
              </article>
            ))}
          </div>

          {transactions.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllTransactions((currentValue) => !currentValue)}
              className="w-full rounded-full border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700"
            >
              {showAllTransactions
                ? "הצג פחות"
                : `הצג עוד ${transactions.length - 5}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
