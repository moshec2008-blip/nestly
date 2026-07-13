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
      "תאריך תזכורת",
      "סכום",
    ];

    const rows = transactions.map((transaction) => [
      transaction.date,
      transaction.title,
      transaction.category,
      getTransactionTypeLabel(transaction.type),
      getTransactionStatusLabel(transaction.status),
      transaction.reminderDate ?? "",
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
      className="min-h-11 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-bold text-[#1d1d1f] transition hover:bg-[#fffdf8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      ייצוא CSV
    </button>
  );
}
