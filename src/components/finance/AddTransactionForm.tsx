"use client";

import { useState, type FormEvent } from "react";
import type { FinanceTransaction } from "@/data/finance";

type AddTransactionFormProps = {
  editingTransaction: FinanceTransaction | null;
  onSave: (transaction: FinanceTransaction) => void;
  onCancelEdit: () => void;
};

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

export default function AddTransactionForm({
  editingTransaction,
  onSave,
  onCancelEdit,
}: AddTransactionFormProps) {
  const [formValues, setFormValues] = useState(() =>
    getInitialFormValues(editingTransaction)
  );

  const isEditing = Boolean(editingTransaction);

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
    <section className="rounded-[28px] border border-[rgba(216,180,112,0.14)] bg-[rgba(9,13,27,0.72)] p-5 text-[#fff9ea] shadow-[0_22px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        {isEditing ? (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.1]"
          >
            ביטול עריכה
          </button>
        ) : (
          <div />
        )}

        <h2 className="text-right text-xl font-black">
          {isEditing ? "עריכת פעולה" : "הוספת פעולה"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-6">
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
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-[#8f8879] focus:border-[#d8b470]/50"
        />

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
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-[#8f8879] focus:border-[#d8b470]/50"
        />

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
          placeholder="סכום"
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-[#8f8879] focus:border-[#d8b470]/50"
        />

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
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none focus:border-[#d8b470]/50"
        />

        <select
          value={formValues.type}
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              type: event.target.value as FinanceTransaction["type"],
            }))
          }
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none focus:border-[#d8b470]/50"
        >
          <option value="expense">הוצאה</option>
          <option value="income">הכנסה</option>
        </select>

        <select
          value={formValues.status}
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              status: event.target.value as FinanceTransaction["status"],
            }))
          }
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none focus:border-[#d8b470]/50 md:col-span-2"
        >
          <option value="done">בוצע</option>
          <option value="pending">ממתין</option>
        </select>

        <button
          type="submit"
          className="rounded-2xl bg-[#f4e7c8] px-5 py-3 font-black text-[#080b16] shadow-[0_14px_34px_rgba(216,180,112,0.14)] transition hover:-translate-y-0.5 hover:bg-[#fff3d6] md:col-span-4"
        >
          {isEditing ? "שמור שינויים" : "הוסף פעולה"}
        </button>
      </form>
    </section>
  );
}
