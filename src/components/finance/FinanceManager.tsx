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
  const [activeTab, setActiveTab] = useState<FinanceTab>("overview");
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
      title: "ממתינות",
      value: stats.pendingPayments.toString(),
      tone: "text-amber-700",
      subtitle: "פעולות פתוחות",
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
      title: "ייבוא הושלם",
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
    setActiveTab("overview");
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
    setActiveTab("overview");
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
    setActiveTab("overview");
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
    <>
      <MonthSelector
        months={availableMonths}
        activeMonth={activeMonth}
        onMonthChange={setActiveMonth}
      />

      <FinanceSummaryCards cards={financeCards} />

      <FinanceQuickActions
        onTabChange={setActiveTab}
        onAddTransaction={handleStartAddTransaction}
        onResetDemoData={handleResetDemoData}
      />

      <FinanceTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="space-y-2.5">
          <SmartFinanceSummary insights={smartInsights} />
          <details className="rounded-[18px] border border-[#e6e8ec] bg-white p-3 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
            <summary className="cursor-pointer list-none text-sm font-black">
              גרפים ותזרים
            </summary>
            <div className="mt-2.5 space-y-2.5">
              <FinanceChart items={monthlyCashflowItems} />
              <MonthlyCashflow items={monthlyCashflowItems} />
            </div>
          </details>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-2.5">
          <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-3 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={handleStartAddTransaction}
                className="min-h-11 rounded-2xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
              >
                + הוסף פעולה חדשה
              </button>

              <div>
                <p className="text-xs font-bold text-slate-600">
                  פעולות כספיות
                </p>
                <h2 className="mt-1 text-base font-black text-[#111827]">
                  {editingTransaction
                    ? "עריכת פעולה קיימת"
                    : "הוספה וניהול פעולות"}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  הוסף הכנסה או הוצאה, עדכן סטטוס, ואז המשך לטבלה ולסינון.
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
                className="mt-3 block w-full rounded-[18px] border border-dashed border-[#cbd5e1] bg-[#fafafb] p-4 text-right transition hover:border-[#111827] hover:bg-white"
              >
                <span className="block text-sm font-black text-[#111827]">
                  אין טופס פתוח כרגע
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-600">
                  לחץ כאן או על הכפתור “הוסף פעולה חדשה” כדי לפתוח טופס ברור ומלא.
                </span>
              </button>
            )}
          </section>

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
      )}

      {activeTab === "budget" && <BudgetOverview items={budgetReportItems} />}

      {activeTab === "reports" && (
        <div className="space-y-2.5">
          <CategoryReport items={categoryReportItems} />
          <details className="rounded-[18px] border border-[#e6e8ec] bg-white p-3 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
            <summary className="cursor-pointer list-none text-sm font-black">
              תזרים חודשי מלא
            </summary>
            <div className="mt-3">
              <MonthlyCashflow items={monthlyCashflowItems} />
            </div>
          </details>
        </div>
      )}

      {activeTab === "backup" && (
        <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-3 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
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
    </>
  );
}
