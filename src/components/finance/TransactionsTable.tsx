"use client";

import { useMemo, useState } from "react";
import DateInput from "@/components/ui/DateInput";
import type { FinanceTransaction } from "@/data/finance";

type TransactionsTableProps = {
  transactions: FinanceTransaction[];
  onDelete: (id: string) => void;
  onSave: (transaction: FinanceTransaction) => void;
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

const compactInputClass =
  "min-h-10 w-full rounded-xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none";

const compactLabelClass = "text-xs font-black text-slate-600";

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

function formatFullDate(date: string) {
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

function getInitialEditValues(transaction: FinanceTransaction) {
  return {
    title: transaction.title,
    category: transaction.category,
    amount: String(transaction.amount),
    date: transaction.date,
    type: transaction.type,
    status: transaction.status,
    reminderDate: transaction.reminderDate ?? "",
  };
}

export default function TransactionsTable({
  transactions,
  onDelete,
  onSave,
  onToggleStatus,
}: TransactionsTableProps) {
  const summary = useMemo(() => getTransactionsSummary(transactions), [transactions]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [editValues, setEditValues] =
    useState<ReturnType<typeof getInitialEditValues> | null>(null);
  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 5);

  function startInlineEdit(transaction: FinanceTransaction) {
    setEditingTransactionId(transaction.id);
    setEditValues(getInitialEditValues(transaction));
  }

  function cancelInlineEdit() {
    setEditingTransactionId(null);
    setEditValues(null);
  }

  function saveInlineEdit(transaction: FinanceTransaction) {
    if (!editValues) {
      return;
    }

    const cleanTitle = editValues.title.trim();
    const cleanCategory = editValues.category.trim();
    const amount = Number(editValues.amount);

    if (!cleanTitle || !cleanCategory || amount <= 0 || !editValues.date) {
      return;
    }

    onSave({
      ...transaction,
      title: cleanTitle,
      category: cleanCategory,
      amount,
      date: editValues.date,
      type: editValues.type,
      status: editValues.status,
      reminderDate:
        editValues.status === "pending" && editValues.reminderDate
          ? editValues.reminderDate
          : undefined,
    });
    cancelInlineEdit();
  }

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
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                הכנסות
              </p>
              <p className="mt-1 text-sm font-black text-emerald-700">
                {formatCurrency(summary.income)}
              </p>
            </div>
            <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
                הוצאות
              </p>
              <p className="mt-1 text-sm font-black text-rose-700">
                {formatCurrency(summary.expenses)}
              </p>
            </div>
            <div className="rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-2.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                יתרה
              </p>
              <p className="mt-1 text-sm font-black text-[#111827]">
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {displayedTransactions.map((transaction) => {
              const isEditing = editingTransactionId === transaction.id && editValues;

              return (
                <article
                  key={transaction.id}
                  className="rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-2.5 text-right"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`${getAmountClass(transaction.type)} shrink-0 text-sm`}>
                      {getSignedAmount(transaction)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black text-[#111827]">
                        {transaction.title}
                      </h3>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                        {formatDate(transaction.date)} · {transaction.category}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
                    <span className={getStatusClass(transaction.status)}>
                      {statusLabels[transaction.status]}
                    </span>
                    <span className="rounded-full border border-[#e6e8ec] bg-white px-2.5 py-1 text-[10px] font-black text-slate-600">
                      {typeLabels[transaction.type]}
                    </span>
                    {transaction.reminderDate && transaction.status === "pending" && (
                      <span className="rounded-full border border-[#d8b470] bg-[#fff8eb] px-2.5 py-1 text-[10px] font-black text-[#7a5212]">
                        תזכורת: {formatFullDate(transaction.reminderDate)}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveInlineEdit(transaction);
                      }}
                      className="mt-2 rounded-[16px] border border-[#d8b470] bg-[#fffdf8] p-3 shadow-inner"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#eadfcd] pb-2">
                        <span className="rounded-full bg-[#111827] px-3 py-1 text-[11px] font-black text-white">
                          עריכת פעולה
                        </span>
                        <p className="min-w-0 truncate text-sm font-black text-[#111827]">
                          {transaction.title}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={compactLabelClass}>
                          שם פעולה
                          <input
                            value={editValues.title}
                            onChange={(event) =>
                              setEditValues((currentValues) =>
                                currentValues
                                  ? { ...currentValues, title: event.target.value }
                                  : currentValues
                              )
                            }
                            className={`mt-1 ${compactInputClass}`}
                            placeholder="שם הפעולה"
                            required
                          />
                        </label>
                        <label className={compactLabelClass}>
                          קטגוריה
                          <input
                            value={editValues.category}
                            onChange={(event) =>
                              setEditValues((currentValues) =>
                                currentValues
                                  ? { ...currentValues, category: event.target.value }
                                  : currentValues
                              )
                            }
                            className={`mt-1 ${compactInputClass}`}
                            placeholder="קטגוריה"
                            required
                          />
                        </label>
                        <label className={compactLabelClass}>
                          סכום
                          <input
                            value={editValues.amount}
                            onChange={(event) =>
                              setEditValues((currentValues) =>
                                currentValues
                                  ? { ...currentValues, amount: event.target.value }
                                  : currentValues
                              )
                            }
                            className={`mt-1 ${compactInputClass}`}
                            type="number"
                            min="1"
                            inputMode="decimal"
                            placeholder="סכום"
                            required
                          />
                        </label>
                        <label className={compactLabelClass}>
                          תאריך פעולה
                          <DateInput
                            value={editValues.date}
                            onChange={(date) =>
                              setEditValues((currentValues) =>
                                currentValues ? { ...currentValues, date } : currentValues
                              )
                            }
                            required
                            label="תאריך פעולה"
                            className="mt-1"
                            inputClassName={compactInputClass}
                            buttonClassName="min-h-10 rounded-xl border border-[#d9dde5] bg-white px-3 text-xs font-black text-slate-700"
                          />
                        </label>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        <label className={compactLabelClass}>
                          סוג
                          <select
                            value={editValues.type}
                            onChange={(event) =>
                              setEditValues((currentValues) =>
                                currentValues
                                  ? {
                                      ...currentValues,
                                      type: event.target.value as FinanceTransaction["type"],
                                    }
                                  : currentValues
                              )
                            }
                            className={`mt-1 ${compactInputClass}`}
                          >
                            <option value="expense">הוצאה</option>
                            <option value="income">הכנסה</option>
                          </select>
                        </label>
                        <label className={compactLabelClass}>
                          סטטוס
                          <select
                            value={editValues.status}
                            onChange={(event) =>
                              setEditValues((currentValues) =>
                                currentValues
                                  ? {
                                      ...currentValues,
                                      status:
                                        event.target.value as FinanceTransaction["status"],
                                      reminderDate:
                                        event.target.value === "pending"
                                          ? currentValues.reminderDate || currentValues.date
                                          : "",
                                    }
                                  : currentValues
                              )
                            }
                            className={`mt-1 ${compactInputClass}`}
                          >
                            <option value="done">בוצע</option>
                            <option value="pending">פעולה עתידית</option>
                          </select>
                        </label>
                        {editValues.status === "pending" && (
                          <label className={compactLabelClass}>
                            תאריך תזכורת
                            <DateInput
                              value={editValues.reminderDate}
                              onChange={(reminderDate) =>
                                setEditValues((currentValues) =>
                                  currentValues
                                    ? { ...currentValues, reminderDate }
                                    : currentValues
                                )
                              }
                              label="תאריך תזכורת"
                              className="mt-1"
                              inputClassName={compactInputClass}
                              buttonClassName="min-h-10 rounded-xl border border-[#d9dde5] bg-white px-3 text-xs font-black text-slate-700"
                            />
                          </label>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-[#eadfcd] pt-2">
                        <button
                          type="button"
                          onClick={cancelInlineEdit}
                          className="min-h-11 rounded-full border border-[#e6e8ec] bg-[#fafafb] px-3 text-[11px] font-black text-slate-700"
                        >
                          ביטול
                        </button>
                        <button
                          type="submit"
                          className="min-h-11 rounded-full bg-[#111827] px-4 text-[11px] font-black text-white"
                        >
                          שמור
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(transaction.id)}
                        className="min-h-11 rounded-full border border-[#e6e8ec] bg-white px-3 text-[11px] font-black text-slate-700"
                      >
                        {transaction.status === "done" ? "פתח מחדש" : "סיים"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startInlineEdit(transaction)}
                        className="min-h-11 rounded-full border border-[#d8b470] bg-[#fff8eb] px-3 text-[11px] font-black text-[#111827] shadow-sm transition hover:bg-[#f7e7c3]"
                      >
                        עריכה
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(transaction.id)}
                        className="min-h-11 rounded-full border border-rose-200 bg-rose-50 px-3 text-[11px] font-black text-rose-700"
                      >
                        מחיקה
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
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
