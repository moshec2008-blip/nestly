import type { FormEvent } from "react";
import type { FamilyTask } from "@/data/tasks";
import DateInput from "@/components/ui/DateInput";
import type { TaskFormValues } from "@/components/tasks/taskTypes";

type TaskFormProps = {
  form: TaskFormValues;
  isEditing: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onChange: (nextForm: TaskFormValues) => void;
};

const inputClass =
  "min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55";

export default function TaskForm({
  form,
  isEditing,
  onSubmit,
  onClose,
  onChange,
}: TaskFormProps) {
  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 hover:bg-white"
        >
          סגור טופס
        </button>

        <div>
          <p className="text-[11px] font-bold text-slate-500">
            {isEditing ? "עריכת משימה" : "פתיחת משימה"}
          </p>
          <h2 className="text-sm font-black text-[#111827]">
            {isEditing ? "עדכון משימה קיימת" : "ניהול משימות הבית"}
          </h2>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-2.5 grid gap-2 rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-2.5 lg:grid-cols-6"
      >
        <input
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          required
          className={`${inputClass} lg:col-span-2`}
          placeholder="שם המשימה"
        />

        <input
          value={form.owner}
          onChange={(event) => onChange({ ...form, owner: event.target.value })}
          required
          className={inputClass}
          placeholder="אחראי"
        />

        <input
          value={form.category}
          onChange={(event) =>
            onChange({ ...form, category: event.target.value })
          }
          required
          className={inputClass}
          placeholder="קטגוריה"
        />

        <select
          value={form.priority}
          onChange={(event) =>
            onChange({
              ...form,
              priority: event.target.value as FamilyTask["priority"],
            })
          }
          className={inputClass}
        >
          <option value="high">עדיפות גבוהה</option>
          <option value="medium">עדיפות בינונית</option>
          <option value="low">עדיפות נמוכה</option>
        </select>

        <DateInput
          value={form.dueDate}
          onChange={(dueDate) => onChange({ ...form, dueDate })}
          required
          label="תאריך יעד"
          inputClassName={`w-full ${inputClass}`}
        />

        <textarea
          value={form.description}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
          }
          className="min-h-16 resize-y rounded-2xl border border-[#d9dde5] bg-white px-3 py-2 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55 lg:col-span-5"
          placeholder="פירוט קצר"
        />

        <button
          type="submit"
          className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 py-2 text-sm font-black text-[#111827] shadow-[0_8px_18px_rgba(33,43,63,0.06)] transition hover:bg-white"
        >
          {isEditing ? "שמור" : "פתח"}
        </button>
      </form>
    </section>
  );
}
