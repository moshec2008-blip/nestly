"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AppIcon from "@/components/ui/AppIcon";
import DateInput from "@/components/ui/DateInput";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";

type FamilySide = "צד אבא" | "צד אמא" | "בית";

// רשומות ישנות נשמרו עם שמות הצדדים הקודמים — ממפים אותן לתוויות החדשות.
const legacySideMap: Record<string, FamilySide> = {
  "כהן": "צד אבא",
  "שור": "צד אמא",
};

function normalizeSide(side: string): FamilySide {
  if (side === "צד אבא" || side === "צד אמא" || side === "בית") {
    return side;
  }

  return legacySideMap[side] ?? "בית";
}
type FamilyGeneration = "grandparents" | "parents" | "children";
type FamilyTab = "members" | "connections" | "contacts" | "permissions" | "documents";

type FamilyTreePerson = {
  id: string;
  name: string;
  role: string;
  side: FamilySide;
  generation: FamilyGeneration;
  parentIds: string[];
  birthDate: string;
  memorialDate: string;
  note: string;
};

type FamilyTreeForm = Omit<FamilyTreePerson, "id">;

const emptyForm: FamilyTreeForm = {
  name: "",
  role: "",
  side: "בית",
  generation: "children",
  parentIds: [],
  birthDate: "",
  memorialDate: "",
  note: "",
};

// נתוני דוגמה בדויים לחלוטין — "משפחת ישראלי".
const initialFamilyTreePeople: FamilyTreePerson[] = [
  {
    id: "grandpa-avraham",
    name: "סבא אברהם",
    role: "סבא",
    side: "צד אבא",
    generation: "grandparents",
    parentIds: [],
    birthDate: "1952-07-08",
    memorialDate: "",
    note: "מקום להוספת אזכרות, תמונות ומסמכים",
  },
  {
    id: "grandma-rachel",
    name: "סבתא רחל",
    role: "סבתא",
    side: "צד אבא",
    generation: "grandparents",
    parentIds: [],
    birthDate: "1955-02-20",
    memorialDate: "",
    note: "מקום להוספת אזכרות, תמונות ומסמכים",
  },
  {
    id: "david",
    name: "דוד",
    role: "הורה",
    side: "צד אבא",
    generation: "parents",
    parentIds: ["grandpa-avraham", "grandma-rachel"],
    birthDate: "1980-05-06",
    memorialDate: "",
    note: "",
  },
  {
    id: "michal",
    name: "מיכל",
    role: "הורה",
    side: "צד אמא",
    generation: "parents",
    parentIds: [],
    birthDate: "1982-12-15",
    memorialDate: "",
    note: "",
  },
  {
    id: "noa",
    name: "נועה",
    role: "ילדה",
    side: "בית",
    generation: "children",
    parentIds: ["david", "michal"],
    birthDate: "2010-04-18",
    memorialDate: "",
    note: "",
  },
  {
    id: "eitan",
    name: "איתן",
    role: "ילד",
    side: "בית",
    generation: "children",
    parentIds: ["david", "michal"],
    birthDate: "2013-08-09",
    memorialDate: "",
    note: "",
  },
  {
    id: "tamar",
    name: "תמר",
    role: "ילדה",
    side: "בית",
    generation: "children",
    parentIds: ["david", "michal"],
    birthDate: "2016-01-25",
    memorialDate: "",
    note: "",
  },
  {
    id: "yuval",
    name: "יובל",
    role: "ילד",
    side: "בית",
    generation: "children",
    parentIds: ["david", "michal"],
    birthDate: "2019-06-11",
    memorialDate: "",
    note: "",
  },
];

const generations: FamilyGeneration[] = ["children", "parents", "grandparents"];

const generationLabels: Record<FamilyGeneration, string> = {
  grandparents: "דור סבים וסבתות",
  parents: "דור ההורים",
  children: "בני הבית",
};

const tabs: { id: FamilyTab; label: string }[] = [
  { id: "members", label: "בני הבית" },
  { id: "connections", label: "קשרים" },
  { id: "contacts", label: "אנשי קשר" },
  { id: "permissions", label: "הרשאות" },
  { id: "documents", label: "מסמכים" },
];

const fieldClass =
  "mt-1 min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-500 focus:border-[#007aff]/60 focus:ring-2 focus:ring-blue-100";

function isFamilyTreePerson(value: unknown): value is FamilyTreePerson {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<FamilyTreePerson>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.side === "string" &&
    typeof candidate.generation === "string" &&
    Array.isArray(candidate.parentIds) &&
    typeof candidate.birthDate === "string" &&
    typeof candidate.memorialDate === "string" &&
    typeof candidate.note === "string"
  );
}

function createPersonId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `family-tree-${Date.now()}`;
}

function getSideClass(side: FamilySide) {
  if (side === "צד אבא") {
    return "bg-blue-50 text-blue-700";
  }

  if (side === "צד אמא") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

function getParentGeneration(generation: FamilyGeneration) {
  if (generation === "children") {
    return "parents";
  }

  if (generation === "parents") {
    return "grandparents";
  }

  return null;
}

function getPersonNames(ids: string[], people: FamilyTreePerson[]) {
  return ids
    .map((id) => people.find((person) => person.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function FamilyTree() {
  const { confirm } = useFeedback();
  const [storedPeople, setPeople] = usePersistentArrayState<FamilyTreePerson>(
    storageKeys.familyTree,
    initialFamilyTreePeople,
    isFamilyTreePerson
  );
  const people = useMemo(
    () =>
      storedPeople.map((person) => ({
        ...person,
        side: normalizeSide(person.side),
      })),
    [storedPeople]
  );
  const [activeTab, setActiveTab] = useState<FamilyTab>("members");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [menuPersonId, setMenuPersonId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPersonId && !menuPersonId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedPersonId(null);
        setMenuPersonId(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedPersonId, menuPersonId]);
  const [searchValue, setSearchValue] = useState("");
  const [sideFilter, setSideFilter] = useState<"all" | FamilySide>("all");
  const [expandedGenerations, setExpandedGenerations] = useState<
    Record<FamilyGeneration, boolean>
  >({
    children: true,
    parents: false,
    grandparents: false,
  });
  const [form, setForm] = useState<FamilyTreeForm>(emptyForm);

  const filteredPeople = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return people.filter((person) => {
      const matchesSearch =
        !normalizedSearch ||
        person.name.toLowerCase().includes(normalizedSearch) ||
        person.role.toLowerCase().includes(normalizedSearch) ||
        person.side.toLowerCase().includes(normalizedSearch) ||
        person.birthDate.includes(normalizedSearch);
      const matchesSide = sideFilter === "all" || person.side === sideFilter;

      return matchesSearch && matchesSide;
    });
  }, [people, searchValue, sideFilter]);

  const peopleByGeneration = useMemo(
    () =>
      generations.map((generation) => ({
        generation,
        people: filteredPeople.filter((person) => person.generation === generation),
        total: people.filter((person) => person.generation === generation).length,
      })),
    [filteredPeople, people]
  );

  const eligibleParents = useMemo(() => {
    const parentGeneration = getParentGeneration(form.generation);

    if (!parentGeneration) {
      return [];
    }

    return people.filter(
      (person) =>
        person.generation === parentGeneration && person.id !== editingId
    );
  }, [editingId, form.generation, people]);

  const selectedPerson =
    people.find((person) => person.id === selectedPersonId) ?? null;
  const generationCount = new Set(people.map((person) => person.generation)).size;
  const importantContacts = people.filter(
    (person) => person.generation === "parents" || person.role.includes("הורה")
  );
  const linkedDocumentsCount = people.filter(
    (person) => person.note || person.memorialDate
  ).length;

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowMoreFormFields(false);
  }

  function startCreate() {
    resetForm();
    setIsFormOpen(true);
    setActiveTab("members");
  }

  function startEdit(person: FamilyTreePerson) {
    setEditingId(person.id);
    setForm({
      name: person.name,
      role: person.role,
      side: person.side,
      generation: person.generation,
      parentIds: person.parentIds,
      birthDate: person.birthDate,
      memorialDate: person.memorialDate,
      note: person.note,
    });
    setShowMoreFormFields(Boolean(person.birthDate || person.memorialDate || person.note));
    setSelectedPersonId(null);
    setMenuPersonId(null);
    setIsFormOpen(true);
  }

  function toggleParent(parentId: string) {
    setForm((currentForm) => ({
      ...currentForm,
      parentIds: currentForm.parentIds.includes(parentId)
        ? currentForm.parentIds.filter((id) => id !== parentId)
        : [...currentForm.parentIds, parentId],
    }));
  }

  function updateGeneration(generation: FamilyGeneration) {
    setForm((currentForm) => ({
      ...currentForm,
      generation,
      parentIds: [],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = form.name.trim();
    const cleanRole = form.role.trim();

    if (!cleanName || !cleanRole) {
      return;
    }

    if (editingId) {
      setPeople((currentPeople) =>
        currentPeople.map((person) =>
          person.id === editingId
            ? {
                ...person,
                ...form,
                name: cleanName,
                role: cleanRole,
                note: form.note.trim(),
              }
            : person
        )
      );
    } else {
      setPeople((currentPeople) => [
        ...currentPeople,
        {
          ...form,
          id: createPersonId(),
          name: cleanName,
          role: cleanRole,
          note: form.note.trim(),
        },
      ]);
    }

    resetForm();
    setIsFormOpen(false);
  }

  async function deletePerson(id: string) {
    const personToDelete = people.find((person) => person.id === id);
    const approved = await confirm({
      title: "מחיקת בן משפחה",
      description: `למחוק את "${personToDelete?.name ?? "בן המשפחה"}"? אי אפשר לשחזר אחרי המחיקה.`,
      confirmLabel: "מחק",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setPeople((currentPeople) =>
      currentPeople
        .filter((person) => person.id !== id)
        .map((person) => ({
          ...person,
          parentIds: person.parentIds.filter((parentId) => parentId !== id),
        }))
    );
    setSelectedPersonId(null);
    setMenuPersonId(null);
  }

  function renderPersonRow(person: FamilyTreePerson) {
    const parentNames = getPersonNames(person.parentIds, people);

    return (
      <article key={person.id} className="relative">
        <button
          type="button"
          onClick={() => {
            setSelectedPersonId(person.id);
            setMenuPersonId(null);
          }}
          className="grid min-h-[58px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[14px] px-2 py-2 text-right transition hover:bg-[#fafafb]"
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black ${getSideClass(
              person.side
            )}`}
          >
            {getInitials(person.name)}
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-[#111827]">
              {person.name}
            </span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-slate-600">
              {person.role}
              {parentNames ? ` · ${parentNames}` : ""}
            </span>
          </span>

          <span className="rounded-full bg-[#fafafb] px-2 py-1 text-[10px] font-black text-slate-600">
            {person.side}
          </span>
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuPersonId((currentId) =>
              currentId === person.id ? null : person.id
            );
          }}
          className="absolute left-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-lg font-black text-slate-400 transition hover:bg-[#fff8eb] hover:text-[#111827]"
          aria-label={`פעולות עבור ${person.name}`}
        >
          ...
        </button>

        {menuPersonId === person.id && (
          <div className="absolute left-1 top-11 z-20 w-40 rounded-2xl border border-[#e6e8ec] bg-white p-1.5 text-right shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
            <button
              type="button"
              onClick={() => {
                setSelectedPersonId(person.id);
                setMenuPersonId(null);
              }}
              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
            >
              פרטים
            </button>
            <button
              type="button"
              onClick={() => startEdit(person)}
              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
            >
              עריכה
            </button>
            <button
              type="button"
              onClick={() => deletePerson(person.id)}
              className="block min-h-10 w-full rounded-xl px-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
            >
              מחיקה
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <section className="space-y-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] text-right text-[#1d1d1f] lg:pb-0">
      <section className="rounded-[20px] bg-white/90 p-3 shadow-[0_10px_26px_rgba(15,23,42,0.045)] ring-1 ring-[#eadfcd]/70">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={startCreate}
            className="min-h-10 shrink-0 rounded-2xl bg-[#111827] px-3.5 text-xs font-black text-white transition hover:bg-[#1f2937]"
          >
            + הוסף בן משפחה
          </button>

          <div className="flex min-w-0 items-start justify-end gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
              <AppIcon name="family" className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight text-[#111827]">
                משפחה
              </h1>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-600">
                בני הבית, קשרים ופרטים חשובים במקום אחד
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-[#fafafb] p-1.5">
          <div className="rounded-xl bg-white px-2 py-1.5 shadow-sm">
            <p className="text-base font-black text-[#111827]">{people.length}</p>
            <p className="text-[10px] font-bold text-slate-600">בני משפחה</p>
          </div>
          <div className="rounded-xl bg-white px-2 py-1.5 shadow-sm">
            <p className="text-base font-black text-[#111827]">{generationCount}</p>
            <p className="text-[10px] font-bold text-slate-600">דורות</p>
          </div>
          <div className="rounded-xl bg-white px-2 py-1.5 shadow-sm">
            <p className="text-base font-black text-[#111827]">
              {importantContacts.length}
            </p>
            <p className="text-[10px] font-bold text-slate-600">אנשי קשר</p>
          </div>
        </div>
      </section>

      <section className="rounded-[18px] bg-white/92 p-2 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
        <div className="grid grid-cols-5 gap-1 overflow-x-auto rounded-2xl bg-[#fafafb] p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? "min-h-10 whitespace-nowrap rounded-xl bg-white px-2 text-xs font-black text-[#111827] shadow-sm ring-1 ring-[#eadfcd]"
                    : "min-h-10 whitespace-nowrap rounded-xl px-2 text-xs font-black text-slate-600 transition hover:bg-white"
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[20px] bg-[#fffdf8] p-3 shadow-[0_10px_26px_rgba(15,23,42,0.055)] ring-1 ring-[#eadfcd]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="min-h-10 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700"
            >
              ביטול
            </button>
            <h2 className="text-sm font-black text-[#111827]">
              {editingId ? "עריכת בן משפחה" : "הוספת בן משפחה"}
            </h2>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs font-black text-slate-700">
              שם
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                placeholder="שם בן המשפחה"
                className={fieldClass}
                required
              />
            </label>

            <label className="text-xs font-black text-slate-700">
              קשר משפחתי
              <input
                value={form.role}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    role: event.target.value,
                  }))
                }
                placeholder="הורה, ילד, סבא, סבתא..."
                className={fieldClass}
                required
              />
            </label>

            <label className="text-xs font-black text-slate-700">
              דור
              <select
                value={form.generation}
                onChange={(event) =>
                  updateGeneration(event.target.value as FamilyGeneration)
                }
                className={fieldClass}
              >
                {generations.map((generation) => (
                  <option key={generation} value={generation}>
                    {generationLabels[generation]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-black text-slate-700">
              צד משפחתי
              <select
                value={form.side}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    side: event.target.value as FamilySide,
                  }))
                }
                className={fieldClass}
              >
                <option value="בית">בית</option>
                <option value="צד אבא">צד אבא</option>
                <option value="צד אמא">צד אמא</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowMoreFormFields((currentValue) => !currentValue)}
            className="mt-2 min-h-10 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700"
            aria-expanded={showMoreFormFields}
          >
            פרטים נוספים
          </button>

          {showMoreFormFields && (
            <div className="mt-2 grid gap-2 rounded-2xl bg-white p-2 md:grid-cols-2">
              <label className="text-xs font-black text-slate-700">
                תאריך לידה
                <DateInput
                  value={form.birthDate}
                  onChange={(birthDate) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      birthDate,
                    }))
                  }
                  label="תאריך לידה"
                  className="mt-1"
                />
              </label>

              <label className="text-xs font-black text-slate-700">
                תאריך אזכרה
                <DateInput
                  value={form.memorialDate}
                  onChange={(memorialDate) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      memorialDate,
                    }))
                  }
                  label="תאריך אזכרה"
                  className="mt-1"
                />
              </label>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-black text-slate-700">
                  שיוך להורים / בני משפחה
                </p>
                {eligibleParents.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {eligibleParents.map((parent) => (
                      <label
                        key={parent.id}
                        className={[
                          "flex min-h-10 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-xs font-bold transition",
                          form.parentIds.includes(parent.id)
                            ? "border-[#111827] bg-[#111827] text-white"
                            : "border-[#e6e8ec] bg-[#fafafb] text-slate-700 hover:bg-white",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={form.parentIds.includes(parent.id)}
                          onChange={() => toggleParent(parent.id)}
                          className="h-4 w-4"
                        />
                        {parent.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#fafafb] p-3 text-sm font-semibold text-slate-600">
                    לדור הזה אין דור קודם זמין.
                  </p>
                )}
              </div>

              <label className="text-xs font-black text-slate-700 md:col-span-2">
                הערות
                <input
                  value={form.note}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      note: event.target.value,
                    }))
                  }
                  placeholder="מסמכים, סיפור משפחתי או הערה חשובה"
                  className={fieldClass}
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            className="mt-3 min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#1f2937]"
          >
            {editingId ? "שמור שינויים" : "הוסף בן משפחה"}
          </button>
        </form>
      )}

      {activeTab === "members" && (
        <section className="rounded-[18px] bg-white/94 p-2 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((currentValue) => !currentValue)}
              className="min-h-10 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700"
              aria-expanded={showFilters}
            >
              סינון
            </button>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="חיפוש לפי שם, קשר או תאריך"
              className="min-h-10 min-w-0 flex-1 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-600"
            />
          </div>

          {showFilters && (
            <div className="mb-2 rounded-2xl bg-[#fafafb] p-2">
              <label className="text-xs font-black text-slate-700">
                צד משפחתי
                <select
                  value={sideFilter}
                  onChange={(event) =>
                    setSideFilter(event.target.value as "all" | FamilySide)
                  }
                  className={fieldClass}
                >
                  <option value="all">כל הצדדים</option>
                  <option value="בית">בית</option>
                  <option value="צד אבא">צד אבא</option>
                  <option value="צד אמא">צד אמא</option>
                </select>
              </label>
            </div>
          )}

          <div className="divide-y divide-[#eef0f3]">
            {peopleByGeneration.map(({ generation, people: generationPeople, total }) => (
              <section key={generation} className="py-1.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGenerations((currentValue) => ({
                      ...currentValue,
                      [generation]: !currentValue[generation],
                    }))
                  }
                  className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-1 text-right"
                  aria-expanded={expandedGenerations[generation]}
                >
                  <span className="text-xs font-black text-slate-500">
                    {expandedGenerations[generation] ? "−" : "+"}
                  </span>
                  <span className="text-sm font-black text-[#111827]">
                    {generationLabels[generation]} · {total}
                  </span>
                </button>

                {expandedGenerations[generation] && (
                  <div className="divide-y divide-[#eef0f3]">
                    {generationPeople.map((person) => renderPersonRow(person))}

                    {generationPeople.length === 0 && (
                      <p className="rounded-2xl bg-[#fafafb] p-3 text-center text-sm font-semibold text-slate-600">
                        אין עדיין בני משפחה בקבוצה הזו.
                      </p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        </section>
      )}

      {activeTab === "connections" && (
        <section className="rounded-[18px] bg-white/94 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
          <h2 className="text-sm font-black text-[#111827]">קשרים משפחתיים</h2>
          <div className="mt-2 divide-y divide-[#eef0f3]">
            {people
              .filter((person) => person.parentIds.length > 0)
              .slice(0, 8)
              .map((person) => (
                <div
                  key={person.id}
                  className="flex min-h-[50px] items-center justify-between gap-3 py-2"
                >
                  <span className="text-xs font-semibold text-slate-600">
                    {getPersonNames(person.parentIds, people)}
                  </span>
                  <span className="text-sm font-black text-[#111827]">
                    {person.name}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {activeTab === "contacts" && (
        <section className="rounded-[18px] bg-white/94 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
          <h2 className="text-sm font-black text-[#111827]">אנשי קשר חשובים</h2>
          <div className="mt-2 divide-y divide-[#eef0f3]">
            {importantContacts.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setSelectedPersonId(person.id)}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 py-2 text-right"
              >
                <span className="text-xs font-semibold text-slate-600">
                  {person.side}
                </span>
                <span>
                  <span className="block text-sm font-black text-[#111827]">
                    {person.name}
                  </span>
                  <span className="block text-xs font-semibold text-slate-600">
                    {person.role}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === "permissions" && (
        <section className="rounded-[18px] bg-white/94 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
          <h2 className="text-sm font-black text-[#111827]">הרשאות ומידע רגיש</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            הרשאות המשפחה נשמרות באזור האבטחה כדי שהמידע הרגיש יישאר ברור ומופרד.
          </p>
          <a
            href="/permissions"
            className="mt-3 inline-flex min-h-10 items-center rounded-2xl bg-[#111827] px-4 text-xs font-black text-white"
          >
            מעבר להרשאות
          </a>
        </section>
      )}

      {activeTab === "documents" && (
        <section className="rounded-[18px] bg-white/94 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
          <h2 className="text-sm font-black text-[#111827]">מסמכים משפחתיים</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {linkedDocumentsCount > 0
              ? `${linkedDocumentsCount} בני משפחה כוללים הערות או תאריכים חשובים.`
              : "מסמכים והערות משפחתיות יופיעו כאן כשיתווספו."}
          </p>
          <a
            href="/documents"
            className="mt-3 inline-flex min-h-10 items-center rounded-2xl border border-[#e6e8ec] bg-white px-4 text-xs font-black text-slate-700"
          >
            מעבר למסמכים
          </a>
        </section>
      )}

      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPersonId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-person-details-title"
            className="w-full max-w-md rounded-[24px] bg-white p-4 text-right shadow-[0_28px_90px_rgba(15,23,42,0.28)] ring-1 ring-[#eadfcd]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef0f3] pb-3">
              <button
                type="button"
                onClick={() => setSelectedPersonId(null)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#e6e8ec] bg-white text-lg font-black text-slate-600"
                aria-label="סגור"
              >
                ×
              </button>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-500">
                  {selectedPerson.role} · {selectedPerson.side}
                </p>
                <h3
                  id="family-person-details-title"
                  className="mt-1 truncate text-lg font-black text-[#111827]"
                >
                  {selectedPerson.name}
                </h3>
              </div>
            </div>

            <div className="space-y-2 py-3 text-sm font-semibold text-slate-700">
              <p>דור: {generationLabels[selectedPerson.generation]}</p>
              {selectedPerson.parentIds.length > 0 && (
                <p>שיוך: {getPersonNames(selectedPerson.parentIds, people)}</p>
              )}
              {selectedPerson.birthDate && (
                <p>תאריך לידה: {formatDate(selectedPerson.birthDate)}</p>
              )}
              {selectedPerson.memorialDate && (
                <p>תאריך אזכרה: {formatDate(selectedPerson.memorialDate)}</p>
              )}
              {selectedPerson.note && (
                <p className="rounded-2xl bg-[#fafafb] p-3">{selectedPerson.note}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => startEdit(selectedPerson)}
                className="min-h-11 rounded-2xl bg-[#111827] px-4 text-sm font-black text-white"
              >
                עריכה
              </button>
              <button
                type="button"
                onClick={() => deletePerson(selectedPerson.id)}
                className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700"
              >
                מחיקה
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
