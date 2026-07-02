"use client";

import { useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import DateInput from "@/components/ui/DateInput";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";

type FamilySide = "כהן" | "שור" | "בית";
type FamilyGeneration = "grandparents" | "parents" | "children";

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

const initialFamilyTreePeople: FamilyTreePerson[] = [
  {
    id: "grandparent-kohen",
    name: "סבא וסבתא כהן",
    role: "שורשי משפחת כהן",
    side: "כהן",
    generation: "grandparents",
    parentIds: [],
    birthDate: "",
    memorialDate: "",
    note: "מקום להוספת אזכרות, תמונות ומסמכים",
  },
  {
    id: "grandparent-shor",
    name: "סבא וסבתא שור",
    role: "שורשי משפחת שור",
    side: "שור",
    generation: "grandparents",
    parentIds: [],
    birthDate: "",
    memorialDate: "",
    note: "מקום להוספת אזכרות, תמונות ומסמכים",
  },
  {
    id: "moshe",
    name: "משה",
    role: "הורה",
    side: "כהן",
    generation: "parents",
    parentIds: ["grandparent-kohen"],
    birthDate: "1978-11-04",
    memorialDate: "",
    note: "",
  },
  {
    id: "oshrit",
    name: "אושרית",
    role: "הורה",
    side: "שור",
    generation: "parents",
    parentIds: ["grandparent-shor"],
    birthDate: "2001-06-14",
    memorialDate: "",
    note: "",
  },
  {
    id: "yair",
    name: "יאיר יהודה",
    role: "ילד",
    side: "בית",
    generation: "children",
    parentIds: ["moshe", "oshrit"],
    birthDate: "2017-07-04",
    memorialDate: "",
    note: "",
  },
  {
    id: "hodaya",
    name: "הודיה",
    role: "ילדה",
    side: "בית",
    generation: "children",
    parentIds: ["moshe", "oshrit"],
    birthDate: "2019-10-13",
    memorialDate: "",
    note: "",
  },
  {
    id: "daniel",
    name: "דניאל",
    role: "ילד",
    side: "בית",
    generation: "children",
    parentIds: ["moshe", "oshrit"],
    birthDate: "2000-05-24",
    memorialDate: "",
    note: "",
  },
];

const generations: FamilyGeneration[] = [
  "grandparents",
  "parents",
  "children",
];

const generationLabels: Record<FamilyGeneration, string> = {
  grandparents: "דור סבים וסבתות",
  parents: "דור ההורים",
  children: "דור הילדים",
};

const generationDescriptions: Record<FamilyGeneration, string> = {
  grandparents: "שורשים, אזכרות, סיפורים ומסמכים משפחתיים.",
  parents: "קישור בין משפחות המקור, ההרשאות והמידע האישי.",
  children: "בני הבית, ימי הולדת, מסמכים ואירועים משויכים.",
};

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
  if (side === "כהן") {
    return "bg-blue-50 text-blue-700";
  }

  if (side === "שור") {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-emerald-50 text-emerald-700";
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
  const [people, setPeople] = usePersistentArrayState<FamilyTreePerson>(
    storageKeys.familyTree,
    initialFamilyTreePeople,
    isFamilyTreePerson
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FamilyTreeForm>(emptyForm);

  const peopleByGeneration = useMemo(
    () =>
      generations.map((generation) => ({
        generation,
        people: people.filter((person) => person.generation === generation),
      })),
    [people]
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

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startCreate() {
    resetForm();
    setIsFormOpen(true);
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  function deletePerson(id: string) {
    const approved = window.confirm("למחוק את האדם מאילן היוחסין?");

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
  }

  return (
    <section className="mb-3 rounded-[22px] border border-[#e6e8ec] bg-white p-3 text-right text-[#1d1d1f] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={startCreate}
          className="min-h-11 rounded-2xl bg-[#111827] px-4 py-2 text-sm font-black text-white transition hover:bg-[#1f2937]"
        >
          הוסף לאילן
        </button>

        <div className="flex items-start justify-end gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#e6e8ec] bg-purple-50 text-purple-700">
            <AppIcon name="family" className="h-4.5 w-4.5" />
          </span>

          <div>
            <p className="text-xs font-bold text-slate-500">משפחה ושורשים</p>
            <h2 className="mt-1 text-lg font-black text-[#1d1d1f]">
              אילן יוחסין
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              בונים שושלת משפחתית לפי דורות, צד משפחתי וקשרי הורים. אפשר
              לערוך כל אדם, להוסיף תאריכי לידה ואזכרות ולחבר מסמכים בהמשך.
            </p>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-3 rounded-[20px] border border-[#e6e8ec] bg-[#fafafb] p-3"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsFormOpen(false);
              }}
              className="rounded-2xl border border-[#e6e8ec] bg-white px-4 py-2 text-sm font-black text-slate-700"
            >
              ביטול
            </button>
            <h3 className="text-sm font-black text-[#1d1d1f]">
              {editingId ? "עריכת אדם באילן" : "הוספת אדם לאילן"}
            </h3>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-bold text-slate-700">
              שם
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    name: event.target.value,
                  }))
                }
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold outline-none focus:border-[#007aff]/60"
                required
              />
            </label>

            <label className="text-sm font-bold text-slate-700">
              תפקיד / קשר
              <input
                value={form.role}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    role: event.target.value,
                  }))
                }
                placeholder="הורה, ילד, סבא, סבתא..."
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold outline-none focus:border-[#007aff]/60"
                required
              />
            </label>

            <label className="text-sm font-bold text-slate-700">
              דור
              <select
                value={form.generation}
                onChange={(event) =>
                  updateGeneration(event.target.value as FamilyGeneration)
                }
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold outline-none focus:border-[#007aff]/60"
              >
                {generations.map((generation) => (
                  <option key={generation} value={generation}>
                    {generationLabels[generation]}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-slate-700">
              צד משפחתי
              <select
                value={form.side}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    side: event.target.value as FamilySide,
                  }))
                }
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold outline-none focus:border-[#007aff]/60"
              >
                <option value="בית">בית</option>
                <option value="כהן">כהן</option>
                <option value="שור">שור</option>
              </select>
            </label>

            <label className="text-sm font-bold text-slate-700">
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

            <label className="text-sm font-bold text-slate-700">
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

            <label className="text-sm font-bold text-slate-700 md:col-span-2">
              הערה
              <input
                value={form.note}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    note: event.target.value,
                  }))
                }
                placeholder="מסמכים, סיפור משפחתי, הערת אזכרה..."
                className="mt-1 min-h-11 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold outline-none focus:border-[#007aff]/60"
              />
            </label>
          </div>

          <div className="mt-3 rounded-2xl border border-[#e6e8ec] bg-white p-3">
            <p className="mb-2 text-sm font-black text-[#1d1d1f]">
              קישור להורים / דור קודם
            </p>
            {eligibleParents.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-2">
                {eligibleParents.map((parent) => (
                  <label
                    key={parent.id}
                    className={[
                      "flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold transition",
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
              <p className="text-sm font-semibold text-slate-600">
                לדור הזה אין דור קודם זמין. הוסף קודם בני משפחה בדור שמעל.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="mt-3 min-h-11 rounded-2xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#1f2937]"
          >
            {editingId ? "שמור שינויים" : "הוסף לאילן"}
          </button>
        </form>
      )}

      <div className="grid gap-2 lg:grid-cols-3">
        {peopleByGeneration.map(({ generation, people: generationPeople }) => (
          <div
            key={generation}
            className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-3"
          >
            <div className="mb-2">
              <h3 className="text-sm font-black text-[#1d1d1f]">
                {generationLabels[generation]}
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {generationDescriptions[generation]}
              </p>
            </div>

            <div className="space-y-2">
              {generationPeople.map((person) => {
                const parentNames = getPersonNames(person.parentIds, people);
                const childrenCount = people.filter((familyMember) =>
                  familyMember.parentIds.includes(person.id)
                ).length;

                return (
                  <article
                    key={person.id}
                    className="rounded-2xl border border-[#e6e8ec] bg-white p-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${getSideClass(
                          person.side
                        )}`}
                      >
                        {person.side}
                      </span>
                      <div>
                        <p className="text-sm font-black text-[#1d1d1f]">
                          {person.name}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-600">
                          {person.role}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 text-xs font-semibold leading-5 text-slate-600">
                      {parentNames && <p>הורים: {parentNames}</p>}
                      {childrenCount > 0 && <p>צאצאים מקושרים: {childrenCount}</p>}
                      {person.birthDate && <p>לידה: {formatDate(person.birthDate)}</p>}
                      {person.memorialDate && (
                        <p>אזכרה: {formatDate(person.memorialDate)}</p>
                      )}
                      {person.note && (
                        <p className="rounded-xl bg-[#fafafb] px-2 py-1.5">
                          {person.note}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(person)}
                        className="rounded-xl border border-[#e6e8ec] bg-[#fafafb] px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-white"
                      >
                        עריכה
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePerson(person.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-white"
                      >
                        מחיקה
                      </button>
                    </div>
                  </article>
                );
              })}

              {generationPeople.length === 0 && (
                <p className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white p-3 text-center text-sm font-semibold text-slate-600">
                  אין עדיין אנשים בדור הזה.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
