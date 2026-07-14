"use client";

import { useState, type FormEvent } from "react";
import type { FinanceTransaction } from "@/data/finance";
import type { FinanceDraft } from "@/lib/actionDrafts";
import { Button } from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import FormField from "@/components/ui/FormField";

type AddTransactionFormProps = {
  editingTransaction: FinanceTransaction | null;
  // טיוטה ממסמך סרוק — ממלאת את הטופס מראש, המשתמש מאשר בשמירה.
  draftValues?: FinanceDraft | null;
  onSave: (transaction: FinanceTransaction) => void;
  onCancelEdit: () => void;
  showCancelButton?: boolean;
};

const inputClassName =
  "min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-4 py-3 text-right text-sm font-semibold text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#007aff]/55 focus:ring-4 focus:ring-[#007aff]/10";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialFormValues(
  transaction: FinanceTransaction | null,
  draft?: FinanceDraft | null
) {
  if (!transaction && draft) {
    return {
      title: draft.title,
      category: draft.category,
      amount: draft.amount ? String(draft.amount) : "",
      date: draft.date || getTodayDate(),
      type: "expense" as FinanceTransaction["type"],
      status: (draft.reminderDate
        ? "pending"
        : "done") as FinanceTransaction["status"],
      reminderDate: draft.reminderDate ?? "",
    };
  }

  if (!transaction) {
    return {
      title: "",
      category: "",
      amount: "",
      date: getTodayDate(),
      type: "expense" as FinanceTransaction["type"],
      status: "done" as FinanceTransaction["status"],
      reminderDate: "",
    };
  }

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

export default function AddTransactionForm({
  editingTransaction,
  draftValues = null,
  onSave,
  onCancelEdit,
  showCancelButton = false,
}: AddTransactionFormProps) {
  const [formValues, setFormValues] = useState(() =>
    getInitialFormValues(editingTransaction, draftValues)
  );

  const isEditing = Boolean(editingTransaction);
  const isIncome = formValues.type === "income";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = formValues.title.trim();
    const cleanCategory = formValues.category.trim();
    const numericAmount = Number(formValues.amount);

    if (
      !cleanTitle ||
      !cleanCategory ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !formValues.date
    ) {
      return;
    }

    onSave({
      id: editingTransaction?.id ?? crypto.randomUUID(),
      title: cleanTitle,
      category: cleanCategory,
      amount: numericAmount,
      type: formValues.type,
      date: formValues.date,
      status: formValues.status,
      reminderDate:
        formValues.status === "pending" && formValues.reminderDate
          ? formValues.reminderDate
          : undefined,
    });
  }

  return (
    <section className="rounded-[22px] border border-[#d9dde5] bg-white p-3 text-right text-[#111827] shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-start gap-2 sm:order-first">
          {(isEditing || showCancelButton) && (
            <Button
              type="button"
              onClick={onCancelEdit}
              tone="secondary"
              size="sm"
            >
              {isEditing ? "ביטול עריכה" : "סגור טופס"}
            </Button>
          )}
        </div>

        <div>
          <p className="text-xs font-black text-slate-500">
            {isEditing ? "עדכון פעולה קיימת" : "הזנה מהירה"}
          </p>
          <h2 className="mt-0.5 text-lg font-black text-[#111827]">
            {isEditing ? "עריכת פעולה כספית" : "פעולה חדשה"}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <FormField label="שם הפעולה" required>
            <input
              value={formValues.title}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  title: event.target.value,
                }))
              }
              required
              aria-label="שם הפעולה"
              placeholder="לדוגמה: קניות, משכורת, חשמל"
              className={inputClassName}
            />
          </FormField>

          <FormField label="קטגוריה" required>
            <input
              value={formValues.category}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  category: event.target.value,
                }))
              }
              required
              aria-label="קטגוריה"
              placeholder="מזון, דיור, רכב"
              className={inputClassName}
            />
          </FormField>

          <FormField label="סכום" required>
            <input
              value={formValues.amount}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  amount: event.target.value,
                }))
              }
              required
              type="number"
              aria-label="סכום"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0"
              className={inputClassName}
            />
          </FormField>

          <FormField label="תאריך" required>
            <DateInput
              value={formValues.date}
              onChange={(date) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  date,
                }))
              }
              required
              label="תאריך פעולה"
              className="mt-1"
            />
          </FormField>
        </div>

        <div className="grid gap-2">
          <div className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-2">
            <p className="mb-2 text-sm font-black text-[#111827]">סוג פעולה</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    type: "expense",
                  }))
                }
                className={[
                  "flex min-h-10 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl px-3 py-2 text-center text-sm font-black leading-tight transition",
                  !isIncome
                    ? "bg-[#111827] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                    : "border border-[#d9dde5] bg-white text-slate-700 hover:text-[#111827]",
                ].join(" ")}
                aria-pressed={!isIncome}
              >
                הוצאה
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    type: "income",
                  }))
                }
                className={[
                  "flex min-h-10 w-full min-w-0 items-center justify-center overflow-hidden rounded-2xl px-3 py-2 text-center text-sm font-black leading-tight transition",
                  isIncome
                    ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.18)]"
                    : "border border-[#d9dde5] bg-white text-slate-700 hover:text-[#111827]",
                ].join(" ")}
                aria-pressed={isIncome}
              >
                הכנסה
              </button>
            </div>
          </div>

          <FormField label="סטטוס">
            <select
              value={formValues.status}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  status: event.target.value as FinanceTransaction["status"],
                  reminderDate:
                    event.target.value === "pending"
                      ? currentValues.reminderDate || currentValues.date
                      : "",
                }))
              }
              className={inputClassName}
              aria-label="סטטוס פעולה"
            >
              <option value="done">בוצע</option>
              <option value="pending">פעולה עתידית</option>
            </select>
          </FormField>

          {formValues.status === "pending" && (
            <FormField
              label="תאריך תזכורת"
              helperText="ביום הזה תופיע תזכורת אם הפעולה עדיין פתוחה."
            >
              <DateInput
                value={formValues.reminderDate}
                onChange={(reminderDate) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    reminderDate,
                  }))
                }
                label="תאריך תזכורת"
                className="mt-1"
              />
            </FormField>
          )}

          <Button
            type="submit"
            tone="primary"
            className="w-full"
          >
            {isEditing ? "שמור שינויים" : "הוסף פעולה"}
          </Button>
        </div>
      </form>
    </section>
  );
}
