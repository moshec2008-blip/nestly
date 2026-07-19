"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import DateInput from "@/components/ui/DateInput";
import EmptyState from "@/components/ui/EmptyState";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import StatusPill from "@/components/ui/StatusPill";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import {
  isModuleRecord,
  type ModuleRecord,
  type ModuleRecordStatus,
} from "@/types/modules";
import { createUuid } from "@/utils/ids";

type ModuleManagerProps = {
  storageKey: string;
  initialRecords: ModuleRecord[];
  formTitle: string;
  listTitle: string;
  defaultCategory: string;
  addButtonLabel?: string;
  editTitle?: string;
  itemLabel?: string;
  itemPluralLabel?: string;
  titlePlaceholder?: string;
};

type RecordForm = {
  title: string;
  description: string;
  owner: string;
  category: string;
  date: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialForm(defaultCategory: string): RecordForm {
  return {
    title: "",
    description: "",
    owner: "הבית",
    category: defaultCategory,
    date: getTodayDate(),
  };
}

function getFormFromRecord(record: ModuleRecord): RecordForm {
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

function getStatusLabel(status: ModuleRecordStatus) {
  return status === "done" ? "בוצע" : "פתוח";
}

export default function ModuleManager({
  storageKey,
  initialRecords,
  formTitle,
  listTitle,
  defaultCategory,
  addButtonLabel = "הוסף פריט",
  editTitle = "עריכת פריט",
  itemLabel = "פריט",
  itemPluralLabel = "פריטים",
  titlePlaceholder = "שם הפריט",
}: ModuleManagerProps) {
  const { confirm, toast } = useFeedback();
  const [records, setRecords] = usePersistentArrayState<ModuleRecord>(
    storageKey,
    initialRecords,
    isModuleRecord
  );
  const [form, setForm] = useState<RecordForm>(() =>
    getInitialForm(defaultCategory)
  );
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ModuleRecordStatus>(
    "all"
  );
  const [showAllRecords, setShowAllRecords] = useState(false);

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...records]
      .filter((record) => statusFilter === "all" || record.status === statusFilter)
      .filter((record) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          record.title.toLowerCase().includes(normalizedSearch) ||
          record.description.toLowerCase().includes(normalizedSearch) ||
          record.owner.toLowerCase().includes(normalizedSearch) ||
          record.category.toLowerCase().includes(normalizedSearch) ||
          record.date.includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }

        return a.date.localeCompare(b.date);
      });
  }, [records, searchValue, statusFilter]);

  const openCount = records.filter((record) => record.status === "open").length;
  const doneCount = records.filter((record) => record.status === "done").length;
  const displayedRecords = showAllRecords
    ? visibleRecords
    : visibleRecords.slice(0, 5);

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
                  cleanDescription || `${itemLabel} חדש ללא פירוט נוסף.`,
                owner: cleanOwner,
                category: cleanCategory,
                date: form.date,
              }
            : record
        )
      );
      setEditingRecordId(null);
      setForm(getInitialForm(defaultCategory));
      toast({
        title: `${itemLabel} עודכן`,
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    const record: ModuleRecord = {
      id: createUuid(),
      title: cleanTitle,
      description: cleanDescription || `${itemLabel} חדש ללא פירוט נוסף.`,
      owner: cleanOwner,
      category: cleanCategory,
      date: form.date,
      status: "open",
    };

    setRecords((currentRecords) => [record, ...currentRecords]);
    setForm(getInitialForm(defaultCategory));
    toast({
      title: `${itemLabel} חדש נוסף`,
      description: record.title,
      tone: "success",
    });
  }

  function toggleStatus(id: string) {
    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id
          ? record.status === "done"
            ? { ...record, status: "open", completedAt: undefined }
            : { ...record, status: "done", completedAt: new Date().toISOString() }
          : record
      )
    );
  }

  function startEdit(record: ModuleRecord) {
    setEditingRecordId(record.id);
    setForm(getFormFromRecord(record));
  }

  function cancelEdit() {
    setEditingRecordId(null);
    setForm(getInitialForm(defaultCategory));
  }

  async function deleteRecord(id: string) {
    const record = records.find((item) => item.id === id);
    const title = record?.title ?? `${itemLabel} זה`;
    const approved = await confirm({
      title: `מחיקת ${itemLabel}`,
      description: `למחוק את "${title}"? אי אפשר לשחזר אחרי המחיקה.`,
      confirmLabel: `מחק ${itemLabel}`,
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== id)
    );
    if (editingRecordId === id) {
      cancelEdit();
    }
    toast({
      title: `${itemLabel} נמחק`,
      description: title,
      tone: "info",
    });
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "סה״כ", value: records.length },
          { label: "פתוחים", value: openCount },
          { label: "בוצעו", value: doneCount },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-slate-200/75 bg-white/88 p-3 text-right text-slate-950 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
          >
            <p className="truncate text-[11px] font-bold text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-black">{item.value}</p>
          </div>
        ))}
      </div>

      <details className="group rounded-[22px] border border-slate-200/80 bg-white/90 p-3 text-right text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-1 py-1">
            <span className="rounded-full bg-[#111827] px-4 py-2 text-xs font-black text-white shadow-[0_8px_20px_rgba(17,24,39,0.16)] group-open:hidden">
              {addButtonLabel}
          </span>
          <span className="hidden rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-800 group-open:inline">
            סגור
          </span>
          <div>
            <p className="text-[11px] font-bold text-slate-500">
              ניהול מהיר
            </p>
            <h2 className="text-base font-black text-slate-950">
              {editingRecordId ? editTitle : formTitle}
            </h2>
          </div>
        </summary>

        <form onSubmit={handleSubmit} className="mt-3 grid gap-2.5 lg:grid-cols-6">
          <input
            value={form.title}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                title: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 lg:col-span-2"
            placeholder={titlePlaceholder}
          />

          <input
            value={form.owner}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                owner: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
            placeholder="אחראי"
          />

          <input
            value={form.category}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                category: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
            placeholder="קטגוריה"
          />

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
            inputClassName="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none focus:border-slate-400"
          />

          <Button type="submit" tone="primary" size="md">
            {editingRecordId ? "שמור שינויים" : "שמור"}
          </Button>

          {editingRecordId && (
            <Button
              onClick={cancelEdit}
              tone="secondary"
              size="md"
            >
              ביטול עריכה
            </Button>
          )}

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            className="min-h-16 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400 lg:col-span-6"
            placeholder="פירוט קצר"
          />
        </form>
      </details>

      <section className="rounded-[22px] border border-slate-200/80 bg-white/92 p-3 text-right text-slate-950 shadow-[0_14px_36px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button
            onClick={() => {
              setSearchValue("");
              setStatusFilter("all");
            }}
            tone="secondary"
            size="sm"
            className="w-fit"
          >
            נקה סינון
          </Button>

          <div>
            <p className="mb-1 text-xs font-bold text-slate-500">
              {visibleRecords.length} {itemPluralLabel} מוצגים
            </p>
            <h2 className="text-base font-black text-slate-950">{listTitle}</h2>
          </div>
        </div>

        <div className="mb-3 grid gap-2.5 md:grid-cols-2">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
            placeholder="חיפוש לפי שם, אחראי, קטגוריה או תאריך"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | ModuleRecordStatus)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none focus:border-slate-400"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחים בלבד</option>
            <option value="done">בוצעו בלבד</option>
          </select>
        </div>

        {visibleRecords.length === 0 ? (
          <EmptyState
            icon="+"
            title={`אין ${itemPluralLabel} להצגה כרגע`}
            description={`אפשר לשנות סינון או להוסיף ${itemLabel} חדש דרך אזור הניהול המהיר.`}
          />
        ) : (
          <div className="space-y-2">
            {displayedRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/75 p-3 text-right transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(record.id)}
                      className={
                        record.status === "done"
                          ? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                          : "rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                      }
                    >
                      {record.status === "done" ? "פתח מחדש" : "סמן כבוצע"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
                    >
                      מחיקה
                    </button>
                  </div>

                  <div className="max-w-3xl">
                    <div className="mb-2 flex flex-wrap justify-end gap-2 text-xs font-bold">
                      <StatusPill size="sm">
                        {getStatusLabel(record.status)}
                      </StatusPill>
                      <StatusPill size="sm">
                        {record.category}
                      </StatusPill>
                    </div>
                    <h3 className="text-base font-black text-slate-950">{record.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                      {record.description}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      אחראי: {record.owner} | תאריך: {formatDate(record.date)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {visibleRecords.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllRecords((currentValue) => !currentValue)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                {showAllRecords ? "הצג פחות" : `הצג עוד ${visibleRecords.length - 5}`}
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
