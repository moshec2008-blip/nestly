"use client";

import { useState, type FormEvent } from "react";
import type { FinanceTransaction } from "@/data/finance";
import DateInput from "@/components/ui/DateInput";

type AddTransactionFormProps = {
  editingTransaction: FinanceTransaction | null;
  onSave: (transaction: FinanceTransaction) => void;
  onCancelEdit: () => void;
  showCancelButton?: boolean;
};

const inputClassName =
  "min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-4 py-3 text-right text-sm font-semibold text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#007aff]/55 focus:ring-4 focus:ring-[#007aff]/10";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialFormValues(transaction: FinanceTransaction | null) {
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
  onSave,
  onCancelEdit,
  showCancelButton = false,
}: AddTransactionFormProps) {
  const [formValues, setFormValues] = useState(() =>
    getInitialFormValues(editingTransaction)
  );

  const isEditing = Boolean(editingTransaction);
  const isIncome = formValues.type === "income";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = formValues.title.trim();
    const cleanCategory = formValues.category.trim();
    const numericAmount = Number(formValues.amount);

    if (!cleanTitle || !cleanCategory || numericAmount <= 0 || !formValues.date) {
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
            <button
              type="button"
              onClick={onCancelEdit}
              className="min-h-10 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-white hover:text-[#111827]"
            >
              {isEditing ? "ביטול עריכה" : "סגור טופס"}
            </button>
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
          <label className="text-sm font-black text-[#111827]">
            שם הפעולה
            <input
              value={formValues.title}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  title: event.target.value,
                }))
              }
              required
              placeholder="לדוגמה: קניות, משכורת, חשמל"
              className={`mt-1 ${inputClassName}`}
            />
          </label>

          <label className="text-sm font-black text-[#111827]">
            קטגוריה
            <input
              value={formValues.category}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  category: event.target.value,
                }))
              }
              required
              placeholder="מזון, דיור, רכב"
              className={`mt-1 ${inputClassName}`}
            />
          </label>

          <label className="text-sm font-black text-[#111827]">
            סכום
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
              min="1"
              inputMode="decimal"
              placeholder="0"
              className={`mt-1 ${inputClassName}`}
            />
          </label>

          <label className="text-sm font-black text-[#111827]">
            תאריך
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
          </label>
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

          <label className="text-sm font-black text-[#111827]">
            סטטוס
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
              className={`mt-1 ${inputClassName}`}
            >
              <option value="done">בוצע</option>
              <option value="pending">פעולה עתידית</option>
            </select>
          </label>

          {formValues.status === "pending" && (
            <label className="text-sm font-black text-[#111827]">
              תאריך תזכורת
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
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                ביום הזה תופיע תזכורת אם הפעולה עדיין פתוחה.
              </span>
            </label>
          )}

          <button
            type="submit"
            className="min-h-11 rounded-2xl bg-[#111827] px-6 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
          >
            {isEditing ? "שמור שינויים" : "הוסף פעולה"}
          </button>
        </div>
      </form>
    </section>
  );
}
