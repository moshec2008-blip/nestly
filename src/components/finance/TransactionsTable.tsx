"use client";

import { useState } from "react";
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
    year: "numeric",
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
    ? "font-black text-emerald-700"
    : "font-black text-rose-700";
}

function getStatusClass(status: FinanceTransaction["status"]) {
  return status === "done"
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
    : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800 transition hover:bg-amber-100";
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
  const summary = getTransactionsSummary(transactions);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 5);

  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-3 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="mb-2.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          <span className="rounded-full border border-[#e6e8ec] bg-[#fafafb] px-2.5 py-1 text-slate-600">
            {transactions.length} פעולות
          </span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-emerald-800">
            {summary.doneCount} בוצעו
          </span>
          <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-amber-800">
            {summary.pendingCount} ממתינות
          </span>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-500">תנועות כספיות</p>
          <h2 className="text-sm font-black text-[#111827]">
            פעולות אחרונות
          </h2>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#fafafb] p-6 text-center text-sm font-semibold text-slate-600">
          אין פעולות להצגה לפי הסינון הנוכחי.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 text-right text-xs font-bold md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-2 text-emerald-800">
              <p className="text-[11px] text-emerald-700">הכנסות מוצגות</p>
              <p className="mt-0.5 text-sm font-black">
                {formatCurrency(summary.income)}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-2 text-rose-800">
              <p className="text-[11px] text-rose-700">הוצאות מוצגות</p>
              <p className="mt-0.5 text-sm font-black">
                {formatCurrency(summary.expenses)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] p-2 text-slate-800">
              <p className="text-[11px] text-slate-500">יתרה מסוננת</p>
              <p className="mt-0.5 text-sm font-black">
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-[16px] border border-[#e6e8ec] md:block">
            <div className="grid grid-cols-8 bg-[#fafafb] px-3 py-2 text-right text-[11px] font-black text-slate-500">
              <span>תאריך</span>
              <span className="col-span-2">פעולה</span>
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
                  className="grid grid-cols-8 items-center px-3 py-2.5 text-right text-sm transition hover:bg-[#fffdf8]"
                >
                  <span className="text-xs font-semibold text-slate-500">
                    {formatDate(transaction.date)}
                  </span>

                  <span className="col-span-2 truncate font-black text-[#111827]">
                    {transaction.title}
                  </span>

                  <span className="truncate text-xs font-semibold text-slate-600">
                    {transaction.category}
                  </span>

                  <span className="text-xs font-semibold text-slate-600">
                    {typeLabels[transaction.type]}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleStatus(transaction.id)}
                    className={getStatusClass(transaction.status)}
                  >
                    {statusLabels[transaction.status]}
                  </button>

                  <span className={getAmountClass(transaction.type)}>
                    {getSignedAmount(transaction)}
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(transaction.id)}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      className="rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            {displayedTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] p-3 text-right text-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className={getAmountClass(transaction.type)}>
                    {getSignedAmount(transaction)}
                  </span>

                  <div>
                    <h3 className="font-black text-[#111827]">
                      {transaction.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap justify-end gap-1.5 text-xs font-bold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                    {transaction.category}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                    {typeLabels[transaction.type]}
                  </span>
                </div>

                <div className="flex flex-wrap justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(transaction.id)}
                    className={getStatusClass(transaction.status)}
                  >
                    {statusLabels[transaction.status]}
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(transaction.id)}
                      className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {transactions.length > 5 && (
            <button
              type="button"
              onClick={() =>
                setShowAllTransactions((currentValue) => !currentValue)
              }
              className="w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-white"
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
