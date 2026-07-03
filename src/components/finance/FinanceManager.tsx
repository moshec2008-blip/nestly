"use client";

import { useMemo, useState } from "react";
import AddTransactionForm from "@/components/finance/AddTransactionForm";
import BudgetOverview from "@/components/finance/BudgetOverview";
import CategoryReport from "@/components/finance/CategoryReport";
import ExportTransactionsButton from "@/components/finance/ExportTransactionsButton";
import FinanceChart from "@/components/finance/FinanceChart";
import FinanceFilters, {
  type TransactionStatusFilter,
  type TransactionTypeFilter,
} from "@/components/finance/FinanceFilters";
import FinanceQuickActions from "@/components/finance/FinanceQuickActions";
import FinanceSummaryCards from "@/components/finance/FinanceSummaryCards";
import FinanceTabs, { type FinanceTab } from "@/components/finance/FinanceTabs";
import ImportTransactionsButton from "@/components/finance/ImportTransactionsButton";
import JsonBackupControls from "@/components/finance/JsonBackupControls";
import MonthSelector from "@/components/finance/MonthSelector";
import MonthlyCashflow from "@/components/finance/MonthlyCashflow";
import SmartFinanceSummary from "@/components/finance/SmartFinanceSummary";
import TransactionsTable from "@/components/finance/TransactionsTable";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  getBudgetReport,
  getExpenseCategoryReport,
  getFinanceStats,
  getMonthlyCashflowReport,
  getSmartFinanceInsights,
  initialFinanceTransactions,
  type FinanceTransaction,
} from "@/data/finance";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getAvailableMonths(transactions: FinanceTransaction[]) {
  return Array.from(
    new Set(
      transactions
        .map((item) => item.date.slice(0, 7))
        .filter((month) => month.length === 7)
    )
  ).sort((a, b) => b.localeCompare(a));
}

export default function FinanceManager() {
  const { confirm, toast } = useFeedback();
  const [transactions, setTransactions] =
    usePersistentArrayState<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions
    );

  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FinanceTab>("transactions");
  const [activeMonth, setActiveMonth] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<TransactionStatusFilter>("all");

  const availableMonths = useMemo(
    () => getAvailableMonths(transactions),
    [transactions]
  );

  const activeMonthTransactions = useMemo(() => {
    if (activeMonth === "all") {
      return transactions;
    }

    return transactions.filter((item) => item.date.startsWith(activeMonth));
  }, [transactions, activeMonth]);

  const stats = useMemo(
    () => getFinanceStats(activeMonthTransactions),
    [activeMonthTransactions]
  );

  const smartInsights = useMemo(
    () => getSmartFinanceInsights(activeMonthTransactions),
    [activeMonthTransactions]
  );

  const monthlyCashflowItems = useMemo(
    () => getMonthlyCashflowReport(transactions),
    [transactions]
  );

  const budgetReportItems = useMemo(
    () => getBudgetReport(activeMonthTransactions),
    [activeMonthTransactions]
  );

  const categoryReportItems = useMemo(
    () => getExpenseCategoryReport(activeMonthTransactions),
    [activeMonthTransactions]
  );

  const editingTransaction = useMemo(() => {
    if (!editingTransactionId) {
      return null;
    }

    return transactions.find((item) => item.id === editingTransactionId) ?? null;
  }, [transactions, editingTransactionId]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...activeMonthTransactions]
      .filter((item) => typeFilter === "all" || item.type === typeFilter)
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.category.toLowerCase().includes(normalizedSearch) ||
          item.date.includes(normalizedSearch)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activeMonthTransactions, searchValue, typeFilter, statusFilter]);

  const exportTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const financeCards = [
    {
      title: "יתרה",
      value: formatCurrency(stats.balance),
      tone: "text-[#111827]",
      subtitle: "הכנסות פחות הוצאות",
    },
    {
      title: "הכנסות",
      value: formatCurrency(stats.income),
      tone: "text-emerald-700",
      subtitle: "בתקופה הנבחרת",
    },
    {
      title: "הוצאות",
      value: formatCurrency(stats.expenses),
      tone: "text-rose-700",
      subtitle: "בתקופה הנבחרת",
    },
    {
      title: "פעולות עתידיות",
      value: `${stats.pendingPayments} פעולות`,
      tone: "text-amber-700",
      subtitle: "תשלומים או הכנסות שעדיין לא בוצעו",
    },
  ];

  function openTransactionsTab() {
    setActiveTab("transactions");
  }

  function handleStartAddTransaction() {
    setEditingTransactionId(null);
    setIsTransactionFormOpen(true);
    openTransactionsTab();
  }

  function handleSaveTransaction(transaction: FinanceTransaction) {
    setTransactions((currentTransactions) => {
      const exists = currentTransactions.some(
        (item) => item.id === transaction.id
      );

      if (!exists) {
        return [transaction, ...currentTransactions];
      }

      return currentTransactions.map((item) =>
        item.id === transaction.id ? transaction : item
      );
    });

    setEditingTransactionId(null);
    setIsTransactionFormOpen(false);
    openTransactionsTab();
    toast({
      title: "הפעולה נשמרה",
      description: transaction.title,
      tone: "success",
    });
  }

  function handleImportTransactions(importedTransactions: FinanceTransaction[]) {
    setTransactions((currentTransactions) => [
      ...importedTransactions,
      ...currentTransactions,
    ]);

    setEditingTransactionId(null);
    setIsTransactionFormOpen(false);
    handleClearFilters();
    openTransactionsTab();
    toast({
      title: "הייבוא הושלם",
      description: `${importedTransactions.length} פעולות נוספו לכספים.`,
      tone: "success",
    });
  }

  function handleRestoreTransactions(restoredTransactions: FinanceTransaction[]) {
    setTransactions(restoredTransactions);
    setEditingTransactionId(null);
    setIsTransactionFormOpen(false);
    setActiveMonth("all");
    handleClearFilters();
    setActiveTab("transactions");
    toast({
      title: "הגיבוי שוחזר",
      description: `${restoredTransactions.length} פעולות נטענו מחדש.`,
      tone: "success",
    });
  }

  async function handleDeleteTransaction(id: string) {
    const transactionToDelete = transactions.find((item) => item.id === id);
    const transactionTitle = transactionToDelete?.title ?? "הפעולה הזו";

    const approved = await confirm({
      title: "מחיקת פעולה",
      description: `למחוק את "${transactionTitle}"? אי אפשר לשחזר את הפעולה אחרי המחיקה.`,
      confirmLabel: "מחק פעולה",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setTransactions((currentTransactions) =>
      currentTransactions.filter((item) => item.id !== id)
    );

    if (editingTransactionId === id) {
      setEditingTransactionId(null);
      setIsTransactionFormOpen(false);
    }

    toast({
      title: "הפעולה נמחקה",
      description: transactionTitle,
      tone: "info",
    });
  }

  function handleEditTransaction(id: string) {
    setEditingTransactionId(id);
    setIsTransactionFormOpen(true);
    openTransactionsTab();
  }

  function handleCancelEdit() {
    setEditingTransactionId(null);
    setIsTransactionFormOpen(false);
  }

  function handleToggleStatus(id: string) {
    setTransactions((currentTransactions) =>
      currentTransactions.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "pending" : "done" }
          : item
      )
    );
  }

  async function handleResetDemoData() {
    const approved = await confirm({
      title: "איפוס לנתוני דמו",
      description: "הנתונים הנוכחיים יוחלפו בנתוני הדמו.",
      confirmLabel: "אפס לדמו",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setTransactions(initialFinanceTransactions);
    setEditingTransactionId(null);
    setIsTransactionFormOpen(false);
    setActiveMonth("all");
    handleClearFilters();
    setActiveTab("transactions");
    toast({
      title: "נתוני הדמו נטענו",
      tone: "success",
    });
  }

  async function handleClearAllTransactions() {
    const approved = await confirm({
      title: "מחיקת כל הפעולות",
      description: "הפעולה הזו תרוקן לגמרי את מסך הכספים.",
      confirmLabel: "מחק הכל",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setTransactions([]);
    setEditingTransactionId(null);
    setIsTransactionFormOpen(false);
    setActiveMonth("all");
    handleClearFilters();
    setActiveTab("transactions");
    toast({
      title: "כל הפעולות נמחקו",
      tone: "warning",
    });
  }

  function handleClearFilters() {
    setSearchValue("");
    setTypeFilter("all");
    setStatusFilter("all");
  }

  return (
    <section className="space-y-2.5">
      <section className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <button
                type="button"
                onClick={handleStartAddTransaction}
                className="min-h-10 w-full rounded-2xl bg-[#111827] px-4 py-2 text-sm font-black text-white shadow-[0_12px_28px_rgba(17,24,39,0.14)] transition hover:-translate-y-0.5 hover:bg-[#1f2937] md:w-auto"
              >
                + הוסף פעולה
              </button>

              <div>
                <p className="text-xs font-bold text-[#007aff]">מרכז כספים</p>
                <h2 className="mt-1 text-lg font-black text-[#111827]">
                  איפה אנחנו אוחזים החודש
                </h2>
                <p className="hidden">
                  תצוגה קצרה, פעולה מהירה, ואז פירוט רק כשצריך.
                </p>
              </div>
            </div>

            <FinanceSummaryCards cards={financeCards} />
          </div>

          <div className="shrink-0 xl:w-[260px]">
            <MonthSelector
              months={availableMonths}
              activeMonth={activeMonth}
              onMonthChange={setActiveMonth}
            />
            <div className="hidden">
              <button
                type="button"
                onClick={() => setActiveTab("transactions")}
                className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm transition hover:bg-[#fff8eb]"
              >
                תנועות
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm transition hover:bg-[#fff8eb]"
              >
                דוחות
              </button>
            </div>
            <p className="hidden">
              הפעולות היומיומיות נמצאות קודם. דוחות, תקציב וגיבוי נשארים זמינים בטאבים.
            </p>
          </div>
        </div>
      </section>

      <div className="hidden md:block">
        <FinanceQuickActions
          onTabChange={setActiveTab}
          onAddTransaction={handleStartAddTransaction}
          onResetDemoData={handleResetDemoData}
        />
      </div>

      <FinanceTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "transactions" && (
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,360px)_1fr]">
          <section className="hidden rounded-[20px] border border-white/80 bg-white/90 p-3 text-right shadow-[0_14px_34px_rgba(33,43,63,0.07)] lg:block">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between xl:flex-col xl:items-stretch">
              <button
                type="button"
                onClick={handleStartAddTransaction}
                className="min-h-11 rounded-2xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(17,24,39,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
              >
                + הוסף פעולה
              </button>

              <div>
                <p className="text-xs font-bold text-slate-600">פעולה חדשה</p>
                <h2 className="mt-1 text-base font-black text-[#111827]">
                  {editingTransaction ? "עריכת פעולה קיימת" : "הוספה וניהול"}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  לא צריך לנחש: פתח טופס ברור, הוסף הכנסה או הוצאה, ושמור.
                </p>
              </div>
            </div>

            {isTransactionFormOpen ? (
              <div className="mt-3">
                <AddTransactionForm
                  key={editingTransaction?.id ?? "new-transaction"}
                  editingTransaction={editingTransaction}
                  onSave={handleSaveTransaction}
                  onCancelEdit={handleCancelEdit}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartAddTransaction}
                className="mt-3 block w-full rounded-[18px] border border-dashed border-[#cbd5e1] bg-[#fffdf8] p-4 text-right transition hover:border-[#111827] hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.08)]"
              >
                <span className="block text-sm font-black text-[#111827]">
                  לחץ כאן לפתיחת טופס פעולה
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-600">
                  הטופס ייפתח כאן, בלי לחפש שורה נסתרת ובלי לנחש מה לעשות.
                </span>
              </button>
            )}
          </section>

          <div className="space-y-2.5">
            <FinanceFilters
              searchValue={searchValue}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearchValue}
              onTypeFilterChange={setTypeFilter}
              onStatusFilterChange={setStatusFilter}
              onClearFilters={handleClearFilters}
            />

            <TransactionsTable
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              onEdit={handleEditTransaction}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      )}

      {isTransactionFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/28 px-2 pb-2 backdrop-blur-[2px] lg:hidden"
          onClick={handleCancelEdit}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={editingTransaction ? "עריכת פעולה" : "פעולה חדשה"}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] border border-[#e6d9c9] bg-white p-3 text-right shadow-[0_-18px_54px_rgba(15,23,42,0.18)]"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 text-sm font-black text-slate-700"
              >
                סגור
              </button>
              <div>
                <p className="text-xs font-black text-slate-500">
                  {editingTransaction ? "עדכון פעולה" : "הזנה מהירה"}
                </p>
                <h2 className="text-lg font-black text-[#111827]">
                  {editingTransaction ? "עריכת פעולה" : "פעולה חדשה"}
                </h2>
              </div>
            </div>

            <AddTransactionForm
              key={editingTransaction?.id ?? "new-transaction-mobile"}
              editingTransaction={editingTransaction}
              onSave={handleSaveTransaction}
              onCancelEdit={handleCancelEdit}
            />
          </section>
        </div>
      )}

      {activeTab === "budget" && <BudgetOverview items={budgetReportItems} />}

      {activeTab === "reports" && (
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
      )}

      {activeTab === "overview" && (
        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,420px)_1fr]">
          <SmartFinanceSummary insights={smartInsights} />
          <details className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right text-[#111827] shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span className="rounded-full bg-[#fff8eb] px-3 py-1 text-xs font-black text-[#9a6b17]">
                פתיחה לפי צורך
              </span>
              <span className="text-sm font-black">גרפים ותזרים</span>
            </summary>
            <div className="mt-2.5 space-y-2.5">
              <FinanceChart items={monthlyCashflowItems} />
              <details className="rounded-[18px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
                <summary className="cursor-pointer list-none text-sm font-black text-slate-900">
                  תזרים חודשי מפורט
                </summary>
                <div className="mt-2.5">
                  <MonthlyCashflow items={monthlyCashflowItems} />
                </div>
              </details>
            </div>
          </details>
        </div>
      )}

      {activeTab === "backup" && (
        <section className="rounded-[20px] border border-white/80 bg-white/90 p-3 text-right text-[#111827] shadow-[0_14px_34px_rgba(33,43,63,0.07)]">
          <div className="mb-3">
            <p className="mb-2 text-sm font-bold text-slate-600">
              ניהול נתונים
            </p>
            <h2 className="text-xl font-black">גיבוי, שחזור וייבוא</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              פעולות מתקדמות לניהול המידע: ייבוא, ייצוא, גיבוי, שחזור ואיפוס.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <ImportTransactionsButton onImport={handleImportTransactions} />

            <ExportTransactionsButton transactions={exportTransactions} />

            <JsonBackupControls
              transactions={exportTransactions}
              onRestore={handleRestoreTransactions}
            />

            <button
              type="button"
              onClick={handleResetDemoData}
              className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-5 py-3 text-sm font-bold text-slate-700 hover:bg-white"
            >
              איפוס נתוני דמו
            </button>

            <button
              type="button"
              onClick={handleClearAllTransactions}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-800 hover:bg-rose-100"
            >
              מחיקת כל הנתונים
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
