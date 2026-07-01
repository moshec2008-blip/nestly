"use client";

import type { FinanceTransaction } from "@/data/finance";

type ExportTransactionsButtonProps = {
  transactions: FinanceTransaction[];
};

function escapeCsvValue(value: string | number) {
  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function getTransactionTypeLabel(type: FinanceTransaction["type"]) {
  return type === "income" ? "הכנסה" : "הוצאה";
}

function getTransactionStatusLabel(status: FinanceTransaction["status"]) {
  return status === "done" ? "בוצע" : "ממתין";
}

export default function ExportTransactionsButton({
  transactions,
}: ExportTransactionsButtonProps) {
  function handleExport() {
    const headers = [
      "תאריך",
      "שם פעולה",
      "קטגוריה",
      "סוג",
      "סטטוס",
      "סכום",
    ];

    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.title,
      transaction.category,
      getTransactionTypeLabel(transaction.type),
      getTransactionStatusLabel(transaction.status),
      transaction.amount,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `finance-transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={transactions.length === 0}
      className="rounded-2xl border border-emerald-300/20 bg-emerald-400/12 px-5 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:bg-slate-500"
    >
      ייצוא CSV
    </button>
  );
}
