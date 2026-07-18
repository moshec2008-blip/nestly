"use client";

import { useMemo, useState, type FormEvent } from "react";
import DateInput from "@/components/ui/DateInput";
import EmptyState from "@/components/ui/EmptyState";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { initialHealthRecords } from "@/data/modules";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import {
  isModuleRecord,
  type ModuleRecord,
  type ModuleRecordStatus,
} from "@/types/modules";

type HealthForm = {
  title: string;
  description: string;
  owner: string;
  category: string;
  date: string;
};

const healthCategories = ["הכל", "תורים", "בדיקות", "תרופות", "מעקב"];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialForm(): HealthForm {
  return {
    title: "",
    description: "",
    owner: "הבית",
    category: "תורים",
    date: getTodayDate(),
  };
}

function getFormFromRecord(record: ModuleRecord): HealthForm {
  return {
    title: record.title,
    description: record.description,
    owner: record.owner,
    category: record.category,
    date: record.date,
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysUntil(date: string) {
  const today = new Date(getTodayDate());
  const targetDate = new Date(date);
  const difference = targetDate.getTime() - today.getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getDateLabel(date: string) {
  const daysUntil = getDaysUntil(date);

  if (daysUntil < 0) {
    return `באיחור ${Math.abs(daysUntil)} ימים`;
  }

  if (daysUntil === 0) {
    return "היום";
  }

  if (daysUntil === 1) {
    return "מחר";
  }

  return `בעוד ${daysUntil} ימים`;
}

function getStatusLabel(status: ModuleRecordStatus) {
  return status === "done" ? "בוצע" : "פתוח";
}

export default function HealthManager() {
  const { confirm, toast } = useFeedback();
  const [records, setRecords] = usePersistentArrayState<ModuleRecord>(
    storageKeys.health,
    initialHealthRecords,
    isModuleRecord
  );
  const [form, setForm] = useState<HealthForm>(() => getInitialForm());
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("הכל");
  const [statusFilter, setStatusFilter] =
    useState<"all" | ModuleRecordStatus>("all");

  const openRecords = useMemo(
    () =>
      records
        .filter((record) => record.status === "open")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [records]
  );
  const nextRecord = openRecords[0] ?? null;
  const overdueCount = openRecords.filter(
    (record) => getDaysUntil(record.date) < 0
  ).length;

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...records]
      .filter(
        (record) =>
          categoryFilter === "הכל" || record.category === categoryFilter
      )
      .filter((record) => statusFilter === "all" || record.status === statusFilter)
      .filter((record) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          record.title.toLowerCase().includes(normalizedSearch) ||
          record.description.toLowerCase().includes(normalizedSearch) ||
          record.owner.toLowerCase().includes(normalizedSearch) ||
          record.category.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }

        return a.date.localeCompare(b.date);
      });
  }, [categoryFilter, records, searchValue, statusFilter]);

  function resetForm() {
    setForm(getInitialForm());
    setEditingRecordId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanDescription = form.description.trim();
    const cleanOwner = form.owner.trim();
    const cleanCategory = form.category.trim();

    if (!cleanTitle || !cleanOwner || !cleanCategory || !form.date) {
      return;
    }

    if (editingRecordId) {
      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.id === editingRecordId
            ? {
                ...record,
                title: cleanTitle,
                description:
                  cleanDescription || "תזכורת רפואית ללא פירוט נוסף.",
                owner: cleanOwner,
                category: cleanCategory,
                date: form.date,
              }
            : record
        )
      );
      resetForm();
      setIsFormOpen(false);
      toast({
        title: "התזכורת הרפואית עודכנה",
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    const record: ModuleRecord = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      description: cleanDescription || "תזכורת רפואית ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      date: form.date,
      status: "open",
    };

    setRecords((currentRecords) => [record, ...currentRecords]);
    resetForm();
    setIsFormOpen(false);
    toast({
      title: "תזכורת רפואית נוספה",
      description: record.title,
      tone: "success",
    });
  }

  function toggleStatus(id: string) {
    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id
          ? { ...record, status: record.status === "done" ? "open" : "done" }
          : record
      )
    );
  }

  function startEdit(record: ModuleRecord) {
    setEditingRecordId(record.id);
    setForm(getFormFromRecord(record));
    setIsFormOpen(true);
  }

  async function deleteRecord(id: string) {
    const record = records.find((item) => item.id === id);
    const title = record?.title ?? "התזכורת הזו";
    const approved = await confirm({
      title: "מחיקת תזכורת רפואית",
      description: `למחוק את "${title}"? אי אפשר לשחזר אחרי המחיקה.`,
      confirmLabel: "מחק תזכורת",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== id)
    );
    toast({
      title: "התזכורת נמחקה",
      description: title,
      tone: "info",
    });
  }

  return (
    <section className="space-y-3 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] lg:pb-0">
      <section className="nestly-card p-3 text-right">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#007aff]">מרכז בריאות</p>
            <h2 className="mt-1 text-xl font-black text-[#111827]">
              מה צריך לזכור לבריאות המשפחה?
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              תורים, בדיקות, תרופות ומעקב רפואי בלי עומס.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsFormOpen((currentValue) => !currentValue);
            }}
            className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-[0_10px_22px_rgba(33,43,63,0.08)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b470]"
          >
            {isFormOpen ? "סגור" : "+ תזכורת רפואית"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-2xl bg-[#f0f7ff] p-3 ring-1 ring-[#cfe5ff]">
            <p className="text-[11px] font-black text-[#0056b3]">
              הדבר הקרוב
            </p>
            <p className="mt-1 line-clamp-1 text-base font-black text-[#111827]">
              {nextRecord ? nextRecord.title : "אין תזכורות פתוחות"}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              {nextRecord
                ? `${getDateLabel(nextRecord.date)} · ${formatDate(nextRecord.date)}`
                : "אפשר להוסיף תור, בדיקה או תרופה"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfcd]/80">
            <p className="text-[11px] font-black text-slate-500">פתוחים</p>
            <p className="mt-1 text-xl font-black text-[#111827]">
              {openRecords.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfcd]/80">
            <p className="text-[11px] font-black text-slate-500">דורשים תשומת לב</p>
            <p className="mt-1 text-xl font-black text-rose-700">
              {overdueCount}
            </p>
          </div>
        </div>
      </section>

      {isFormOpen && (
        <section className="nestly-card p-3 text-right">
          <div className="mb-3">
            <p className="text-xs font-bold text-slate-500">ניהול מהיר</p>
            <h2 className="text-base font-black text-[#111827]">
              {editingRecordId ? "עריכת תזכורת רפואית" : "הוספת תזכורת רפואית"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-2.5 lg:grid-cols-6">
            <label className="grid gap-1 lg:col-span-2">
              <span className="text-xs font-bold text-slate-600">שם התזכורת</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="בדיקה, תור, תרופה..."
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">עבור מי</span>
              <input
                value={form.owner}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    owner: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="בן משפחה"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">סוג</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    category: event.target.value,
                  }))
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
              >
                {healthCategories
                  .filter((category) => category !== "הכל")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </label>

            <DateInput
              value={form.date}
              onChange={(date) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  date,
                }))
              }
              required
              label="תאריך"
              inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="min-h-11 flex-1 rounded-2xl bg-[#007aff] px-4 text-sm font-black text-white transition hover:bg-[#0065d1]"
              >
                {editingRecordId ? "שמור" : "הוסף"}
              </button>
              {editingRecordId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsFormOpen(false);
                  }}
                  className="min-h-11 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-800 transition hover:bg-white"
                >
                  ביטול
                </button>
              )}
            </div>

            <label className="grid gap-1 lg:col-span-6">
              <span className="text-xs font-bold text-slate-600">
                פירוט קצר
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                className="min-h-16 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="רופא, כתובת, הכנה לבדיקה או מינון..."
              />
            </label>
          </form>
        </section>
      )}

      <section className="nestly-card p-3 text-right">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              setCategoryFilter("הכל");
              setStatusFilter("all");
            }}
            className="w-fit rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-white"
          >
            נקה
          </button>
          <div>
            <p className="text-xs font-bold text-slate-500">
              {visibleRecords.length} תזכורות מוצגות
            </p>
            <h2 className="text-base font-black text-[#111827]">מעקב בריאות</h2>
          </div>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto]">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-400"
            placeholder="חיפוש לפי תור, בן משפחה או סוג"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | ModuleRecordStatus)
            }
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחים</option>
            <option value="done">בוצעו</option>
          </select>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {healthCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={[
                "min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition",
                categoryFilter === category
                  ? "border border-[#d8caba] bg-[#fffdf8] text-[#111827] shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-white",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleRecords.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon="❤️"
            title="אין תזכורות בריאות פתוחות"
            description="כשתוסיפו תור, בדיקה, תרופה או מעקב משפחתי, הם יופיעו כאן בצורה מסודרת."
          />
        ) : (
          <div className="mt-3 divide-y divide-slate-200/75">
            {visibleRecords.map((record) => (
              <article
                key={record.id}
                className="grid gap-2 py-3 md:grid-cols-[auto_1fr_auto] md:items-center"
              >
                <div className="flex justify-end gap-2 md:order-3">
                  <button
                    type="button"
                    onClick={() => toggleStatus(record.id)}
                    className={[
                      "min-h-9 rounded-full px-3 text-xs font-black transition",
                      record.status === "done"
                        ? "bg-slate-100 text-slate-700 hover:bg-white"
                        : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100",
                    ].join(" ")}
                  >
                    {record.status === "done" ? "פתח" : "בוצע"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(record)}
                    className="min-h-9 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-white"
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRecord(record.id)}
                    className="min-h-9 rounded-full bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                  >
                    מחיקה
                  </button>
                </div>

                <div className="min-w-0 text-right md:order-2">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="rounded-full bg-[#f0f7ff] px-2 py-1 text-[11px] font-black text-[#0056b3]">
                      {record.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                      {getStatusLabel(record.status)}
                    </span>
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-base font-black text-[#111827]">
                    {record.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-600">
                    {record.description}
                  </p>
                </div>

                <div className="text-right md:order-1 md:min-w-28">
                  <p
                    className={[
                      "text-sm font-black",
                      getDaysUntil(record.date) < 0
                        ? "text-rose-700"
                        : "text-[#111827]",
                    ].join(" ")}
                  >
                    {getDateLabel(record.date)}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    {formatDate(record.date)} · {record.owner}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
