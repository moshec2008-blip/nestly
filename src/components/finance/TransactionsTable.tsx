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
    ? "font-black text-emerald-200"
    : "font-black text-rose-200";
}

function getStatusClass(status: FinanceTransaction["status"]) {
  return status === "done"
    ? "w-fit rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100 transition hover:bg-emerald-400/15"
    : "w-fit rounded-full border border-[#d8b470]/24 bg-[#d8b470]/10 px-3 py-1 text-xs font-bold text-[#f4e7c8] transition hover:bg-[#d8b470]/15";
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
    <section className="rounded-[24px] bg-slate-800/58 p-3 text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1 text-[#d7cfbf]">
            {transactions.length} פעולות מוצגות
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-emerald-100">
            {summary.doneCount} בוצעו
          </span>
          <span className="rounded-full border border-[#d8b470]/24 bg-[#d8b470]/10 px-3 py-1 text-[#f4e7c8]">
            {summary.pendingCount} ממתינות
          </span>
        </div>

        <div className="text-right">
          <p className="mb-2 text-sm text-[#a9a295]">תנועות כספיות</p>
          <h2 className="text-lg font-black">פעולות אחרונות</h2>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgba(216,180,112,0.18)] bg-white/[0.04] p-8 text-center text-[#a9a295]">
          אין פעולות להצגה לפי הסינון הנוכחי.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-2.5 text-right text-sm font-bold md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-emerald-100">
              <p className="mb-1 text-xs text-emerald-200">הכנסות מוצגות</p>
              <p className="text-lg">{formatCurrency(summary.income)}</p>
            </div>

            <div className="rounded-2xl border border-[#b86f68]/20 bg-[#b86f68]/10 p-3 text-[#f0c6bd]">
              <p className="mb-1 text-xs text-rose-200">הוצאות מוצגות</p>
              <p className="text-lg">{formatCurrency(summary.expenses)}</p>
            </div>

            <div className="rounded-2xl border border-[rgba(216,180,112,0.18)] bg-white/[0.05] p-3 text-[#f4e7c8]">
              <p className="mb-1 text-xs text-[#a9a295]">יתרה מסוננת</p>
              <p className="text-lg">{formatCurrency(summary.balance)}</p>
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-[rgba(216,180,112,0.12)] md:block">
            <div className="grid grid-cols-8 bg-white/[0.055] px-4 py-3 text-right text-xs font-black text-[#a9a295]">
              <span>תאריך</span>
              <span className="col-span-2">פעולה</span>
              <span>קטגוריה</span>
              <span>סוג</span>
              <span>סטטוס</span>
              <span>סכום</span>
              <span>פעולות</span>
            </div>

            <div className="divide-y divide-[rgba(216,180,112,0.1)]">
              {displayedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-8 items-center px-4 py-4 text-right text-sm transition hover:bg-white/[0.035]"
                >
                  <span className="text-[#a9a295]">
                    {formatDate(transaction.date)}
                  </span>

                  <span className="col-span-2 font-bold text-[#fff9ea]">
                    {transaction.title}
                  </span>

                  <span className="text-[#d7cfbf]">{transaction.category}</span>

                  <span className="text-[#d7cfbf]">
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

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(transaction.id)}
                      className="rounded-xl border border-blue-300/20 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-100 transition hover:bg-blue-400/15"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100 transition hover:bg-rose-400/15"
                    >
                      מחיקה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {displayedTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="rounded-2xl border border-[rgba(216,180,112,0.12)] bg-white/[0.045] p-4 text-right text-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className={getAmountClass(transaction.type)}>
                    {getSignedAmount(transaction)}
                  </span>

                  <div>
                    <h3 className="font-black text-[#fff9ea]">
                      {transaction.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#a9a295]">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap justify-end gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[#d7cfbf]">
                    {transaction.category}
                  </span>
                  <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[#d7cfbf]">
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

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(transaction.id)}
                      className="rounded-xl border border-blue-300/20 bg-blue-400/10 px-3 py-2 text-xs font-bold text-blue-100"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100"
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
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.09]"
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
