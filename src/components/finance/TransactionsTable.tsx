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

type TransactionGroup = {
  id: string;
  label: string;
  transactions: FinanceTransaction[];
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
    month: "short",
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

function getSignedAmount(transaction: FinanceTransaction) {
  const sign = transaction.type === "income" ? "+" : "-";
  return `${sign}${formatCurrency(transaction.amount)}`;
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

function getCategoryIcon(transaction: FinanceTransaction) {
  const value = `${transaction.category} ${transaction.title}`;

  if (transaction.type === "income") {
    return "₪";
  }

  if (/דיור|שכירות|בית/.test(value)) {
    return "⌂";
  }

  if (/מזון|קניות|סופר/.test(value)) {
    return "◔";
  }

  if (/רכב|דלק|טיפול/.test(value)) {
    return "◈";
  }

  if (/חשבון|חשמל|מים|ביטוח/.test(value)) {
    return "▣";
  }

  return "•";
}

function getInsight(transaction: FinanceTransaction) {
  if (transaction.status === "pending") {
    return "לתשלום בקרוב";
  }

  if (transaction.reminderDate) {
    return "יש תזכורת";
  }

  if (transaction.amount >= 4000) {
    return "גבוה מהממוצע";
  }

  return null;
}

function getGroupId(transaction: FinanceTransaction) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transactionDate = new Date(transaction.date);
  transactionDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return "today";
  }

  if (diffDays > 0 && diffDays <= 7) {
    return "week";
  }

  return "earlier";
}

function groupTransactions(transactions: FinanceTransaction[]) {
  const groups: TransactionGroup[] = [
    { id: "today", label: "היום", transactions: [] },
    { id: "week", label: "השבוע", transactions: [] },
    { id: "earlier", label: "מוקדם יותר", transactions: [] },
  ];

  transactions.forEach((transaction) => {
    const group = groups.find((item) => item.id === getGroupId(transaction));
    group?.transactions.push(transaction);
  });

  return groups.filter((group) => group.transactions.length > 0);
}

function getAmountClass(type: FinanceTransaction["type"]) {
  return type === "income" ? "text-emerald-700" : "text-rose-700";
}

function ActionButton({
  children,
  onClick,
  tone = "secondary",
}: {
  children: string;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "danger";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[#111827] text-white hover:bg-[#1f2937]"
      : tone === "danger"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-[#e6e8ec] bg-white text-slate-700 hover:bg-[#fff8eb]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-2xl px-4 text-sm font-black transition ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function TransactionsTable({
  transactions,
  onDelete,
  onSave,
  onToggleStatus,
}: TransactionsTableProps) {
  const summary = useMemo(() => getTransactionsSummary(transactions), [transactions]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [menuTransactionId, setMenuTransactionId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [editValues, setEditValues] =
    useState<ReturnType<typeof getInitialEditValues> | null>(null);

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 8);
  const groupedTransactions = groupTransactions(displayedTransactions);
  const activeTransaction =
    transactions.find((transaction) => transaction.id === activeTransactionId) ??
    null;

  function openDetails(transaction: FinanceTransaction) {
    setActiveTransactionId(transaction.id);
    setMenuTransactionId(null);
  }

  function closeDetails() {
    setActiveTransactionId(null);
    setMenuTransactionId(null);
    cancelInlineEdit();
  }

  function startInlineEdit(transaction: FinanceTransaction) {
    setEditingTransactionId(transaction.id);
    setEditValues(getInitialEditValues(transaction));
    setActiveTransactionId(transaction.id);
    setMenuTransactionId(null);
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
    setActiveTransactionId(null);
  }

  function duplicateTransaction(transaction: FinanceTransaction) {
    onSave({
      ...transaction,
      id: crypto.randomUUID(),
      title: `${transaction.title} - עותק`,
      date: new Date().toISOString().slice(0, 10),
      status: "pending",
      reminderDate: transaction.reminderDate,
    });
    setActiveTransactionId(null);
    setMenuTransactionId(null);
  }

  return (
    <section className="rounded-[24px] bg-white/94 p-5 text-right shadow-[0_16px_38px_rgba(15,23,42,0.055)] ring-1 ring-[#edf0f3]/80">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#eef0f3]/80 pb-4">
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-[#e6e8ec] bg-white px-3 py-1.5 text-slate-500">
            {transactions.length} פעולות
          </span>
          {summary.pendingCount > 0 && (
            <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-amber-700">
              {summary.pendingCount} ממתינות
            </span>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            תנועות כספיות
          </p>
          <h2 className="text-base font-black text-[#111827]">פעולות אחרונות</h2>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#cbd5e1] bg-[#fafafb] p-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
            ₪
          </div>
          <p className="mt-3 text-base font-black text-[#111827]">
            עדיין אין פעולות להצגה
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-600">
            ברגע שתוסיף הכנסה או הוצאה, Nestly יסדר לך תמונה כספית פשוטה וברורה.
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-5">
            {groupedTransactions.map((group) => (
              <div key={group.id}>
                <p className="px-1 pb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                  {group.label}
                </p>

                <div className="divide-y divide-[#eef0f3]/80">
                  {group.transactions.map((transaction) => {
                    const isMenuOpen = menuTransactionId === transaction.id;
                    const insight = getInsight(transaction);

                    return (
                      <article key={transaction.id} className="relative">
                        <button
                          type="button"
                          onClick={() => openDetails(transaction)}
                          className="grid w-full grid-cols-[minmax(0,1fr)_minmax(8.75rem,max-content)] items-center gap-3 rounded-[18px] py-4 pl-10 pr-2 text-right transition hover:bg-[#fafafb] sm:grid-cols-[minmax(0,1fr)_minmax(9.75rem,max-content)]"
                        >
                          <div className="flex min-w-0 items-center justify-end gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-end gap-2">
                                {transaction.status === "pending" && (
                                   <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">
                                    {statusLabels[transaction.status]}
                                  </span>
                                )}
                                 <h3 className="truncate text-sm font-black text-[#0f172a]">
                                  {transaction.title}
                                </h3>
                              </div>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                                {transaction.category} · {formatDate(transaction.date)}
                                {insight ? ` · ${insight}` : ""}
                              </p>
                            </div>
                            <span
                              className={[
                                 "grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-xs font-black",
                                transaction.type === "income"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                  : "bg-slate-50 text-slate-600 ring-1 ring-slate-100",
                              ].join(" ")}
                              aria-hidden="true"
                            >
                              {getCategoryIcon(transaction)}
                            </span>
                          </div>

                          <span
                            dir="ltr"
                             className={`min-w-[8.75rem] shrink-0 whitespace-nowrap text-left text-base font-black tabular-nums leading-6 sm:min-w-40 ${getAmountClass(
                              transaction.type
                            )}`}
                          >
                            {getSignedAmount(transaction)}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuTransactionId((currentId) =>
                              currentId === transaction.id ? null : transaction.id
                            );
                          }}
                          className="absolute left-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-base font-black text-slate-400 transition hover:bg-[#fff8eb] hover:text-[#111827]"
                          aria-label={`פעולות עבור ${transaction.title}`}
                        >
                          ...
                        </button>

                        {isMenuOpen && (
                          <div className="absolute left-1 top-10 z-20 w-44 rounded-2xl border border-[#e6e8ec] bg-white p-1.5 text-right shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
                            <button
                              type="button"
                              onClick={() => openDetails(transaction)}
                              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
                            >
                              פרטים
                            </button>
                            <button
                              type="button"
                              onClick={() => startInlineEdit(transaction)}
                              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
                            >
                              עריכה
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleStatus(transaction.id)}
                              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
                            >
                              {transaction.status === "done" ? "פתח מחדש" : "סמן כבוצע"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(transaction.id)}
                              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
                            >
                              מחיקה
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eef0f3]/80 pt-4 pb-[calc(var(--nestly-safe-bottom-gap)+0.25rem)] sm:pb-0">
            <span className="text-xs font-bold text-slate-400">
              יתרה ברשימה: {formatCurrency(summary.balance)}
            </span>
            {transactions.length > 8 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllTransactions((currentValue) => !currentValue)
                }
                className="min-h-10 rounded-full border border-[#e6e8ec] bg-white px-4 text-xs font-black text-slate-700 hover:bg-[#fff8eb]"
              >
                {showAllTransactions
                  ? "הצג פחות"
                  : `הצג עוד ${transactions.length - 8}`}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-[26px] border border-[#e6d9c9] bg-white p-4 text-right text-[#111827] shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-3 border-b border-[#eef0f3] pb-3">
              <button
                type="button"
                onClick={closeDetails}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#e6e8ec] bg-white text-lg font-black text-slate-600"
                aria-label="סגור"
              >
                ×
              </button>

              <div className="min-w-0">
                <p className="text-xs font-black text-slate-500">
                  {activeTransaction.category} · {formatFullDate(activeTransaction.date)}
                </p>
                <h3 className="mt-1 truncate text-lg font-black text-[#111827]">
                  {activeTransaction.title}
                </h3>
              </div>
            </div>

            <div className="py-4 text-left">
              <p
                className={`text-3xl font-black tabular-nums ${getAmountClass(
                  activeTransaction.type
                )}`}
              >
                {getSignedAmount(activeTransaction)}
              </p>
              <p className="mt-1 text-right text-xs font-bold text-slate-500">
                {typeLabels[activeTransaction.type]} ·{" "}
                {statusLabels[activeTransaction.status]}
                {activeTransaction.reminderDate
                  ? ` · תזכורת ${formatFullDate(activeTransaction.reminderDate)}`
                  : ""}
              </p>
            </div>

            {editingTransactionId === activeTransaction.id && editValues ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  saveInlineEdit(activeTransaction);
                }}
                className="rounded-[18px] border border-[#eadfcd] bg-[#fffdf8] p-3"
              >
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
                      required
                    />
                  </label>
                  <label className={compactLabelClass}>
                    תאריך
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
                      תזכורת
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

                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <ActionButton onClick={cancelInlineEdit}>ביטול</ActionButton>
                  <button
                    type="submit"
                    className="min-h-11 rounded-2xl bg-[#111827] px-4 text-sm font-black text-white hover:bg-[#1f2937]"
                  >
                    שמור
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <ActionButton
                  tone="primary"
                  onClick={() => startInlineEdit(activeTransaction)}
                >
                  עריכה
                </ActionButton>
                <ActionButton onClick={() => duplicateTransaction(activeTransaction)}>
                  שכפול
                </ActionButton>
                <ActionButton onClick={() => onToggleStatus(activeTransaction.id)}>
                  {activeTransaction.status === "done" ? "פתח מחדש" : "סמן כבוצע"}
                </ActionButton>
                <ActionButton
                  tone="danger"
                  onClick={() => {
                    onDelete(activeTransaction.id);
                    closeDetails();
                  }}
                >
                  מחיקה
                </ActionButton>
                <button
                  type="button"
                  disabled
                  className="min-h-11 rounded-2xl border border-dashed border-[#d8b470] bg-[#fff8eb] px-4 text-sm font-black text-[#7a5212] opacity-70 sm:col-span-2"
                >
                  צירוף מסמך יתחבר בהמשך
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
