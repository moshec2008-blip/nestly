"use client";

import { useEffect, useMemo, useState } from "react";
import { initialBirthdays } from "@/data/birthdays";
import type { BirthdayCalendarType, BirthdayPerson, BirthdayReminder } from "@/types/birthdays";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import {
  formatBirthdayDate,
  formatHebrewDate,
  getBirthdayDateViewMode,
  setBirthdayDateViewMode,
  type BirthdayDateViewMode,
} from "@/utils/hebrewDate";
import {
  getBirthdayCalendarBadge,
  getDaysUntilBirthday,
  normalizeBirthdayPerson,
} from "@/utils/birthdayCalendar";

type ViewMode = "cards" | "table";

const idCardBirthdayUpdates: Record<
  string,
  Pick<BirthdayPerson, "name" | "relationship" | "gregorianDate" | "hebrewDate" | "notes">
> = {
  "birthday-1": {
    name: "משה",
    relationship: "הורה",
    gregorianDate: "1978-11-04",
    hebrewDate: "ז׳ בחשוון התשל״ט",
    notes: "עודכן לפי תעודת הזהות.",
  },
  "birthday-2": {
    name: "אושרית",
    relationship: "משפחה",
    gregorianDate: "2001-06-14",
    hebrewDate: "כ״ג בסיוון התשס״א",
    notes: "עודכן לפי ספח תעודת הזהות.",
  },
  "birthday-3": {
    name: "יאיר יהודה",
    relationship: "ילד",
    gregorianDate: "2017-07-04",
    hebrewDate: "י׳ בתמוז התשע״ז",
    notes: "עודכן לפי ספח תעודת הזהות.",
  },
  "birthday-4": {
    name: "הודיה",
    relationship: "ילדה",
    gregorianDate: "2019-10-13",
    hebrewDate: "ט״ו בתשרי התש״ף",
    notes: "עודכן לפי ספח תעודת הזהות.",
  },
  "birthday-5": {
    name: "דניאל",
    relationship: "ילד",
    gregorianDate: "2000-05-24",
    hebrewDate: "י״ט באייר התש״ס",
    notes: "עודכן לפי ספח תעודת הזהות.",
  },
  "birthday-11": {
    name: "אביתר",
    relationship: "ילד",
    gregorianDate: "2002-07-18",
    hebrewDate: "ט׳ באב התשס״ב",
    notes: "עודכן לפי ספח תעודת הזהות.",
  },
  "birthday-12": {
    name: "איתמר",
    relationship: "ילד",
    gregorianDate: "2002-07-18",
    hebrewDate: "ט׳ באב התשס״ב",
    notes: "עודכן לפי ספח תעודת הזהות.",
  },
};

function getAgePlaceholder(date: string) {
  const birthDate = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return `${Math.max(age, 0)} · גיל`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getReminderLabel(reminder: BirthdayPerson["reminders"][number]) {
  return reminder === "week-before" ? "שבוע לפני" : "יום לפני";
}

type BirthdayDisplayItem = {
  id: string;
  name: string;
  relationship: string;
  gregorianDate: string;
  hebrewDate: string;
  calendarType: BirthdayCalendarType;
  reminders: BirthdayPerson["reminders"];
  notes: string;
  members: BirthdayPerson[];
};

function groupBirthdaysByDate(birthdays: BirthdayPerson[]): BirthdayDisplayItem[] {
  const groupedBirthdays = birthdays.reduce<Map<string, BirthdayPerson[]>>(
    (groups, birthday) => {
      const group = groups.get(birthday.gregorianDate);

      if (group) {
        group.push(birthday);
      } else {
        groups.set(birthday.gregorianDate, [birthday]);
      }

      return groups;
    },
    new Map()
  );

  return Array.from(groupedBirthdays.entries())
    .map(([date, members]) => {
      const primaryMember = members[0];
      const names = members.map((member) => member.name);
      const uniqueReminders = Array.from(
        new Set(members.flatMap((member) => member.reminders))
      );

      return {
        id: `${date}-${members.length > 1 ? names.join("-") : primaryMember.id}`,
        name: names.length > 1 ? names.join(" ו") : primaryMember.name,
        relationship: primaryMember.relationship,
        gregorianDate: date,
        hebrewDate: primaryMember.hebrewDate,
        calendarType: primaryMember.calendarType ?? "hebrew",
        reminders: uniqueReminders,
        notes: members
          .map((member) => member.notes)
          .filter(Boolean)
          .join(" • "),
        members,
      } satisfies BirthdayDisplayItem;
    })
    .sort(
      (first, second) =>
        getDaysUntilBirthday({
          gregorianDate: first.gregorianDate,
          calendarType: first.calendarType ?? "hebrew",
        }) -
        getDaysUntilBirthday({
          gregorianDate: second.gregorianDate,
          calendarType: second.calendarType ?? "hebrew",
        })
    );
}

export default function BirthdaysManager() {
  const [birthdays, setBirthdays] =
    usePersistentArrayState<BirthdayPerson>(
      storageKeys.birthdays,
      initialBirthdays
    );
  const [searchValue, setSearchValue] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const [showAddBirthdayForm, setShowAddBirthdayForm] = useState(false);
  const [dateViewMode, setDateViewMode] = useState<BirthdayDateViewMode>(() =>
    getBirthdayDateViewMode()
  );
  const [newBirthdayForm, setNewBirthdayForm] = useState({
    name: "",
    relationship: "",
    date: "",
    calendarType: "hebrew" as BirthdayCalendarType,
    reminders: ["week-before"] as BirthdayReminder[],
    notes: "",
  });

  useEffect(() => {
    const needsMigration = birthdays.some((birthday) => !birthday.calendarType);

    if (needsMigration) {
      setBirthdays((currentBirthdays) =>
        currentBirthdays.map((birthday) =>
          birthday.calendarType
            ? birthday
            : { ...birthday, calendarType: "hebrew" as BirthdayCalendarType }
        )
      );
    }
  }, [birthdays, setBirthdays]);

  useEffect(() => {
    const needsIdCardSync = birthdays.some((birthday) => {
      const update = idCardBirthdayUpdates[birthday.id];

      return Boolean(
        update &&
          (birthday.name !== update.name ||
            birthday.relationship !== update.relationship ||
            birthday.gregorianDate !== update.gregorianDate ||
            birthday.hebrewDate !== update.hebrewDate ||
            birthday.notes !== update.notes)
      );
    });

    if (!needsIdCardSync) {
      return;
    }

    setBirthdays((currentBirthdays) => {
      let didUpdate = false;

      const updatedBirthdays = currentBirthdays.map((birthday) => {
        const update = idCardBirthdayUpdates[birthday.id];

        if (
          !update ||
          (birthday.name === update.name &&
            birthday.relationship === update.relationship &&
            birthday.gregorianDate === update.gregorianDate &&
            birthday.hebrewDate === update.hebrewDate &&
            birthday.notes === update.notes)
        ) {
          return birthday;
        }

        didUpdate = true;
        return {
          ...birthday,
          ...update,
        };
      });

      return didUpdate ? updatedBirthdays : currentBirthdays;
    });
  }, [birthdays, setBirthdays]);

  const normalizedBirthdays = useMemo(
    () => birthdays.map(normalizeBirthdayPerson),
    [birthdays]
  );

  const relationships = useMemo(
    () => Array.from(new Set(normalizedBirthdays.map((item) => item.relationship))),
    [normalizedBirthdays]
  );

  const visibleBirthdays = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    const filteredBirthdays = normalizedBirthdays
      .filter(
        (item) =>
          relationshipFilter === "all" ||
          item.relationship === relationshipFilter
      )
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.relationship.toLowerCase().includes(normalizedSearch) ||
          item.gregorianDate.includes(normalizedSearch) ||
          item.hebrewDate.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort(
        (a, b) =>
          getDaysUntilBirthday({
            gregorianDate: a.gregorianDate,
            calendarType: a.calendarType ?? "hebrew",
          }) -
          getDaysUntilBirthday({
            gregorianDate: b.gregorianDate,
            calendarType: b.calendarType ?? "hebrew",
          })
      );

    return groupBirthdaysByDate(filteredBirthdays);
  }, [normalizedBirthdays, relationshipFilter, searchValue]);

  const upcomingBirthdays = visibleBirthdays.filter(
    (item) => getDaysUntilBirthday({
      gregorianDate: item.gregorianDate,
      calendarType: item.calendarType ?? "hebrew",
    }) <= 45
  );
  const displayedBirthdays = showAllBirthdays
    ? visibleBirthdays
    : visibleBirthdays.slice(0, 5);
  const nextBirthday = visibleBirthdays[0];

  function handleDateViewChange(viewMode: BirthdayDateViewMode) {
    setDateViewMode(viewMode);
    setBirthdayDateViewMode(viewMode);
  }

  function handleCalendarTypeChange(ids: string[], calendarType: BirthdayCalendarType) {
    const birthdayIds = new Set(ids);

    setBirthdays((currentBirthdays) =>
      currentBirthdays.map((birthday) =>
        birthdayIds.has(birthday.id) ? { ...birthday, calendarType } : birthday
      )
    );
  }

  function handleAddBirthday(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newBirthdayForm.name.trim() || !newBirthdayForm.date) {
      return;
    }

    const createdBirthday: BirthdayPerson = {
      id: `birthday-${Date.now()}`,
      name: newBirthdayForm.name.trim(),
      relationship: newBirthdayForm.relationship.trim() || "משפחה",
      gregorianDate: newBirthdayForm.date,
      hebrewDate:
        newBirthdayForm.calendarType === "hebrew"
          ? formatHebrewDate(newBirthdayForm.date, "")
          : "",
      calendarType: newBirthdayForm.calendarType,
      reminders: newBirthdayForm.reminders,
      notes: newBirthdayForm.notes.trim(),
    };

    setBirthdays((currentBirthdays) => [...currentBirthdays, createdBirthday]);
    setShowAddBirthdayForm(false);
    setNewBirthdayForm({
      name: "",
      relationship: "",
      date: "",
      calendarType: "hebrew",
      reminders: ["week-before"],
      notes: "",
    });
  }

  return (
    <section className="space-y-3">
      {nextBirthday && (
        <section className="rounded-[24px] bg-gradient-to-br from-pink-400/18 via-white/[0.055] to-[#d8b470]/10 p-4 text-right shadow-[0_18px_54px_rgba(2,6,23,0.24)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="w-fit rounded-full bg-white/[0.08] px-3 py-1 text-xs font-bold text-slate-200">
              האירוע הבא
            </span>
            <div>
              <p className="text-sm font-bold text-slate-300">
                עוד {getDaysUntilBirthday({
                  gregorianDate: nextBirthday.gregorianDate,
                  calendarType: nextBirthday.calendarType ?? "hebrew",
                })} ימים
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                {nextBirthday.name}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {dateViewMode === "hebrew"
                  ? nextBirthday.hebrewDate || formatHebrewDate(nextBirthday.gregorianDate, "אין תאריך עברי")
                  : formatBirthdayDate(nextBirthday.gregorianDate, "gregorian", "אין תאריך לועזי")}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {dateViewMode === "hebrew"
                  ? formatDate(nextBirthday.gregorianDate)
                  : nextBirthday.hebrewDate || formatHebrewDate(nextBirthday.gregorianDate, "אין תאריך עברי")}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[22px] border border-white/10 bg-slate-800/45 p-3 text-right shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <button
          type="button"
          onClick={() => setShowAddBirthdayForm((currentValue) => !currentValue)}
          className="w-full rounded-2xl bg-white/90 px-4 py-2.5 text-sm font-black text-slate-900"
        >
          {showAddBirthdayForm ? "סגור טופס" : "+ הוסף ימי הולדת"}
        </button>

        {showAddBirthdayForm && (
          <form onSubmit={handleAddBirthday} className="mt-3 space-y-2.5 rounded-[18px] border border-white/10 bg-white/[0.06] p-3">
            <input
              value={newBirthdayForm.name}
              onChange={(event) => setNewBirthdayForm((currentValue) => ({ ...currentValue, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-right text-sm text-white outline-none"
              placeholder="שם"
              required
            />
            <input
              value={newBirthdayForm.relationship}
              onChange={(event) => setNewBirthdayForm((currentValue) => ({ ...currentValue, relationship: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-right text-sm text-white outline-none"
              placeholder="קרבה"
            />
            <input
              type="date"
              value={newBirthdayForm.date}
              onChange={(event) => setNewBirthdayForm((currentValue) => ({ ...currentValue, date: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-right text-sm text-white outline-none"
              required
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={newBirthdayForm.reminders.includes("week-before")}
                  onChange={() => setNewBirthdayForm((currentValue) => ({
                    ...currentValue,
                    reminders: currentValue.reminders.includes("week-before")
                      ? currentValue.reminders.filter((reminder) => reminder !== "week-before")
                      : [...currentValue.reminders, "week-before"],
                  }))}
                  className="ml-2"
                />
                שבוע לפני
              </label>
              <label className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={newBirthdayForm.reminders.includes("day-before")}
                  onChange={() => setNewBirthdayForm((currentValue) => ({
                    ...currentValue,
                    reminders: currentValue.reminders.includes("day-before")
                      ? currentValue.reminders.filter((reminder) => reminder !== "day-before")
                      : [...currentValue.reminders, "day-before"],
                  }))}
                  className="ml-2"
                />
                יום לפני
              </label>
            </div>
            <select
              value={newBirthdayForm.calendarType}
              onChange={(event) => setNewBirthdayForm((currentValue) => ({ ...currentValue, calendarType: event.target.value as BirthdayCalendarType }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-right text-sm text-white outline-none"
            >
              <option value="hebrew">עברי</option>
              <option value="gregorian">לועזי</option>
            </select>
            <textarea
              value={newBirthdayForm.notes}
              onChange={(event) => setNewBirthdayForm((currentValue) => ({ ...currentValue, notes: event.target.value }))}
              className="min-h-[72px] w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-right text-sm text-white outline-none"
              placeholder="הערות"
            />
            <button type="submit" className="w-full rounded-2xl bg-[#d8b470] px-4 py-2.5 text-sm font-black text-slate-900">
              שמור ימי הולדת
            </button>
          </form>
        )}
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">ימי הולדת</p>
          <p className="mt-1 text-xl font-black">{birthdays.length}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">קרובים</p>
          <p className="mt-1 text-xl font-black">{upcomingBirthdays.length}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">תזכורות</p>
          <p className="mt-1 text-xl font-black">
            {birthdays.reduce((sum, item) => sum + item.reminders.length, 0)}
          </p>
        </div>
      </div>

      <section className="rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] p-1">
              <button
                type="button"
                onClick={() => handleDateViewChange("hebrew")}
                className={`rounded-full px-3 py-1.5 text-sm font-black transition ${
                  dateViewMode === "hebrew"
                    ? "bg-white text-[#111827]"
                    : "text-slate-300"
                }`}
              >
                עברי
              </button>
              <button
                type="button"
                onClick={() => handleDateViewChange("gregorian")}
                className={`rounded-full px-3 py-1.5 text-sm font-black transition ${
                  dateViewMode === "gregorian"
                    ? "bg-white text-[#111827]"
                    : "text-slate-300"
                }`}
              >
                לועזי
              </button>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={
                viewMode === "cards"
                  ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  : "rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200"
              }
            >
              כרטיסים
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={
                viewMode === "table"
                  ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  : "rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200"
              }
            >
              טבלה
            </button>
          </div>

          <div>
            <p className="mb-1 text-xs text-slate-400">
              הכנה להתראות: שבוע לפני ויום לפני
            </p>
            <h2 className="text-lg font-black">ימי הולדת משפחתיים</h2>
          </div>
        </div>

        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="חיפוש לפי שם, קרבה או תאריך"
          />

          <select
            value={relationshipFilter}
            onChange={(event) => setRelationshipFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="all">כל הקרבות</option>
            {relationships.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationship}
              </option>
            ))}
          </select>
        </div>

        {viewMode === "cards" ? (
          <div className="relative grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {displayedBirthdays.map((item) => (
              <article key={item.id} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold text-slate-300">
                      עוד {getDaysUntilBirthday({
                        gregorianDate: item.gregorianDate,
                        calendarType: item.calendarType ?? "hebrew",
                      })} ימים
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                      {getBirthdayCalendarBadge(item.calendarType ?? "hebrew")}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{item.name}</h3>
                    <p className="text-xs font-bold text-slate-400">
                      {item.relationship}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm leading-6 text-slate-400">
                  <p>
                    {dateViewMode === "hebrew" ? "עברי" : "לועזי"}: {dateViewMode === "hebrew"
                      ? item.hebrewDate || formatHebrewDate(item.gregorianDate, "אין תאריך עברי")
                      : formatBirthdayDate(item.gregorianDate, "gregorian", "אין תאריך לועזי")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {dateViewMode === "hebrew"
                      ? `לועזי: ${formatDate(item.gregorianDate)}`
                      : `עברי: ${item.hebrewDate || formatHebrewDate(item.gregorianDate, "אין תאריך עברי")}`}
                  </p>
                  <p>גיל: {getAgePlaceholder(item.gregorianDate)}</p>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCalendarTypeChange(
                        item.members.map((member) => member.id),
                        item.calendarType === "gregorian" ? "hebrew" : "gregorian"
                      )
                    }
                    className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 text-xs font-bold text-slate-200"
                  >
                    {item.calendarType === "gregorian" ? "החלף לעברי" : "החלף ללועזי"}
                  </button>
                  {item.reminders.map((reminder) => (
                    <span
                      key={reminder}
                      className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold text-slate-300"
                    >
                      {getReminderLabel(reminder)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3">שם</th>
                  <th className="py-3">קרבה</th>
                  <th className="py-3">תאריך לועזי</th>
                  <th className="py-3">תאריך עברי</th>
                  <th className="py-3">גיל</th>
                  <th className="py-3">תזכורות</th>
                </tr>
              </thead>
              <tbody>
                {displayedBirthdays.map((item) => (
                  <tr key={item.id} className="border-b border-white/10 text-slate-300">
                    <td className="py-3 font-black">{item.name}</td>
                    <td className="py-3">{item.relationship}</td>
                    <td className="py-3">{formatDate(item.gregorianDate)}</td>
                    <td className="py-3">{item.hebrewDate || formatHebrewDate(item.gregorianDate, "אין תאריך עברי")}</td>
                    <td className="py-3">{getAgePlaceholder(item.gregorianDate)}</td>
                    <td className="py-3">
                      {item.reminders.map(getReminderLabel).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {visibleBirthdays.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllBirthdays((currentValue) => !currentValue)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.09]"
          >
            {showAllBirthdays ? "הצג פחות" : `הצג עוד ${visibleBirthdays.length - 5}`}
          </button>
        )}
      </section>
    </section>
  );
}
