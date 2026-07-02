"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { FinanceTransaction } from "@/data/finance";

type AddTransactionFormProps = {
  editingTransaction: FinanceTransaction | null;
  onSave: (transaction: FinanceTransaction) => void;
  onCancelEdit: () => void;
};

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

const commonInputClass =
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
    };
  }

  return {
    title: transaction.title,
    category: transaction.category,
    amount: String(transaction.amount),
    date: transaction.date,
    type: transaction.type,
    status: transaction.status,
  };
}

function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <label className="block text-right">
      <span className="text-sm font-black text-[#111827]">{label}</span>
      {hint && (
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
          {hint}
        </span>
      )}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export default function AddTransactionForm({
  editingTransaction,
  onSave,
  onCancelEdit,
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
    });
  }

  return (
    <section className="rounded-[22px] border border-[#d9dde5] bg-white p-4 text-right text-[#111827] shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 py-2 text-xs font-bold text-slate-700">
          {isEditing ? "מצב עריכה" : "פעולה חדשה"}
        </div>

        <div>
          <h2 className="text-xl font-black text-[#111827]">
            {isEditing ? "עריכת פעולה" : "הוספת פעולה כספית"}
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            מלא את הפרטים החשובים בלבד. אפשר לערוך או למחוק את הפעולה גם אחר כך.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
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
                  "min-h-11 rounded-2xl px-4 py-2 text-sm font-black transition",
                  !isIncome
                    ? "bg-[#111827] text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
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
                  "min-h-11 rounded-2xl px-4 py-2 text-sm font-black transition",
                  isIncome
                    ? "bg-emerald-700 text-white shadow-[0_10px_24px_rgba(4,120,87,0.16)]"
                    : "border border-[#d9dde5] bg-white text-slate-700 hover:text-[#111827]",
                ].join(" ")}
                aria-pressed={isIncome}
              >
                הכנסה
              </button>
            </div>
          </div>

          <FormField label="סטטוס" hint="סמן אם הפעולה כבר בוצעה או עדיין ממתינה.">
            <select
              value={formValues.status}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  status: event.target.value as FinanceTransaction["status"],
                }))
              }
              className={commonInputClass}
            >
              <option value="done">בוצע</option>
              <option value="pending">ממתין</option>
            </select>
          </FormField>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="שם הפעולה" hint="לדוגמה: קניות לבית, משכורת, חשמל.">
            <input
              value={formValues.title}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  title: event.target.value,
                }))
              }
              required
              placeholder="שם הפעולה"
              className={commonInputClass}
            />
          </FormField>

          <FormField label="קטגוריה" hint="לדוגמה: מזון, דיור, רכב, הכנסה.">
            <input
              value={formValues.category}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  category: event.target.value,
                }))
              }
              required
              placeholder="קטגוריה"
              className={commonInputClass}
            />
          </FormField>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="סכום" hint="הזן מספר בלבד, ללא סימן ₪.">
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
              className={commonInputClass}
            />
          </FormField>

          <FormField label="תאריך" hint="התאריך שבו הפעולה בוצעה או צפויה להתבצע.">
            <input
              value={formValues.date}
              onChange={(event) =>
                setFormValues((currentValues) => ({
                  ...currentValues,
                  date: event.target.value,
                }))
              }
              required
              type="date"
              className={commonInputClass}
            />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
          {isEditing ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="min-h-11 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-white hover:text-[#111827]"
            >
              ביטול עריכה
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="min-h-11 rounded-2xl bg-[#111827] px-6 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
          >
            {isEditing ? "שמור שינויים" : "הוסף פעולה"}
          </button>
        </div>
      </form>
    </section>
  );
}
