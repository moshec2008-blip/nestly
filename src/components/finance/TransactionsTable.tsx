"use client";

import { useMemo, useState } from "react";
import DateInput from "@/components/ui/DateInput";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import RelatedItemsPanel from "@/components/relations/RelatedItemsPanel";
import SuggestedConnectionsPanel from "@/components/relations/SuggestedConnectionsPanel";
import type { FinanceTransaction } from "@/data/finance";
import {
  formatAccessibleSignedIlsCurrency,
  formatIlsCurrency,
  formatSignedIlsCurrency,
} from "@/utils/formatters";
import { createUuid } from "@/utils/ids";

type TransactionsTableProps = {
  transactions: FinanceTransaction[];
  onDelete: (id: string) => void;
  onSave: (transaction: FinanceTransaction) => void;
  onToggleStatus: (id: string) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  isLoading?: boolean;
};

type TransactionsSummary = {
  income: number;
  expenses: number;
  balance: number;
  doneCount: number;
  pendingCount: number;
};

type MonthlyTransactionGroup = {
  id: string;
  label: string;
  summary: TransactionsSummary;
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

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatMonthHeader(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 7)}-01`));
}

function formatDayHeader(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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
  return formatSignedIlsCurrency(transaction.amount, transaction.type);
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

type CategoryVisual = {
  icon: AppIconName;
  className: string;
};

function getCategoryVisual(transaction: FinanceTransaction): CategoryVisual {
  const value = `${transaction.category} ${transaction.title}`;

  if (transaction.type === "income") {
    return {
      icon: "finance",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    };
  }

  if (/דיור|שכירות|בית|משכנתא/.test(value)) {
    return {
      icon: "home",
      className: "bg-blue-50 text-blue-700 ring-blue-100",
    };
  }

  if (/מזון|קניות|סופר|חלב|ירקות/.test(value)) {
    return {
      icon: "shopping",
      className: "bg-sky-50 text-sky-700 ring-sky-100",
    };
  }

  if (/רכב|דלק|טיפול|טסט|ביטוח/.test(value)) {
    return {
      icon: "car",
      className: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    };
  }

  if (/חשבון|חשמל|מים|ביטוח/.test(value)) {
    return {
      icon: "document",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  }

  return {
    icon: "finance",
    className: "bg-slate-50 text-slate-600 ring-slate-100",
  };
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
function groupTransactionsByMonth(
  transactions: FinanceTransaction[]
): MonthlyTransactionGroup[] {
  const groups = new Map<string, FinanceTransaction[]>();

  [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((transaction) => {
      const monthKey = transaction.date.slice(0, 7);
      const existing = groups.get(monthKey) ?? [];
      existing.push(transaction);
      groups.set(monthKey, existing);
    });

  return Array.from(groups.entries()).map(([monthKey, monthTransactions]) => ({
    id: monthKey,
    label: formatMonthHeader(`${monthKey}-01`),
    summary: getTransactionsSummary(monthTransactions),
    transactions: monthTransactions,
  }));
}

function shouldShowDaySeparator(
  transaction: FinanceTransaction,
  previousTransaction?: FinanceTransaction
) {
  return !previousTransaction || previousTransaction.date !== transaction.date;
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
      ? "border border-[#d8caba] bg-[#fffdf8] text-[#111827] shadow-sm hover:bg-white hover:border-[#d8b470]"
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

function TransactionsSkeleton() {
  return (
    <section className="rounded-[24px] bg-white/94 p-3 text-right shadow-[0_16px_38px_rgba(15,23,42,0.055)] ring-1 ring-[#edf0f3]/80 sm:p-5">
      <div className="mb-3 flex items-center justify-between border-b border-[#eef0f3]/80 pb-3">
        <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="space-y-2">
          <div className="mr-auto h-3 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((month) => (
          <div key={month} className="overflow-hidden rounded-[20px] border border-[#edf0f3]">
            <div className="flex items-center justify-between bg-[#fffaf1] p-3">
              <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
              <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
            </div>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className="grid min-h-[66px] grid-cols-[minmax(0,1fr)_7rem_2.35rem] items-center gap-2 border-t border-[#eef0f3] px-2 py-2"
              >
                <div className="flex items-center justify-end gap-2.5">
                  <div className="space-y-2">
                    <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-3 w-36 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-100" />
                </div>
                <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TransactionsTable({
  transactions,
  onDelete,
  onSave,
  onToggleStatus,
  hasActiveFilters = false,
  onClearFilters,
  isLoading = false,
}: TransactionsTableProps) {
  const summary = useMemo(() => getTransactionsSummary(transactions), [transactions]);
  const [collapsedMonthIds, setCollapsedMonthIds] = useState<Set<string>>(
    () => new Set()
  );
  const [activeTransactionId, setActiveTransactionId] = useState<string | null>(null);
  const [menuTransactionId, setMenuTransactionId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [editValues, setEditValues] =
    useState<ReturnType<typeof getInitialEditValues> | null>(null);

  const groupedTransactions = useMemo(
    () => groupTransactionsByMonth(transactions),
    [transactions]
  );
  const activeTransaction =
    transactions.find((transaction) => transaction.id === activeTransactionId) ??
    null;

  if (isLoading) {
    return <TransactionsSkeleton />;
  }

  function toggleMonth(monthId: string) {
    setCollapsedMonthIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(monthId)) {
        nextIds.delete(monthId);
      } else {
        nextIds.add(monthId);
      }

      return nextIds;
    });
  }

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
      id: createUuid(),
      title: `${transaction.title} - עותק`,
      date: new Date().toISOString().slice(0, 10),
      status: "pending",
      reminderDate: transaction.reminderDate,
    });
    setActiveTransactionId(null);
    setMenuTransactionId(null);
  }

  return (
    <section className="rounded-[24px] bg-white/94 p-3 text-right shadow-[0_16px_38px_rgba(15,23,42,0.055)] ring-1 ring-[#edf0f3]/80 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0f3]/80 pb-3">
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
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm">
            <AppIcon name={hasActiveFilters ? "dashboard" : "finance"} className="h-6 w-6 text-emerald-700" />
          </div>
          <p className="mt-3 text-base font-black text-[#111827]">
            {hasActiveFilters ? "לא נמצאו פעולות מתאימות" : "עדיין אין פעולות להצגה"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-600">
            {hasActiveFilters
              ? "אפשר לנקות את הסינון ולראות שוב את כל הפעולות הכספיות."
              : "ברגע שתוסיף הכנסה או הוצאה, Nestly יסדר לך תמונה כספית פשוטה וברורה."}
          </p>
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 min-h-10 rounded-full border border-[#e6d8c6] bg-white px-4 text-xs font-black text-[#7a5212] transition hover:bg-[#fff8eb]"
            >
              נקה סינון
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="space-y-3">
            {groupedTransactions.map((month) => {
              const isCollapsed = collapsedMonthIds.has(month.id);

              return (
                <section
                  key={month.id}
                  className="overflow-hidden rounded-[22px] border border-[#edf0f3] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.035)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleMonth(month.id)}
                    className="sticky top-[calc(var(--nestly-header-offset,0px)+0.5rem)] z-10 flex w-full flex-col gap-2 bg-[#fffaf1]/95 px-3 py-2.5 text-right backdrop-blur sm:flex-row sm:items-center sm:justify-between"
                    aria-expanded={!isCollapsed}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-[#e6d8c6] bg-white text-sm font-black text-[#7a5212]">
                        {isCollapsed ? "+" : "−"}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-[#111827]">{month.label}</h3>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {month.transactions.length} פעולות
                        </p>
                      </div>
                    </div>

                    <div className="grid w-full grid-cols-3 gap-1.5 text-center text-[10px] font-black sm:w-auto sm:min-w-[22rem]">
                      <span className="truncate rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                        הכנסות <bdi className="whitespace-nowrap">{formatIlsCurrency(month.summary.income)}</bdi>
                      </span>
                      <span className="truncate rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                        הוצאות <bdi className="whitespace-nowrap">{formatIlsCurrency(month.summary.expenses)}</bdi>
                      </span>
                      <span className="truncate rounded-full bg-white px-2 py-1 text-slate-700 ring-1 ring-[#ece4d7]">
                        נטו <bdi className="whitespace-nowrap">{formatIlsCurrency(month.summary.balance)}</bdi>
                      </span>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-[#eef0f3]/80">
                      {month.transactions.map((transaction, index) => {
                        const previousTransaction = month.transactions[index - 1];
                        const showDaySeparator = shouldShowDaySeparator(
                          transaction,
                          previousTransaction
                        );
                        const isMenuOpen = menuTransactionId === transaction.id;
                        const insight = getInsight(transaction);
                        const categoryVisual = getCategoryVisual(transaction);

                        return (
                          <article key={transaction.id} className="relative">
                            {showDaySeparator && (
                              <div className="bg-[#fbfaf7] px-3 py-1.5 text-[10px] font-black text-slate-400">
                                {formatDayHeader(transaction.date)}
                              </div>
                            )}

                            <div
                              role="button"
                              tabIndex={0}
                              dir="rtl"
                              onClick={() => openDetails(transaction)}
                              onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") {
                                  return;
                                }

                                event.preventDefault();
                                openDetails(transaction);
                              }}
                              className="grid min-h-[58px] w-full cursor-pointer grid-cols-[2.25rem_minmax(0,1fr)_minmax(6.85rem,max-content)_2.15rem] items-center gap-2 px-2 py-1.5 text-right transition duration-200 hover:bg-[#fbfaf7] active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-[#8aa3c2]/35 sm:min-h-[62px] sm:grid-cols-[2.5rem_minmax(0,1fr)_minmax(7.5rem,max-content)_2.35rem] sm:gap-3 sm:px-3"
                            >
                              <span
                                className={[
                                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 sm:h-9 sm:w-9",
                                  categoryVisual.className,
                                ].join(" ")}
                                aria-hidden="true"
                              >
                                <AppIcon name={categoryVisual.icon} className="h-4 w-4" />
                              </span>

                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center justify-start gap-1.5">
                                  <h3 className="min-w-0 truncate text-sm font-black leading-5 text-[#0f172a]">
                                    {transaction.title}
                                  </h3>
                                  {transaction.status === "pending" && (
                                    <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-black text-amber-700">
                                      {statusLabels[transaction.status]}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-slate-400">
                                  {transaction.category}
                                  {insight ? ` · ${insight}` : ""}
                                </p>
                              </div>

                              <span
                                dir="ltr"
                                className="flex min-w-[6.85rem] shrink-0 items-center justify-start overflow-visible text-left [unicode-bidi:isolate] sm:min-w-[7.5rem]"
                              >
                                <span
                                  dir="ltr"
                                  className={`shrink-0 whitespace-nowrap text-left text-[14px] font-black tabular-nums leading-5 tracking-[-0.01em] sm:text-base ${getAmountClass(
                                    transaction.type
                                  )}`}
                                  aria-label={formatAccessibleSignedIlsCurrency(
                                    transaction.amount,
                                    transaction.type
                                  )}
                                >
                                  {getSignedAmount(transaction)}
                                </span>
                              </span>

                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setMenuTransactionId((currentId) =>
                                    currentId === transaction.id
                                      ? null
                                      : transaction.id
                                  );
                                }}
                                onKeyDown={(event) => {
                                  if (event.key !== "Enter" && event.key !== " ") {
                                    return;
                                  }

                                  event.preventDefault();
                                  event.stopPropagation();
                                  setMenuTransactionId((currentId) =>
                                    currentId === transaction.id
                                      ? null
                                      : transaction.id
                                  );
                                }}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-base font-black text-slate-500 transition hover:bg-[#fff8eb] hover:text-[#111827] sm:h-9 sm:w-9"
                                aria-label={`פעולות עבור ${transaction.title}`}
                              >
                                <span aria-hidden="true" className="text-xl leading-none">
                                  ⋯
                                </span>
                              </span>
                            </div>

                            {isMenuOpen && (
                              <div className="absolute left-1 top-12 z-20 w-44 rounded-2xl border border-[#e6e8ec] bg-white p-1.5 text-right shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
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
                                  onClick={() => duplicateTransaction(transaction)}
                                  className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
                                >
                                  שכפול
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
                  )}
                </section>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-[18px] border border-[#ece4d7] bg-[#fffaf1] px-3 py-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1.35rem)] sm:flex-row sm:items-center sm:justify-between sm:pb-2.5">
            <span className="text-xs font-black text-slate-600">
              יתרה ברשימה:{" "}
              <span
                dir="ltr"
                className="inline-block whitespace-nowrap text-base text-[#111827] [unicode-bidi:isolate]"
              >
                {formatIlsCurrency(summary.balance)}
              </span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              {groupedTransactions.length} חודשים מוצגים
            </span>
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
                dir="ltr"
                className={`whitespace-nowrap text-3xl font-black tabular-nums [unicode-bidi:isolate] ${getAmountClass(
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

            <div className="mb-3 grid gap-2">
              <SuggestedConnectionsPanel
                entity={{
                  entityType: "finance_transaction",
                  entityId: activeTransaction.id,
                }}
              />
              <RelatedItemsPanel
                entity={{
                  entityType: "finance_transaction",
                  entityId: activeTransaction.id,
                }}
                compact
              />
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
                    className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-sm hover:bg-white hover:border-[#d8b470]"
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
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}






