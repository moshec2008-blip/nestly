import { useState, type FormEvent } from "react";
import type { FamilyTask } from "@/data/tasks";
import AISuggestionCard from "@/components/ai/AISuggestionCard";
import DateInput from "@/components/ui/DateInput";
import { suggestTaskFields } from "@/services/ai/contextualSuggestionService";
import type { AISuggestion } from "@/types/aiSuggestions";
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
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionNotice, setSuggestionNotice] = useState("");

  function requestSuggestions() {
    const sourceText = [form.title, form.description].filter(Boolean).join(". ");
    const nextSuggestions = suggestTaskFields({
      sourceModule: "tasks",
      sourceEntityType: "task_draft",
      sourceEntityId: form.title || "new-task",
      text: sourceText,
    });

    setSuggestions(nextSuggestions);
    setSuggestionNotice(
      nextSuggestions.length === 0
        ? "לא נמצאו הצעות בטוחות. אפשר להמשיך למלא ידנית."
        : ""
    );
  }

  function applySuggestion(suggestion: AISuggestion) {
    const values = suggestion.proposedValues;

    onChange({
      ...form,
      title:
        typeof values.title === "string" && values.title
          ? values.title
          : form.title,
      category:
        typeof values.category === "string" && values.category
          ? values.category
          : form.category,
      priority:
        values.priority === "high" ||
        values.priority === "medium" ||
        values.priority === "low"
          ? values.priority
          : form.priority,
      dueDate:
        typeof values.dueDate === "string" && values.dueDate
          ? values.dueDate
          : form.dueDate,
    });
    setSuggestions((current) =>
      current.filter((item) => item.id !== suggestion.id)
    );
    setSuggestionNotice("ההצעה הוחלה בשדות. אפשר לערוך לפני שמירה.");
  }

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

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] px-3 py-2">
        <p className="text-xs font-semibold leading-5 text-slate-600">
          הצעות חכמות עוזרות לקצר כותרת, לזהות קטגוריה ותאריך. שום דבר לא נשמר בלי אישור.
        </p>
        <button
          type="button"
          onClick={requestSuggestions}
          className="min-h-10 rounded-2xl border border-[#d8caba] bg-white px-3 text-xs font-black text-[#111827] shadow-sm transition hover:bg-[#fff8eb]"
        >
          הצעות חכמות
        </button>
      </div>

      {suggestionNotice ? (
        <p className="mt-2 rounded-2xl bg-[#fff8eb] px-3 py-2 text-xs font-bold text-[#7a5212]">
          {suggestionNotice}
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {suggestions.map((suggestion) => (
            <AISuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              applyLabel="החל בשדות"
              onApply={applySuggestion}
              onReject={(rejectedSuggestion) =>
                setSuggestions((current) =>
                  current.filter((item) => item.id !== rejectedSuggestion.id)
                )
              }
            />
          ))}
        </div>
      ) : null}

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
