"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import type { ModuleRecord, ModuleRecordStatus } from "@/types/modules";

type ModuleManagerProps = {
  storageKey: string;
  initialRecords: ModuleRecord[];
  formTitle: string;
  listTitle: string;
  defaultCategory: string;
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
}: ModuleManagerProps) {
  const { confirm, toast } = useFeedback();
  const [records, setRecords] = usePersistentArrayState<ModuleRecord>(
    storageKey,
    initialRecords
  );
  const [form, setForm] = useState<RecordForm>(() =>
    getInitialForm(defaultCategory)
  );
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

    const record: ModuleRecord = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      description: cleanDescription || "פריט חדש ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      date: form.date,
      status: "open",
    };

    setRecords((currentRecords) => [record, ...currentRecords]);
    setForm(getInitialForm(defaultCategory));
    toast({
      title: "פריט חדש נוסף",
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

  async function deleteRecord(id: string) {
    const record = records.find((item) => item.id === id);
    const title = record?.title ?? "הפריט הזה";
    const approved = await confirm({
      title: "מחיקת פריט",
      description: `למחוק את "${title}"? אי אפשר לשחזר את הפריט אחרי המחיקה.`,
      confirmLabel: "מחק פריט",
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
      title: "הפריט נמחק",
      description: title,
      tone: "info",
    });
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">סהכ פריטים</p>
          <p className="mt-1 text-xl font-black">{records.length}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">פתוחים</p>
          <p className="mt-1 text-xl font-black">{openCount}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">בוצעו</p>
          <p className="mt-1 text-xl font-black">{doneCount}</p>
        </div>
      </div>

      <details className="group rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-1 py-1">
          <span className="text-sm font-bold text-[#d8b470] group-open:hidden">
            פתיחה
          </span>
          <span className="text-sm font-bold text-[#d8b470] hidden group-open:inline">
            סגירה
          </span>
          <div>
            <p className="text-[11px] text-slate-400">ניהול פריטים</p>
            <h2 className="text-lg font-black">{formTitle}</h2>
          </div>
        </summary>

        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 lg:grid-cols-6">
          <input
            value={form.title}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                title: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="שם הפריט"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="קטגוריה"
          />

          <input
            value={form.date}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                date: event.target.value,
              }))
            }
            required
            type="date"
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          />

          <button
            type="submit"
            className="rounded-2xl bg-[#f4e7c8] px-5 py-3 text-sm font-black text-slate-950 hover:bg-[#fff3d6]"
          >
            הוסף
          </button>

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            className="min-h-20 resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-6"
            placeholder="פירוט קצר"
          />
        </form>
      </details>

      <section className="rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              setStatusFilter("all");
            }}
            className="w-fit rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.1]"
          >
            נקה סינון
          </button>

          <div>
            <p className="mb-1 text-xs text-slate-400">
              {visibleRecords.length} פריטים מוצגים
            </p>
            <h2 className="text-lg font-black">{listTitle}</h2>
          </div>
        </div>

        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="חיפוש לפי שם, אחראי, קטגוריה או תאריך"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | ModuleRecordStatus)
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחים בלבד</option>
            <option value="done">בוצעו בלבד</option>
          </select>
        </div>

        {visibleRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            אין פריטים להצגה לפי הסינון הנוכחי.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 text-right"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(record.id)}
                      className={
                        record.status === "done"
                          ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                          : "rounded-xl bg-emerald-400/14 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/20"
                      }
                    >
                      {record.status === "done" ? "פתח מחדש" : "סמן כבוצע"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      className="rounded-xl bg-[#b86f68]/14 px-4 py-2 text-sm font-bold text-[#f0c6bd] hover:bg-[#b86f68]/20"
                    >
                      מחיקה
                    </button>
                  </div>

                  <div className="max-w-3xl">
                    <div className="mb-3 flex flex-wrap justify-end gap-2 text-xs font-bold">
                      <span className="rounded-full bg-white/[0.07] px-3 py-1 text-slate-300">
                        {getStatusLabel(record.status)}
                      </span>
                      <span className="rounded-full bg-white/[0.07] px-3 py-1 text-slate-300">
                        {record.category}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">{record.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                      {record.description}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.09]"
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
