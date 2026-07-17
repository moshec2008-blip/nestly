"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import {
  archiveLegacyRecord,
  createLegacyCollection,
  getFamilyHistoryItems,
  getLegacyCollections,
  getSmartConnectionReviews,
  getYearlyLegacyReview,
  restoreLegacyRecord,
} from "@/services/familyLegacy";
import { restoreKnowledgeRevision } from "@/services/familyKnowledge";
import { readKnowledgeRevisions } from "@/services/knowledgeRevisions";
import type { LegacyCategory, LegacyHistoryItem } from "@/types/legacy";

const categoryLabels: Record<LegacyCategory | "all", string> = {
  all: "הכל",
  home: "בית",
  family: "משפחה",
  documents: "מסמכים",
  finance: "כספים",
  vehicles: "רכבים",
  health: "בריאות",
  shopping: "קניות",
  tasks: "משימות",
  events: "אירועים",
  knowledge: "ידע",
  custom: "אחר",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function categoryTone(category: LegacyCategory) {
  const tones: Record<LegacyCategory, string> = {
    home: "bg-sky-50 text-sky-700 ring-sky-100",
    family: "bg-violet-50 text-violet-700 ring-violet-100",
    documents: "bg-purple-50 text-purple-700 ring-purple-100",
    finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    vehicles: "bg-blue-50 text-blue-700 ring-blue-100",
    health: "bg-rose-50 text-rose-700 ring-rose-100",
    shopping: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    tasks: "bg-amber-50 text-amber-700 ring-amber-100",
    events: "bg-pink-50 text-pink-700 ring-pink-100",
    knowledge: "bg-teal-50 text-teal-700 ring-teal-100",
    custom: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return tones[category];
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/92 p-4 text-right shadow-sm ring-1 ring-[#eadfcd]">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function HistoryRow({
  item,
  onArchive,
  onRestore,
}: {
  item: LegacyHistoryItem;
  onArchive: (item: LegacyHistoryItem) => void;
  onRestore: (item: LegacyHistoryItem) => void;
}) {
  return (
    <article className="rounded-[22px] bg-white/92 px-4 py-3 shadow-sm ring-1 ring-[#edf0f4] transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (item.archived ? onRestore(item) : onArchive(item))}
            className="min-h-9 rounded-2xl border border-[#d8c8b4] bg-[#fffdf8] px-3 text-xs font-black text-slate-700 transition hover:bg-white"
          >
            {item.archived ? "שחזר" : "ארכב"}
          </button>
          <Link
            href={item.sourceUrl}
            className="min-h-9 rounded-2xl border border-[#d8c8b4] bg-white px-3 pt-2 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
          >
            פתח
          </Link>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {item.milestone ? (
              <span className="rounded-full bg-[#fff8d8] px-2.5 py-1 text-[11px] font-black text-amber-800 ring-1 ring-amber-100">
                אבן דרך
              </span>
            ) : null}
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                categoryTone(item.category),
              ].join(" ")}
            >
              {categoryLabels[item.category]}
            </span>
            <p className="truncate text-base font-black text-slate-950">
              {item.title}
            </p>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
            {item.description || "פריט משמעותי בזיכרון המשפחתי."}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-500">
            {formatDate(item.occurredAt)} ·{" "}
            {item.tags.slice(0, 3).join(" · ") || "ללא תגיות"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function FamilyLegacyPage() {
  const [year, setYear] = useState<number | "all">("all");
  const [category, setCategory] = useState<LegacyCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [version, setVersion] = useState(0);

  const history = useMemo(() => {
    void version;
    return getFamilyHistoryItems({
      includeArchived,
      year: year === "all" ? undefined : year,
      category,
      search,
    });
  }, [category, includeArchived, search, version, year]);
  const allHistory = useMemo(() => {
    void version;
    return getFamilyHistoryItems({ includeArchived: true });
  }, [version]);
  const years = useMemo(
    () =>
      Array.from(new Set(allHistory.map((item) => item.year))).sort(
        (first, second) => second - first
      ),
    [allHistory]
  );
  const collections = useMemo(() => {
    void version;
    return getLegacyCollections();
  }, [version]);
  const revisions = useMemo(() => {
    void version;
    return readKnowledgeRevisions().slice(0, 5);
  }, [version]);
  const connectionReviews = useMemo(() => {
    void version;
    return getSmartConnectionReviews();
  }, [version]);
  const review = useMemo(() => {
    void version;
    return getYearlyLegacyReview(
      year === "all" ? new Date().getFullYear() : year
    );
  }, [year, version]);

  function refresh() {
    setVersion((current) => current + 1);
  }

  function handleCreateCollection() {
    createLegacyCollection({
      title: "אוסף משפחתי חדש",
      description: "אוסף שמחבר דברים שכדאי לזכור לאורך זמן.",
      category: "family",
      tags: ["זיכרון", "משפחה"],
      linkedRecordIds: history
        .filter((item) => item.milestone)
        .slice(0, 6)
        .map((item) => item.id),
    });
    refresh();
  }

  return (
    <section className="space-y-4 text-right text-slate-950">
      <section className="rounded-[28px] bg-gradient-to-l from-[#eef7ff] via-white to-[#fff8eb] p-5 shadow-[0_18px_46px_rgba(33,43,63,0.08)] ring-1 ring-[#d7e2f1]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCreateCollection}
            className="nestly-primary-action min-h-11 rounded-2xl border border-[#d8b470] bg-[#fffdf8] px-4 text-sm font-black text-slate-900 shadow-sm transition hover:bg-white"
          >
            + צור אוסף
          </button>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#1f5f9f] shadow-sm ring-1 ring-[#d7e2f1]">
              <AppIcon name="knowledge" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-[#007aff]">
                הזיכרון הדיגיטלי של הבית
              </p>
              <h1 className="text-3xl font-black">מורשת משפחתית</h1>
            </div>
          </div>
        </div>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
          כל מה שחשוב לזכור לאורך שנים: מסמכים, ידע, אירועים, רכבים,
          פרויקטים ואבני דרך, בלי לשכפל מידע ובלי להעמיס על היום-יום.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="פריטים בזיכרון" value={allHistory.length} />
        <StatCard
          label="אבני דרך"
          value={allHistory.filter((item) => item.milestone).length}
        />
        <StatCard label="אוספים" value={collections.length} />
        <StatCard label="גרסאות ידע" value={readKnowledgeRevisions().length} />
      </div>

      <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
        <div className="grid gap-2 lg:grid-cols-[1fr_180px_180px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-4 text-right text-sm font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:border-[#8aa3c2] focus:ring-4 focus:ring-[#dbeafe]"
            placeholder="חיפוש בזיכרון המשפחתי"
          />
          <select
            value={year}
            onChange={(event) =>
              setYear(
                event.target.value === "all" ? "all" : Number(event.target.value)
              )
            }
            className="min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-3 text-sm font-bold text-slate-950"
          >
            <option value="all">כל השנים</option>
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as LegacyCategory | "all")
            }
            className="min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-3 text-sm font-bold text-slate-950"
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIncludeArchived((current) => !current)}
            className="min-h-11 rounded-2xl border border-[#d8c8b4] bg-[#fffdf8] px-4 text-sm font-black text-slate-800"
          >
            {includeArchived ? "הסתר ארכיון" : "כולל ארכיון"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">
              {history.length} פריטים
            </span>
            <h2 className="text-xl font-black">היסטוריה משפחתית</h2>
          </div>
          {history.slice(0, 18).map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onArchive={(record) => {
                archiveLegacyRecord({
                  sourceEntityId: record.sourceEntityId,
                  sourceModule: String(record.sourceModule),
                  sourceType: record.sourceType,
                  reason: "הוסתר מהיום-יום",
                });
                refresh();
              }}
              onRestore={(record) => {
                restoreLegacyRecord(record.sourceEntityId, record.sourceType);
                refresh();
              }}
            />
          ))}
          {history.length === 0 ? (
            <div className="rounded-[24px] bg-[#fffdf8] p-8 text-center ring-1 ring-[#eadfcd]">
              <h3 className="text-xl font-black">עדיין אין פריטים מתאימים</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                נסו להרחיב חיפוש, להסיר פילטרים או להוסיף עדכון בציר הזמן.
              </p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-3">
          <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
            <h2 className="text-xl font-black">סקירת שנה</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {review.year} · מבוסס רק על נתונים קיימים
            </p>
            <div className="mt-3 grid gap-2">
              <StatCard label="אבני דרך" value={review.milestones.length} />
              <StatCard
                label="פרויקטים שהושלמו"
                value={review.completedProjects.length}
              />
              <StatCard
                label="מסמכים חשובים"
                value={review.importantDocuments.length}
              />
              <StatCard
                label="תנועות כספיות"
                value={review.finance.incomeCount + review.finance.expenseCount}
              />
            </div>
          </section>

          <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
            <h2 className="text-xl font-black">אוספי זיכרון</h2>
            <div className="mt-3 space-y-2">
              {collections.slice(0, 5).map((collection) => (
                <div
                  key={collection.id}
                  className="rounded-2xl bg-[#fffdf8] px-3 py-3 ring-1 ring-[#edf0f4]"
                >
                  <p className="font-black">{collection.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {collection.description}
                  </p>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {collection.linkedRecordIds.length} פריטים מקושרים
                  </p>
                </div>
              ))}
              {collections.length === 0 ? (
                <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                  צרו אוסף כדי לקבץ פריטים קיימים סביב בית, רכב, שיפוץ או תקופה.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
            <h2 className="text-xl font-black">גרסאות ידע</h2>
            <div className="mt-3 space-y-2">
              {revisions.map((revision) => (
                <div
                  key={revision.id}
                  className="rounded-2xl bg-[#fffdf8] px-3 py-3 ring-1 ring-[#edf0f4]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        restoreKnowledgeRevision(revision.id);
                        refresh();
                      }}
                      className="min-h-9 rounded-2xl border border-[#d8c8b4] bg-white px-3 text-xs font-black text-slate-700"
                    >
                      שחזר
                    </button>
                    <p className="font-black">{revision.title}</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    נשמר ב-{formatDate(revision.createdAt)}
                  </p>
                </div>
              ))}
              {revisions.length === 0 ? (
                <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                  אחרי עריכת פריטי מידע משפחתי יופיעו כאן גרסאות קודמות.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
            <h2 className="text-xl font-black">בדיקת חיבורים</h2>
            <div className="mt-3 space-y-2">
              {connectionReviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#fffdf8] px-3 py-3 ring-1 ring-[#edf0f4]"
                >
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs font-bold text-amber-700">
                    הצעה בלבד · לא נוצר חיבור אוטומטי
                  </p>
                </div>
              ))}
              {connectionReviews.length === 0 ? (
                <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                  אין כרגע חיבורים חשודים או חסרים לבדיקה.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
