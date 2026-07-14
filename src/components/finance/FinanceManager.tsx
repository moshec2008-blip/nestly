"use client";

import { useEffect, useMemo, useState } from "react";
import AddTransactionForm from "@/components/finance/AddTransactionForm";
import BalanceTile from "@/components/finance/BalanceTile";
import FinanceBackup from "@/components/finance/FinanceBackup";
import BudgetOverview from "@/components/finance/BudgetOverview";
import FinanceFilters, {
  type TransactionStatusFilter,
  type TransactionTypeFilter,
} from "@/components/finance/FinanceFilters";
import FinanceReminderDialog from "@/components/finance/FinanceReminderDialog";
import FinanceReports from "@/components/finance/FinanceReports";
import FinanceSummaryCards from "@/components/finance/FinanceSummaryCards";
import FinanceTabs, { type FinanceTab } from "@/components/finance/FinanceTabs";
import MonthSelector, {
  formatMonthLabel,
} from "@/components/finance/MonthSelector";
import ReceiptScanPreview from "@/components/ai/ReceiptScanPreview";
import TransactionsTable from "@/components/finance/TransactionsTable";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  getBudgetReport,
  getExpenseCategoryReport,
  getFinanceStats,
  getMonthlyCashflowReport,
  getSmartFinanceInsights,
  initialFinanceTransactions,
  isFinanceTransaction,
  type FinanceTransaction,
} from "@/data/finance";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import {
  consumeFinanceDraft,
  type FinanceDraft,
} from "@/lib/actionDrafts";
import { storageKeys } from "@/lib/storageKeys";
import { formatIlsCurrency } from "@/utils/formatters";
import { isValidMonthKey } from "@/utils/isoDate";
import {
  getStorageScopeEventName,
  readStorage,
  writeStorage,
} from "@/utils/storage";

function getTodayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

type FinanceBalanceSnapshot = {
  amount: number;
  updatedAt: string;
};

type BalanceKind = "bank" | "savings" | "loans" | "mortgage";

const balanceKinds: BalanceKind[] = ["bank", "savings", "loans", "mortgage"];

const balanceMeta: Record<
  BalanceKind,
  {
    label: string;
    emptyHint: string;
    valueToneClass: string;
    placeholder: string;
    savedToastTitle: string;
  }
> = {
  bank: {
    label: "יתרת בנק",
    emptyHint: "המשתמש יעדכן ידנית",
    valueToneClass: "text-[#111827]",
    placeholder: "לדוגמה 12,500",
    savedToastTitle: "יתרת הבנק עודכנה",
  },
  savings: {
    label: "יתרת חסכונות",
    emptyHint: "נפרד מהשוטף",
    valueToneClass: "text-emerald-700",
    placeholder: "לדוגמה 80,000",
    savedToastTitle: "יתרת החסכונות עודכנה",
  },
  loans: {
    label: "יתרת הלוואות",
    emptyHint: "חוב נפרד מהשוטף",
    valueToneClass: "text-rose-700",
    placeholder: "לדוגמה 35,000",
    savedToastTitle: "יתרת ההלוואות עודכנה",
  },
  mortgage: {
    label: "יתרת משכנתאות",
    emptyHint: "יתרת קרן משוערת",
    valueToneClass: "text-rose-700",
    placeholder: "לדוגמה 920,000",
    savedToastTitle: "יתרת המשכנתאות עודכנה",
  },
};

const emptyBalanceSnapshot: FinanceBalanceSnapshot = {
  amount: 0,
  updatedAt: "",
};

function getBalanceStorageKey(kind: BalanceKind) {
  if (kind === "bank") {
    return storageKeys.financeBankBalance;
  }

  if (kind === "savings") {
    return storageKeys.financeSavingsBalance;
  }

  if (kind === "loans") {
    return storageKeys.financeLoansBalance;
  }

  return storageKeys.financeMortgageBalance;
}

function isFinanceBalanceSnapshot(
  value: unknown
): value is FinanceBalanceSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as FinanceBalanceSnapshot;
  return (
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    typeof candidate.updatedAt === "string"
  );
}

function readAllBalances() {
  return Object.fromEntries(
    balanceKinds.map((kind) => [
      kind,
      readStorage(
        getBalanceStorageKey(kind),
        emptyBalanceSnapshot,
        isFinanceBalanceSnapshot
      ),
    ])
  ) as Record<BalanceKind, FinanceBalanceSnapshot>;
}

function balancesToInputs(balances: Record<BalanceKind, FinanceBalanceSnapshot>) {
  return Object.fromEntries(
    balanceKinds.map((kind) => [
      kind,
      balances[kind].updatedAt ? String(balances[kind].amount) : "",
    ])
  ) as Record<BalanceKind, string>;
}

function parseCurrencyInput(value: string) {
  const normalizedValue = value
    .replace(/[^\d,.-]/g, "")
    .replace(/,/g, "")
    .trim();

  if (!normalizedValue) {
    return null;
  }

  const amount = Number(normalizedValue);
  return Number.isFinite(amount) ? amount : null;
}

function getAvailableMonths(transactions: FinanceTransaction[]) {
  return Array.from(
    new Set(
      transactions
        .map((item) => item.date.slice(0, 7))
        .filter(isValidMonthKey)
    )
  ).sort((a, b) => b.localeCompare(a));
}

const financeReminderDismissedPrefix = "nestly-finance-reminder-dismissed";

export default function FinanceManager() {
  const { confirm, toast } = useFeedback();
  const [transactions, setTransactions] =
    usePersistentArrayState<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions,
      isFinanceTransaction
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<FinanceDraft | null>(null);
  const [balances, setBalances] = useState<
    Record<BalanceKind, FinanceBalanceSnapshot>
  >(readAllBalances);
  const [balanceInputs, setBalanceInputs] = useState<Record<BalanceKind, string>>(
    () => balancesToInputs(readAllBalances())
  );
  const [activeBalanceEditor, setActiveBalanceEditor] =
    useState<BalanceKind | null>(null);

  useEffect(() => {
    function syncBalancesFromStorage() {
      const nextBalances = readAllBalances();
      setBalances(nextBalances);
      setBalanceInputs(balancesToInputs(nextBalances));
    }

    syncBalancesFromStorage();
    window.addEventListener(getStorageScopeEventName(), syncBalancesFromStorage);

    return () => {
      window.removeEventListener(
        getStorageScopeEventName(),
        syncBalancesFromStorage
      );
    };
  }, []);

  // טיוטה ממסמך סרוק: פותחת טופס הוצאה ממולא מראש לאישור המשתמש.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const draft = consumeFinanceDraft();

      if (draft) {
        setDraftValues(draft);
        setActiveTab("transactions");
        setIsTransactionFormOpen(true);
        toast({
          title: "טיוטת הוצאה מהמסמך מוכנה",
          description: "בדקו את הפרטים ואשרו כדי לשמור.",
          tone: "info",
        });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearDraftValues() {
    setDraftValues(null);
  }

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
      .filter((item) => !dateFrom || item.date >= dateFrom)
      .filter((item) => !dateTo || item.date <= dateTo)
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
  }, [
    activeMonthTransactions,
    dateFrom,
    dateTo,
    searchValue,
    typeFilter,
    statusFilter,
  ]);

  const exportTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  );

  const dueReminderTransactions = useMemo(() => {
    const todayKey = getTodayKey();

    return transactions.filter(
      (transaction) =>
        transaction.status === "pending" &&
        Boolean(transaction.reminderDate) &&
        String(transaction.reminderDate) <= todayKey
    );
  }, [transactions]);

  const activeReminderTransaction = useMemo(() => {
    if (!activeReminderId) {
      return null;
    }

    return transactions.find((item) => item.id === activeReminderId) ?? null;
  }, [activeReminderId, transactions]);

  const hasBankBalance = Boolean(balances.bank.updatedAt);
  const hasAnyManualBalance = balanceKinds.some(
    (kind) => balances[kind].updatedAt
  );
  const bankBalanceGap = hasBankBalance
    ? balances.bank.amount - stats.balance
    : 0;
  const totalFinancialPosition =
    (hasBankBalance ? balances.bank.amount : stats.balance) +
    (balances.savings.updatedAt ? balances.savings.amount : 0) -
    (balances.loans.updatedAt ? balances.loans.amount : 0) -
    (balances.mortgage.updatedAt ? balances.mortgage.amount : 0);

  const financeCards = [
    {
      title: "יתרה מחושבת",
      value: formatIlsCurrency(stats.balance),
      tone: "text-[#111827]",
      subtitle: "לפי הפעולות שהוזנו",
    },
    {
      title: "הכנסות",
      value: formatIlsCurrency(stats.income),
      tone: "text-emerald-700",
      subtitle: "בתקופה הנבחרת",
    },
    {
      title: "הוצאות",
      value: formatIlsCurrency(stats.expenses),
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

  useEffect(() => {
    if (activeReminderId || dueReminderTransactions.length === 0) {
      return;
    }

    const todayKey = getTodayKey();
    const nextReminder = dueReminderTransactions.find((transaction) => {
      const dismissedKey = `${financeReminderDismissedPrefix}-${transaction.id}-${todayKey}`;
      return window.localStorage.getItem(dismissedKey) !== "true";
    });

    if (nextReminder) {
      const timeoutId = window.setTimeout(() => {
        setActiveReminderId(nextReminder.id);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [activeReminderId, dueReminderTransactions]);

  function dismissActiveReminderForToday() {
    if (!activeReminderTransaction) {
      return;
    }

    const todayKey = getTodayKey();
    window.localStorage.setItem(
      `${financeReminderDismissedPrefix}-${activeReminderTransaction.id}-${todayKey}`,
      "true"
    );
    setActiveReminderId(null);
  }

  function completeActiveReminder() {
    if (!activeReminderTransaction) {
      return;
    }

    setTransactions((currentTransactions) =>
      currentTransactions.map((transaction) =>
        transaction.id === activeReminderTransaction.id
          ? { ...transaction, status: "done", reminderDate: undefined }
          : transaction
      )
    );

    toast({
      title: "הפעולה סומנה כבוצעה",
      description: activeReminderTransaction.title,
      tone: "success",
    });
    setActiveReminderId(null);
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

  function handleConfirmReceiptExpense(expense: {
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
  }) {
    handleSaveTransaction({
      id: crypto.randomUUID(),
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      type: "expense",
      date: expense.date,
      status: "done",
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
    setDateFrom("");
    setDateTo("");
  }

  function handleSaveBalance(kind: BalanceKind) {
    const amount = parseCurrencyInput(balanceInputs[kind]);

    if (amount === null) {
      toast({
        title: "הסכום לא נשמר",
        description: "אפשר להזין מספר רגיל, למשל 12500 או 12,500.",
        tone: "warning",
      });
      return;
    }

    const nextSnapshot = {
      amount,
      updatedAt: new Date().toISOString(),
    };
    const didSave = writeStorage(getBalanceStorageKey(kind), nextSnapshot);

    if (!didSave) {
      toast({
        title: "לא הצלחנו לשמור",
        description: "נסה שוב בעוד רגע.",
        tone: "danger",
      });
      return;
    }

    setBalances((currentBalances) => ({
      ...currentBalances,
      [kind]: nextSnapshot,
    }));
    setBalanceInputs((currentInputs) => ({
      ...currentInputs,
      [kind]: String(amount),
    }));
    setActiveBalanceEditor(null);
    toast({
      title: balanceMeta[kind].savedToastTitle,
      description: "התמונה הפיננסית נשמרה במרחב הנוכחי.",
      tone: "success",
    });
  }

  return (
    <section className="space-y-4 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] lg:pb-0">
      <section className="nestly-card rounded-[24px] p-6 text-right text-[#1d1d1f]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#7a5212]">
              מרכז כספים · {formatMonthLabel(activeMonth)}
            </p>
            <p className="mt-1 text-[28px] font-black leading-9 text-[#111827] sm:text-[32px]">
              {formatIlsCurrency(totalFinancialPosition)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {hasAnyManualBalance
                ? "סה\"כ מצב פיננסי: בנק וחסכונות בניכוי הלוואות ומשכנתאות"
                : "יתרה מחושבת לפי הפעולות שהוזנו"}
            </p>
          </div>

          <div className="shrink-0 sm:w-56">
            <MonthSelector
              months={availableMonths}
              activeMonth={activeMonth}
              onMonthChange={setActiveMonth}
            />
          </div>
        </div>

        <div className="mt-5">
          <FinanceSummaryCards cards={financeCards} />
        </div>

        <details className="group mt-4 rounded-[22px] border border-[#e3d8c9]/60 bg-[#fffdf8]/82 shadow-[0_10px_26px_rgba(33,43,63,0.04)]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
            <span className="text-xs font-semibold text-slate-400">
              {hasAnyManualBalance
                ? `סה"כ כולל חסכונות והלוואות: ${formatIlsCurrency(totalFinancialPosition)}`
                : "עדכון ידני של יתרות אמיתיות"}
            </span>
            <span className="flex items-center gap-2 text-sm font-bold text-[#111827]">
              בנק, חסכונות והתחייבויות
              <span
                className="text-xs text-slate-500 transition-transform group-open:rotate-180"
                aria-hidden="true"
              >
                ▾
              </span>
            </span>
          </summary>

          <div className="border-t border-[#e3d8c9]/50 p-4">
            <p className="mb-4 text-xs font-semibold leading-5 text-slate-400">
              מעדכנים מדי פעם לפי היתרה האמיתית: בנק וחסכונות מצד אחד, הלוואות ומשכנתאות מצד שני.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {balanceKinds.map((kind) => (
                <BalanceTile
                  key={kind}
                  label={balanceMeta[kind].label}
                  amount={balances[kind].amount}
                  hasValue={Boolean(balances[kind].updatedAt)}
                  updatedAtLabel={
                    balances[kind].updatedAt
                      ? `עודכן: ${formatDateLabel(balances[kind].updatedAt)}`
                      : ""
                  }
                  emptyHint={balanceMeta[kind].emptyHint}
                  valueToneClass={balanceMeta[kind].valueToneClass}
                  note={
                    kind === "bank" && hasBankBalance && Math.abs(bankBalanceGap) >= 1
                      ? `פער מול היתרה המחושבת: ${formatIlsCurrency(bankBalanceGap)}`
                      : undefined
                  }
                  isEditing={activeBalanceEditor === kind}
                  inputValue={balanceInputs[kind]}
                  inputPlaceholder={balanceMeta[kind].placeholder}
                  onToggleEdit={() =>
                    setActiveBalanceEditor(
                      activeBalanceEditor === kind ? null : kind
                    )
                  }
                  onInputChange={(value) =>
                    setBalanceInputs((currentInputs) => ({
                      ...currentInputs,
                      [kind]: value,
                    }))
                  }
                  onSave={() => handleSaveBalance(kind)}
                />
              ))}
            </div>
          </div>
        </details>
      </section>

      <FinanceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddTransaction={handleStartAddTransaction}
        scanSlot={
          <ReceiptScanPreview
            userMode="demo"
            onConfirmExpense={handleConfirmReceiptExpense}
          />
        }
      />

      {activeTab === "transactions" && isTransactionFormOpen && (
        <section className="lg:hidden">
          <AddTransactionForm
            key={
              editingTransaction?.id ??
              (draftValues ? "draft-mobile" : "new-transaction-mobile-inline")
            }
            editingTransaction={editingTransaction}
            draftValues={draftValues}
            onSave={(transaction) => {
              clearDraftValues();
              handleSaveTransaction(transaction);
            }}
            onCancelEdit={() => {
              clearDraftValues();
              handleCancelEdit();
            }}
            showCancelButton
          />
        </section>
      )}

      {activeTab === "transactions" && (
        <div
          className={
            isTransactionFormOpen
              ? "grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]"
              : "grid gap-4"
          }
        >
          {isTransactionFormOpen && (
            <section className="hidden rounded-[24px] border border-white/80 bg-white/90 p-6 text-right shadow-[0_18px_42px_rgba(33,43,63,0.07)] lg:block">
              <div>
                <p className="text-xs font-bold text-slate-600">פעולה חדשה</p>
                <h2 className="mt-1 text-base font-bold text-[#111827]">
                  {editingTransaction ? "עריכת פעולה קיימת" : "הוספה וניהול"}
                </h2>
              </div>

              <div className="mt-3">
                <AddTransactionForm
                  key={
                    editingTransaction?.id ??
                    (draftValues ? "draft-desktop" : "new-transaction")
                  }
                  editingTransaction={editingTransaction}
                  draftValues={draftValues}
                  onSave={(transaction) => {
                    clearDraftValues();
                    handleSaveTransaction(transaction);
                  }}
                  onCancelEdit={() => {
                    clearDraftValues();
                    handleCancelEdit();
                  }}
                />
              </div>
            </section>
          )}

          <div className="space-y-4">
            <FinanceFilters
              searchValue={searchValue}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onSearchChange={setSearchValue}
              onTypeFilterChange={setTypeFilter}
              onStatusFilterChange={setStatusFilter}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClearFilters={handleClearFilters}
            />

            <TransactionsTable
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              onSave={handleSaveTransaction}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      )}

      {activeTab === "budget" && <BudgetOverview items={budgetReportItems} />}

      {activeTab === "reports" && (
        <FinanceReports
          insights={smartInsights}
          categoryReportItems={categoryReportItems}
          monthlyCashflowItems={monthlyCashflowItems}
        />
      )}

      {activeTab === "backup" && (
        <FinanceBackup
          transactions={exportTransactions}
          onImport={handleImportTransactions}
          onRestore={handleRestoreTransactions}
          onClearAll={handleClearAllTransactions}
        />
      )}

      <FinanceReminderDialog
        transaction={activeReminderTransaction}
        onDismiss={dismissActiveReminderForToday}
        onComplete={completeActiveReminder}
      />
    </section>
  );
}
