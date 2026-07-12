"use client";

import { useRef } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import type { FinanceTransaction } from "@/data/finance";
import { normalizeDateString } from "@/utils/isoDate";

type ImportTransactionsButtonProps = {
  onImport: (transactions: FinanceTransaction[]) => void;
};

type CsvRow = Record<string, string>;

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());

  return result;
}

function parseCsv(content: string): CsvRow[] {
  const cleanContent = content.replace(/^\uFEFF/, "");
  const lines = cleanContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function getValue(row: CsvRow, possibleKeys: string[]) {
  for (const key of possibleKeys) {
    const value = row[key];

    if (value) {
      return value.trim();
    }
  }

  return "";
}

function normalizeType(value: string): FinanceTransaction["type"] {
  const cleanValue = value.trim().toLowerCase();

  if (cleanValue === "income" || cleanValue === "הכנסה") {
    return "income";
  }

  return "expense";
}

function normalizeStatus(value: string): FinanceTransaction["status"] {
  const cleanValue = value.trim().toLowerCase();

  if (cleanValue === "pending" || cleanValue === "ממתין") {
    return "pending";
  }

  return "done";
}

function normalizeAmount(value: string) {
  const cleanValue = value.replace(/[^\d.-]/g, "");
  return Number(cleanValue);
}

function rowToTransaction(row: CsvRow): FinanceTransaction | null {
  const date = normalizeDateString(getValue(row, ["תאריך", "date", "Date"]));
  const title = getValue(row, ["שם פעולה", "פעולה", "title", "Title"]);
  const category = getValue(row, ["קטגוריה", "category", "Category"]);
  const type = getValue(row, ["סוג", "type", "Type"]);
  const status = getValue(row, ["סטטוס", "status", "Status"]);
  const reminderDate = normalizeDateString(
    getValue(row, ["תאריך תזכורת", "reminderDate", "Reminder Date"])
  );
  const amountValue = getValue(row, ["סכום", "amount", "Amount"]);
  const amount = normalizeAmount(amountValue);

  if (!date || !title || !category || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    date,
    title,
    category,
    amount,
    type: normalizeType(type),
    status: normalizeStatus(status),
    reminderDate: reminderDate || undefined,
  };
}

export default function ImportTransactionsButton({
  onImport,
}: ImportTransactionsButtonProps) {
  const { toast } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const content = String(reader.result || "");
      const rows = parseCsv(content);
      const importedTransactions = rows
        .map(rowToTransaction)
        .filter((transaction): transaction is FinanceTransaction =>
          Boolean(transaction)
      );

      if (importedTransactions.length === 0) {
        toast({
          title: "לא נמצאו פעולות תקינות",
          description: "בדוק שהקובץ כולל תאריך, פעולה, קטגוריה וסכום.",
          tone: "warning",
        });
        event.target.value = "";
        return;
      }

      const skippedCount = rows.length - importedTransactions.length;

      if (skippedCount > 0) {
        toast({
          title: `${skippedCount} שורות דולגו`,
          description: "שורות עם תאריך או סכום לא תקינים לא יובאו.",
          tone: "warning",
        });
      }

      onImport(importedTransactions);
      event.target.value = "";
    };

    reader.readAsText(file, "utf-8");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
      >
        ייבוא CSV
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
