"use client";

import { useMemo, useState } from "react";
import AISuggestionCard from "@/components/ai/AISuggestionCard";
import RelatedItemsPanel from "@/components/relations/RelatedItemsPanel";
import SuggestedConnectionsPanel from "@/components/relations/SuggestedConnectionsPanel";
import AppIcon from "@/components/ui/AppIcon";
import {
  archiveKnowledgeItem,
  createKnowledgeItem,
  defaultKnowledgeCategories,
  getRelatedKnowledge,
  markKnowledgeViewed,
  readKnowledgeItems,
  restoreKnowledgeItem,
  searchKnowledgeItems,
  setKnowledgeFavorite,
  setKnowledgePinned,
  updateKnowledgeItem,
} from "@/services/familyKnowledge";
import { suggestKnowledgeFields } from "@/services/ai/contextualSuggestionService";
import type { AISuggestion } from "@/types/aiSuggestions";
import type { FamilyKnowledgeItem, KnowledgeLinkedModule } from "@/types/knowledge";

type KnowledgeFormState = {
  title: string;
  content: string;
  category: string;
  tags: string;
  linkedModule: KnowledgeLinkedModule;
};

const initialFormState: KnowledgeFormState = {
  title: "",
  content: "",
  category: "בית",
  tags: "",
  linkedModule: "home",
};

const moduleLabels: Record<KnowledgeLinkedModule, string> = {
  home: "בית",
  vehicles: "רכבים",
  family: "משפחה",
  health: "בריאות",
  documents: "מסמכים",
  finance: "כספים",
  shopping: "קניות",
  tasks: "משימות",
  events: "אירועים",
  general: "כללי",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formFromItem(item: FamilyKnowledgeItem): KnowledgeFormState {
  return {
    title: item.title,
    content: item.content,
    category: item.category,
    tags: item.tags.join(", "),
    linkedModule: item.linkedModule ?? "general",
  };
}

export default function FamilyKnowledgeManager() {
  const [items, setItems] = useState(() => readKnowledgeItems());
  const [archivedItems, setArchivedItems] = useState(() =>
    readKnowledgeItems({ includeArchived: true }).filter((item) => item.archived)
  );
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("הכל");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FamilyKnowledgeItem | null>(null);
  const [editingItem, setEditingItem] = useState<FamilyKnowledgeItem | null>(null);
  const [form, setForm] = useState<KnowledgeFormState>(initialFormState);
  const [notice, setNotice] = useState("");
  const [knowledgeSuggestions, setKnowledgeSuggestions] = useState<AISuggestion[]>([]);

  const visibleItems = useMemo(() => {
    const source = showArchived ? archivedItems : searchKnowledgeItems(query);
    return source.filter((item) =>
      activeCategory === "הכל" ? true : item.category === activeCategory
    );
  }, [activeCategory, archivedItems, query, showArchived]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    });
    return counts;
  }, [items]);

  const relatedItems = selectedItem ? getRelatedKnowledge(selectedItem) : [];

  function refresh() {
    setItems(readKnowledgeItems());
    setArchivedItems(
      readKnowledgeItems({ includeArchived: true }).filter((item) => item.archived)
    );
  }

  function resetForm() {
    setForm(initialFormState);
    setEditingItem(null);
  }

  function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      setNotice("כותרת ותוכן יעזרו למשפחה למצוא את זה גם בעוד שנה.");
      return;
    }

    if (editingItem) {
      const updated = updateKnowledgeItem(editingItem.id, {
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags.split(","),
        linkedModule: form.linkedModule,
      });
      setSelectedItem(updated);
      setNotice("המידע עודכן ונשמר בזיכרון המשפחתי.");
    } else {
      const created = createKnowledgeItem({
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags.split(","),
        linkedModule: form.linkedModule,
      });
      setSelectedItem(created);
      setNotice("נשמר בזיכרון המשפחתי. אפשר למצוא את זה מעכשיו דרך החיפוש.");
    }

    resetForm();
    refresh();
  }

  function openItem(item: FamilyKnowledgeItem) {
    markKnowledgeViewed(item.id);
    setSelectedItem(item);
    refresh();
  }

  function editItem(item: FamilyKnowledgeItem) {
    setEditingItem(item);
    setForm(formFromItem(item));
  }

  function togglePinned(item: FamilyKnowledgeItem) {
    setKnowledgePinned(item.id, !item.pinned);
    refresh();
  }

  function toggleFavorite(item: FamilyKnowledgeItem) {
    setKnowledgeFavorite(item.id, !item.favorite);
    refresh();
  }

  function archiveItem(item: FamilyKnowledgeItem) {
    archiveKnowledgeItem(item.id);
    setSelectedItem(null);
    refresh();
    setNotice("הועבר לארכיון. אפשר לשחזר מתוך תצוגת הארכיון.");
  }

  function restoreItem(item: FamilyKnowledgeItem) {
    restoreKnowledgeItem(item.id);
    refresh();
    setNotice("המידע שוחזר וחזר לזיכרון הפעיל.");
  }

  function requestKnowledgeSuggestions() {
    const sourceText = [form.title, form.content].filter(Boolean).join(" ");
    const suggestions = suggestKnowledgeFields({
      sourceModule: "knowledge",
      sourceEntityType: editingItem ? "knowledge_item" : "knowledge_draft",
      sourceEntityId: editingItem?.id ?? "new-knowledge-item",
      text: sourceText,
    });

    setKnowledgeSuggestions(suggestions);
    if (suggestions.length === 0) {
      setNotice("לא נמצאה הצעה מספיק ברורה. אפשר להמשיך למלא ידנית.");
    }
  }

  function applyKnowledgeSuggestion(suggestion: AISuggestion) {
    setForm((current) => ({
      ...current,
      title:
        typeof suggestion.proposedValues.title === "string"
          ? suggestion.proposedValues.title
          : current.title,
      category:
        typeof suggestion.proposedValues.category === "string"
          ? suggestion.proposedValues.category
          : current.category,
      tags: Array.isArray(suggestion.proposedValues.tags)
        ? suggestion.proposedValues.tags.join(", ")
        : current.tags,
    }));
    setKnowledgeSuggestions((current) =>
      current.filter((item) => item.id !== suggestion.id)
    );
    setNotice("ההצעה הוחלה בטופס. בדקו וערכו לפני שמירה.");
  }

  return (
    <section dir="rtl" className="space-y-4 text-right">
      <div className="rounded-[28px] border border-[#ebe4d8] bg-gradient-to-l from-[#fff8eb] via-white to-[#eef7ff] p-5 shadow-[0_18px_55px_rgba(33,43,63,0.10)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-[#eadfcd] bg-white/80 px-3 py-1 text-xs font-black text-[#7a5212]">
              הזיכרון הארוך של הבית
            </span>
            <h1 className="mt-3 text-2xl font-black text-[#111827] sm:text-3xl">
              מידע משפחתי
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              שמרו כאן פרטים שתרצו לזכור לאורך שנים: צבע קיר, דגם סוללה,
              העדפות של הילדים, אנשי מקצוע ותהליכים שחוזרים על עצמם.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/78 p-3 shadow-sm ring-1 ring-[#edf0f4]">
              <p className="text-lg font-black text-[#111827]">{items.length}</p>
              <p className="text-[11px] font-bold text-slate-500">פריטים</p>
            </div>
            <div className="rounded-2xl bg-white/78 p-3 shadow-sm ring-1 ring-[#edf0f4]">
              <p className="text-lg font-black text-[#111827]">
                {items.filter((item) => item.pinned).length}
              </p>
              <p className="text-[11px] font-bold text-slate-500">נעוצים</p>
            </div>
            <div className="rounded-2xl bg-white/78 p-3 shadow-sm ring-1 ring-[#edf0f4]">
              <p className="text-lg font-black text-[#111827]">
                {items.filter((item) => item.favorite).length}
              </p>
              <p className="text-[11px] font-bold text-slate-500">מועדפים</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-4">
          {notice ? (
            <div
              className="rounded-2xl border border-[#d8caba] bg-[#fff8eb] px-4 py-3 text-sm font-bold text-[#7a5212]"
              role="status"
            >
              {notice}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-[#ebe4d8] bg-white/92 p-4 shadow-[0_16px_45px_rgba(33,43,63,0.08)]">
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
              <label className="sr-only" htmlFor="knowledge-search">
                חיפוש מידע משפחתי
              </label>
              <div className="relative min-w-0">
                <AppIcon
                  name="spark"
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a5b16]"
                />
                <input
                  id="knowledge-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="חיפוש בזיכרון המשפחתי..."
                  className="min-h-12 w-full rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] py-3 pl-4 pr-11 text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-500 focus:border-[#d8b470] focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowArchived((current) => !current)}
                className={[
                  "min-h-12 w-full rounded-2xl border px-4 text-sm font-black transition lg:w-auto",
                  showArchived
                    ? "border-[#111827]/15 bg-[#111827] text-white"
                    : "border-[#e3d8c9] bg-white text-slate-700 hover:bg-[#fff8eb]",
                ].join(" ")}
              >
                {showArchived ? "מציג ארכיון" : "הצג ארכיון"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap justify-end gap-1.5 pb-1">
              <button
                type="button"
                onClick={() => setActiveCategory("הכל")}
                className={[
                  "min-h-9 rounded-full px-2.5 text-xs font-black transition",
                  activeCategory === "הכל"
                    ? "bg-[#111827] text-white"
                    : "bg-[#fffdf8] text-slate-600 ring-1 ring-[#eadfcd]",
                ].join(" ")}
              >
                הכל
              </button>
              {defaultKnowledgeCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.label)}
                  className={[
                    "min-h-9 rounded-full px-2.5 text-xs font-black transition",
                    activeCategory === category.label
                      ? "bg-[#111827] text-white"
                      : "bg-[#fffdf8] text-slate-600 ring-1 ring-[#eadfcd]",
                  ].join(" ")}
                >
                  {category.label}
                  {categoryCounts.has(category.label) ? (
                    <span className="mr-1 text-[10px] opacity-70">
                      {categoryCounts.get(category.label)}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleItems.map((item) => (
                <article
                  key={item.id}
                  className="group rounded-[24px] border border-[#ebe4d8] bg-white/94 p-4 shadow-[0_14px_36px_rgba(33,43,63,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(33,43,63,0.11)]"
                >
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="block w-full text-right"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.pinned ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                              נעוץ
                            </span>
                          ) : null}
                          {item.favorite ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 ring-1 ring-rose-100">
                              מועדף
                            </span>
                          ) : null}
                          <span className="rounded-full bg-[#fff8eb] px-2 py-0.5 text-[10px] font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
                            {item.category}
                          </span>
                        </div>
                        <h2 className="mt-2 line-clamp-2 text-lg font-black text-[#111827]">
                          {item.title}
                        </h2>
                      </div>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef7ff] text-sky-700 ring-1 ring-sky-100">
                        <AppIcon name="knowledge" className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-600">
                      {item.content}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        עודכן {formatDate(item.updatedAt)}
                      </span>
                      <span className="text-xs font-black text-slate-500">
                        {moduleLabels[item.linkedModule ?? "general"]}
                      </span>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[#edf0f4] pt-3">
                    <button
                      type="button"
                      onClick={() => togglePinned(item)}
                      className="min-h-9 rounded-xl bg-[#fffdf8] px-3 text-xs font-black text-slate-600 ring-1 ring-[#eadfcd]"
                    >
                      {item.pinned ? "בטל נעיצה" : "נעץ"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item)}
                      className="min-h-9 rounded-xl bg-[#fffdf8] px-3 text-xs font-black text-slate-600 ring-1 ring-[#eadfcd]"
                    >
                      {item.favorite ? "הסר מועדף" : "מועדף"}
                    </button>
                    {showArchived ? (
                      <button
                        type="button"
                        onClick={() => restoreItem(item)}
                        className="min-h-9 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"
                      >
                        שחזר
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => archiveItem(item)}
                        className="min-h-9 rounded-xl bg-white px-3 text-xs font-black text-slate-500 ring-1 ring-[#edf0f4]"
                      >
                        ארכב
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-[#d8caba] bg-[#fffdf8] p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-white text-[#8a5b16] shadow-sm ring-1 ring-[#eadfcd]">
                <AppIcon name="knowledge" className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-black text-[#111827]">
                עדיין אין מידע משפחתי
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
                שמרו כאן מידע שתרצו לזכור לאורך שנים: דגמים, מידות, אנשי קשר,
                הוראות, העדפות וכל פרט שהבית צריך לזכור.
              </p>
              <button
                type="button"
                onClick={() => document.getElementById("knowledge-title")?.focus()}
                className="mt-4 min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-sm"
              >
                הוסף מידע
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-[#ebe4d8] bg-white/94 p-4 shadow-[0_16px_45px_rgba(33,43,63,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#8a5b16]">
                  {editingItem ? "עריכת מידע" : "מידע חדש"}
                </p>
                <h2 className="mt-1 text-lg font-black text-[#111827]">
                  {editingItem ? editingItem.title : "הוסף לזיכרון המשפחתי"}
                </h2>
              </div>
              {editingItem ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-10 rounded-2xl bg-[#fffdf8] px-3 text-xs font-black text-slate-600 ring-1 ring-[#eadfcd]"
                >
                  ביטול
                </button>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-black text-slate-700">כותרת</span>
                <input
                  id="knowledge-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="לדוגמה: צבע הסלון"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] px-3 text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#d8b470] focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-xs font-black text-slate-700">
                  מה חשוב לזכור?
                </span>
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, content: event.target.value }))
                  }
                  rows={5}
                  placeholder="המידע עצמו, הוראות, מספר דגם, איש קשר או כל פרט שימושי."
                  className="mt-1 w-full resize-none rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] p-3 text-sm font-semibold leading-6 text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#d8b470] focus:bg-white"
                />
              </label>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/55 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold leading-5 text-slate-600">
                    אפשר לבקש מ-Nestly להציע כותרת, קטגוריה ותגיות לפי הטקסט.
                  </p>
                  <button
                    type="button"
                    onClick={requestKnowledgeSuggestions}
                    className="min-h-9 rounded-full border border-sky-100 bg-white px-3 text-xs font-black text-sky-800 shadow-sm transition hover:bg-sky-50"
                  >
                    הצעות חכמות
                  </button>
                </div>
                {knowledgeSuggestions.length > 0 ? (
                  <div className="mt-2 grid gap-2">
                    {knowledgeSuggestions.map((suggestion) => (
                      <AISuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onApply={applyKnowledgeSuggestion}
                        onReject={() =>
                          setKnowledgeSuggestions((current) =>
                            current.filter((item) => item.id !== suggestion.id)
                          )
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block">
                  <span className="text-xs font-black text-slate-700">קטגוריה</span>
                  <select
                    value={form.category}
                    onChange={(event) => {
                      const category = defaultKnowledgeCategories.find(
                        (item) => item.label === event.target.value
                      );
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                        linkedModule: category?.linkedModule ?? current.linkedModule,
                      }));
                    }}
                    className="mt-1 min-h-11 w-full rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] px-3 text-sm font-black text-[#111827] outline-none focus:border-[#d8b470] focus:bg-white"
                  >
                    {defaultKnowledgeCategories.map((category) => (
                      <option key={category.id} value={category.label}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black text-slate-700">
                    שיוך לאזור
                  </span>
                  <select
                    value={form.linkedModule}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        linkedModule: event.target.value as KnowledgeLinkedModule,
                      }))
                    }
                    className="mt-1 min-h-11 w-full rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] px-3 text-sm font-black text-[#111827] outline-none focus:border-[#d8b470] focus:bg-white"
                  >
                    {Object.entries(moduleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-black text-slate-700">
                  תגיות
                  <span className="mr-1 font-semibold text-slate-400">אופציונלי</span>
                </span>
                <input
                  value={form.tags}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, tags: event.target.value }))
                  }
                  placeholder="צבע, סלון, שיפוץ"
                  className="mt-1 min-h-11 w-full rounded-2xl border border-[#e3d8c9] bg-[#fffdf8] px-3 text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#d8b470] focus:bg-white"
                />
              </label>

              <button
                type="button"
                onClick={handleSave}
                className="min-h-12 w-full rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(17,24,39,0.18)] transition hover:bg-[#1f2937] active:scale-[0.99]"
              >
                {editingItem ? "שמור שינויים" : "שמור מידע"}
              </button>
            </div>
          </div>

          {selectedItem ? (
            <div className="rounded-[24px] border border-[#ebe4d8] bg-[#fffdf8] p-4 shadow-[0_16px_45px_rgba(33,43,63,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#8a5b16]">
                    פרטים
                  </p>
                  <h2 className="mt-1 text-lg font-black text-[#111827]">
                    {selectedItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => editItem(selectedItem)}
                  className="min-h-10 rounded-2xl bg-white px-3 text-xs font-black text-slate-700 ring-1 ring-[#eadfcd]"
                >
                  ערוך
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                {selectedItem.content}
              </p>
              {selectedItem.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedItem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-[#edf0f4]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {relatedItems.length > 0 ? (
                <div className="mt-4 border-t border-[#eadfcd] pt-3">
                  <h3 className="text-sm font-black text-[#111827]">
                    מידע קשור
                  </h3>
                  <div className="mt-2 space-y-2">
                    {relatedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openItem(item)}
                        className="w-full rounded-2xl bg-white p-3 text-right text-xs font-black text-slate-700 ring-1 ring-[#edf0f4]"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 border-t border-[#eadfcd] pt-3">
                <SuggestedConnectionsPanel
                  entity={{
                    entityType: "family_knowledge",
                    entityId: selectedItem.id,
                  }}
                />
                <RelatedItemsPanel
                  entity={{
                    entityType: "family_knowledge",
                    entityId: selectedItem.id,
                  }}
                  compact
                />
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
