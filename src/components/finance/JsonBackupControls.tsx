"use client";

import { useRef, type ChangeEvent } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import type { FinanceTransaction } from "@/data/finance";
import { normalizeDateString } from "@/utils/isoDate";
import { createUuid } from "@/utils/ids";

type JsonBackupControlsProps = {
  transactions: FinanceTransaction[];
  onRestore: (transactions: FinanceTransaction[]) => void;
};

type BackupFile = {
  app?: string;
  version?: number;
  exportedAt?: string;
  transactions?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeType(value: unknown): FinanceTransaction["type"] {
  return value === "income" ? "income" : "expense";
}

function normalizeStatus(value: unknown): FinanceTransaction["status"] {
  return value === "pending" ? "pending" : "done";
}

function normalizeTransaction(value: unknown): FinanceTransaction | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const category =
    typeof value.category === "string" ? value.category.trim() : "";
  const date =
    typeof value.date === "string" ? normalizeDateString(value.date) : null;
  const reminderDate =
    typeof value.reminderDate === "string"
      ? normalizeDateString(value.reminderDate) ?? ""
      : "";
  const amount = Number(value.amount);

  if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : createUuid(),
    title,
    category,
    date,
    amount,
    type: normalizeType(value.type),
    status: normalizeStatus(value.status),
    reminderDate: reminderDate || undefined,
  };
}

function getTransactionsFromBackup(parsedJson: unknown) {
  if (Array.isArray(parsedJson)) {
    return parsedJson;
  }

  if (!isRecord(parsedJson)) {
    return [];
  }

  const backup = parsedJson as BackupFile;

  if (Array.isArray(backup.transactions)) {
    return backup.transactions;
  }

  return [];
}

export default function JsonBackupControls({
  transactions,
  onRestore,
}: JsonBackupControlsProps) {
  const { confirm, toast } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleExportJson() {
    const backup = {
      app: "beit-cohen-shor-finance",
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
    };

    const jsonContent = JSON.stringify(backup, null, 2);

    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `finance-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    toast({
      title: "גיבוי JSON נוצר",
      description: "קובץ הגיבוי ירד למחשב.",
      tone: "success",
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content = String(reader.result || "");
        const parsedJson = JSON.parse(content);
        const rawTransactions = getTransactionsFromBackup(parsedJson);

        const seenIds = new Set<string>();
        const restoredTransactions = rawTransactions
          .map(normalizeTransaction)
          .filter((item): item is FinanceTransaction => Boolean(item))
          .map((item) => {
            // מזהה כפול שובר עריכה ומחיקה — מקצים חדש במקום.
            if (seenIds.has(item.id)) {
              return { ...item, id: createUuid() };
            }

            seenIds.add(item.id);
            return item;
          });

        if (restoredTransactions.length === 0) {
          toast({
            title: "לא נמצאו פעולות תקינות",
            description: "קובץ הגיבוי לא כולל פעולות כספים שניתן לשחזר.",
            tone: "warning",
          });
          input.value = "";
          return;
        }

        confirm({
          title: "שחזור מגיבוי",
          description: `לשחזר ${restoredTransactions.length} פעולות מהגיבוי? הנתונים הנוכחיים יוחלפו.`,
          confirmLabel: "שחזר גיבוי",
          cancelLabel: "ביטול",
          tone: "danger",
        }).then((approved) => {
          if (approved) {
            onRestore(restoredTransactions);
          }

          input.value = "";
        });
      } catch {
        toast({
          title: "קובץ גיבוי לא תקין",
          description: "בחר קובץ JSON מתאים של גיבוי כספים.",
          tone: "danger",
        });
        input.value = "";
      }
    };

    reader.readAsText(file, "utf-8");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleExportJson}
        disabled={transactions.length === 0}
        className="min-h-11 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-bold text-[#1d1d1f] transition hover:bg-[#fffdf8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        גיבוי JSON
      </button>

      <button
        type="button"
        onClick={handleImportClick}
        className="min-h-11 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-bold text-[#1d1d1f] transition hover:bg-[#fffdf8]"
      >
        שחזור JSON
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
