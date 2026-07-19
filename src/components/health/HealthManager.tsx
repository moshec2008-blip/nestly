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
import { createUuid } from "@/utils/ids";

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

// ניסוח אנושי ורגוע — לא "באיחור", אלא "מחכה".
function getCareDateLabel(date: string) {
  const daysUntil = getDaysUntil(date);

  if (daysUntil < -1) {
    return `מחכה כבר ${Math.abs(daysUntil)} ימים`;
  }

  if (daysUntil === -1) {
    return "מחכה מאתמול";
  }

  if (daysUntil === 0) {
    return "היום";
  }

  if (daysUntil === 1) {
    return "מחר";
  }

  if (daysUntil <= 7) {
    return `בעוד ${daysUntil} ימים`;
  }

  if (daysUntil <= 30) {
    const weeks = Math.round(daysUntil / 7);
    return weeks === 1 ? "בעוד שבוע" : `בעוד ${weeks} שבועות`;
  }

  const months = Math.round(daysUntil / 30);
  return months === 1 ? "בעוד חודש" : `בעוד ${months} חודשים`;
}

// משפט אנושי על פריט: "דנה · תור לרופאת שיניים".
function getCareSentence(record: ModuleRecord) {
  return record.owner === "הבית"
    ? record.title
    : `${record.owner} · ${record.title}`;
}

type TimelineGroup = {
  id: string;
  label: string;
  records: ModuleRecord[];
};

function groupUpcoming(records: ModuleRecord[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [
    { id: "today", label: "היום", records: [] },
    { id: "tomorrow", label: "מחר", records: [] },
    { id: "week", label: "השבוע הקרוב", records: [] },
    { id: "later", label: "בהמשך", records: [] },
  ];

  for (const record of records) {
    const daysUntil = getDaysUntil(record.date);

    if (daysUntil === 0) {
      groups[0].records.push(record);
    } else if (daysUntil === 1) {
      groups[1].records.push(record);
    } else if (daysUntil <= 7) {
      groups[2].records.push(record);
    } else {
      groups[3].records.push(record);
    }
  }

  return groups.filter((group) => group.records.length > 0);
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
  const [isManageOpen, setIsManageOpen] = useState(false);
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

  // מי צריך תשומת לב עכשיו — דברים שהתאריך שלהם עבר ועדיין פתוחים.
  const needsAttention = useMemo(
    () => openRecords.filter((record) => getDaysUntil(record.date) < 0),
    [openRecords]
  );

  const upcoming = useMemo(
    () => openRecords.filter((record) => getDaysUntil(record.date) >= 0),
    [openRecords]
  );

  const upcomingGroups = useMemo(() => groupUpcoming(upcoming), [upcoming]);

  const recentlyDone = useMemo(
    () =>
      records
        .filter((record) => record.status === "done")
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [records]
  );

  // תמונת מצב פר-אדם: עונה על "כולם בסדר?" במבט אחד.
  const familyStatus = useMemo(() => {
    const people = Array.from(new Set(records.map((record) => record.owner)));

    return people
      .map((person) => {
        const personOpen = openRecords.filter(
          (record) => record.owner === person
        );
        const personOverdue = personOpen.some(
          (record) => getDaysUntil(record.date) < 0
        );
        const nextRecord = personOpen.find(
          (record) => getDaysUntil(record.date) >= 0
        );

        return { person, personOverdue, nextRecord, openCount: personOpen.length };
      })
      .sort((a, b) => {
        if (a.personOverdue !== b.personOverdue) {
          return a.personOverdue ? -1 : 1;
        }

        return b.openCount - a.openCount;
      });
  }, [records, openRecords]);

  // המשפט הראשון שהורה רואה — עונה על "הכול בסדר?" בלי מספרים.
  const careHeadline = useMemo(() => {
    if (needsAttention.length > 0) {
      const first = needsAttention[0];
      return {
        tone: "attention" as const,
        title:
          needsAttention.length === 1
            ? `${getCareSentence(first)} — ${getCareDateLabel(first.date)}`
            : `כמה דברים מחכים לטיפול, הוותיק ביותר: ${getCareSentence(first)}`,
        subtitle: "שווה להציץ ברשימה שלמטה ולסמן מה כבר טופל.",
      };
    }

    const next = upcoming[0];

    if (!next) {
      return {
        tone: "calm" as const,
        title: "כולם בסדר — אין תורים או תזכורות פתוחות",
        subtitle: "כשתוסיפו תור, בדיקה או תרופה, נזכיר בזמן.",
      };
    }

    const daysUntil = getDaysUntil(next.date);

    if (daysUntil <= 7) {
      return {
        tone: "soon" as const,
        title: `${getCareSentence(next)} — ${getCareDateLabel(next.date)}`,
        subtitle: "זה הדבר הקרוב ביותר. כל השאר מסודר למטה לפי זמן.",
      };
    }

    return {
      tone: "calm" as const,
      title: "השבוע הקרוב פנוי — אין תורים קרובים",
      subtitle: `הדבר הבא: ${getCareSentence(next)}, ${getCareDateLabel(next.date)}.`,
    };
  }, [needsAttention, upcoming]);

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
      id: createUuid(),
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

  // שורת טיפול אחת — אנשים קודם, פעולות שקטות.
  function renderCareRow(record: ModuleRecord, showWaiting = false) {
    return (
      <article
        key={record.id}
        className="flex flex-wrap items-center justify-between gap-2 py-2.5"
      >
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => toggleStatus(record.id)}
            className="min-h-9 rounded-full bg-emerald-50 px-3 text-xs font-black text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
          >
            טופל
          </button>
          <button
            type="button"
            onClick={() => startEdit(record)}
            className="min-h-9 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-600 transition hover:bg-white"
          >
            עריכה
          </button>
        </div>

        <div className="min-w-0 flex-1 text-right">
          <h4 className="text-base font-black text-[#111827]">
            {getCareSentence(record)}
          </h4>
          <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-600">
            {record.description}
          </p>
          <p
            className={[
              "mt-0.5 text-xs font-bold",
              showWaiting ? "text-amber-700" : "text-slate-500",
            ].join(" ")}
          >
            {getCareDateLabel(record.date)} · {formatDate(record.date)} ·{" "}
            {record.category}
          </p>
        </div>
      </article>
    );
  }

  return (
    <section className="space-y-3 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] lg:pb-0">
      {/* מבט ראשון: הכול בסדר? מי צריך תשומת לב? — בלי מספרים. */}
      <section className="nestly-card p-4 text-right">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#007aff]">בריאות המשפחה</p>
            <h2
              className={[
                "mt-1 text-xl font-black leading-8",
                careHeadline.tone === "attention"
                  ? "text-amber-800"
                  : "text-[#111827]",
              ].join(" ")}
            >
              {careHeadline.title}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {careHeadline.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsFormOpen((currentValue) => !currentValue);
            }}
            className="min-h-11 shrink-0 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-[0_10px_22px_rgba(33,43,63,0.08)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b470]"
          >
            {isFormOpen ? "סגור" : "+ תור, בדיקה או תרופה"}
          </button>
        </div>

        {familyStatus.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {familyStatus.map(({ person, personOverdue, nextRecord }) => (
              <span
                key={person}
                className={[
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold",
                  personOverdue
                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    : "bg-white text-slate-700 ring-1 ring-[#eadfcd]/80",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "h-2 w-2 rounded-full",
                    personOverdue
                      ? "bg-amber-500"
                      : nextRecord
                        ? "bg-[#007aff]"
                        : "bg-emerald-500",
                  ].join(" ")}
                />
                <span className="font-black">{person}</span>
                <span className="text-slate-500">
                  {personOverdue
                    ? "מחכה לטיפול"
                    : nextRecord
                      ? getCareDateLabel(nextRecord.date)
                      : "הכול בסדר"}
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      {isFormOpen && (
        <section className="nestly-card p-3 text-right">
          <div className="mb-3">
            <h2 className="text-base font-black text-[#111827]">
              {editingRecordId ? "עריכת תזכורת רפואית" : "מה להוסיף למעקב?"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-2.5 lg:grid-cols-6">
            <label className="grid gap-1 lg:col-span-2">
              <span className="text-xs font-bold text-slate-600">מה קורה</span>
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
                placeholder="תור לרופאת ילדים, חידוש מרשם..."
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
              label="מתי"
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
                פרטים שיעזרו ביום עצמו
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

      {/* דורש תשומת לב — מופיע רק כשבאמת יש משהו שמחכה. */}
      {needsAttention.length > 0 && (
        <section className="nestly-card border-amber-200/70 bg-amber-50/40 p-3 text-right">
          <h3 className="text-base font-black text-amber-900">
            מחכה לטיפול
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-amber-800/80">
            דברים שהתאריך שלהם עבר. אם כבר טופלו — סמנו וזה יירד מהרשימה.
          </p>
          <div className="mt-1 divide-y divide-amber-200/50">
            {needsAttention.map((record) => renderCareRow(record, true))}
          </div>
        </section>
      )}

      {/* התוכן הראשי: ציר טיפולים קרובים. */}
      <section className="nestly-card p-3 text-right">
        <h3 className="text-base font-black text-[#111827]">הטיפול הקרוב</h3>

        {upcomingGroups.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon="💚"
            title={
              needsAttention.length > 0
                ? "אין תורים עתידיים קבועים"
                : "אין תורים קרובים — אפשר לנשום"
            }
            description="כשתוסיפו תור, בדיקה או תרופה, הם יסתדרו כאן לפי זמן."
          />
        ) : (
          <div className="mt-1 space-y-3">
            {upcomingGroups.map((group) => (
              <div key={group.id}>
                <p className="border-b border-slate-200/75 pb-1 text-xs font-black text-[#0056b3]">
                  {group.label}
                </p>
                <div className="divide-y divide-slate-200/60">
                  {group.records.map((record) => renderCareRow(record))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* מה קרה לאחרונה — תחושת רצף וביטחון, לא סטטיסטיקה. */}
      {recentlyDone.length > 0 && (
        <section className="nestly-card p-3 text-right">
          <h3 className="text-base font-black text-[#111827]">
            טופל לאחרונה
          </h3>
          <div className="mt-1 divide-y divide-slate-200/60">
            {recentlyDone.map((record) => (
              <article
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => toggleStatus(record.id)}
                  className="min-h-9 shrink-0 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-600 transition hover:bg-white"
                >
                  החזר למעקב
                </button>
                <div className="min-w-0 flex-1 text-right">
                  <h4 className="text-sm font-black text-slate-700">
                    <span aria-hidden="true">✓ </span>
                    {getCareSentence(record)}
                  </h4>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    {formatDate(record.date)} · {record.category}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ניהול מלא — חיפוש, סינון וכל הרשומות. משני בכוונה. */}
      <section className="nestly-card p-3 text-right">
        <button
          type="button"
          onClick={() => setIsManageOpen((currentValue) => !currentValue)}
          aria-expanded={isManageOpen}
          className="flex w-full items-center justify-between gap-2 text-right"
        >
          <span
            aria-hidden="true"
            className="text-xs font-black text-slate-500"
          >
            {isManageOpen ? "−" : "+"}
          </span>
          <span>
            <span className="block text-base font-black text-[#111827]">
              כל הרשומות וחיפוש
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-slate-500">
              {records.length} רשומות · {openRecords.length} במעקב פעיל
            </span>
          </span>
        </button>

        {isManageOpen && (
          <div className="mt-3">
            <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-400"
                placeholder="חיפוש לפי תור, בן משפחה או סוג"
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | ModuleRecordStatus
                  )
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="open">פתוחים</option>
                <option value="done">בוצעו</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setCategoryFilter("הכל");
                  setStatusFilter("all");
                }}
                className="min-h-11 rounded-2xl bg-slate-100 px-4 text-xs font-black text-slate-700 transition hover:bg-white"
              >
                נקה
              </button>
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
                icon="🔍"
                title="לא נמצאו רשומות מתאימות"
                description="נסו לשנות את החיפוש או הסינון."
              />
            ) : (
              <div className="mt-2 divide-y divide-slate-200/75">
                {visibleRecords.map((record) => (
                  <article
                    key={record.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  >
                    <div className="flex shrink-0 gap-1.5">
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
                        {record.status === "done" ? "החזר" : "טופל"}
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

                    <div className="min-w-0 flex-1 text-right">
                      <h4
                        className={[
                          "text-sm font-black",
                          record.status === "done"
                            ? "text-slate-500"
                            : "text-[#111827]",
                        ].join(" ")}
                      >
                        {getCareSentence(record)}
                      </h4>
                      <p className="mt-0.5 text-xs font-bold text-slate-500">
                        {getCareDateLabel(record.date)} · {formatDate(record.date)}{" "}
                        · {record.category}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
