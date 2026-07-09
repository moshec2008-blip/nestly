"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { initialBirthdays } from "@/data/birthdays";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import type {
  BirthdayCalendarType,
  FamilyEvent,
  BirthdayReminder,
  FamilyEventType,
} from "@/types/birthdays";
import {
  getBirthdayAge,
  getBirthdayCalendarBadge,
  getDaysUntilFamilyEvent,
  getDefaultCalendarTypeForEvent,
  getDefaultFamilyEventTitle,
  normalizeFamilyEvent,
} from "@/utils/birthdayCalendar";
import {
  formatGregorianDate,
  formatHebrewDate,
  getBirthdayDateViewMode,
  setBirthdayDateViewMode,
  type BirthdayDateViewMode,
} from "@/utils/hebrewDate";

type TimelineBucket = "today" | "week" | "month" | "later";
type EventFilter = "all" | FamilyEventType;
type CalendarFilter = "all" | BirthdayCalendarType;

type EventFormState = {
  title: string;
  person: string;
  relationship: string;
  eventType: FamilyEventType;
  date: string;
  imageUrl: string;
  calendarType: BirthdayCalendarType;
  reminders: BirthdayReminder[];
  notes: string;
};

const eventTypes: Record<
  FamilyEventType,
  {
    label: string;
    plural: string;
    icon: string;
    tone: string;
    chip: string;
    shadow: string;
  }
> = {
  birthday: {
    label: "יום הולדת",
    plural: "ימי הולדת",
    icon: "🎂",
    tone: "from-orange-50 to-amber-50 text-orange-950 ring-orange-100",
    chip: "bg-orange-100 text-orange-900",
    shadow: "shadow-[0_14px_42px_rgba(249,115,22,0.14)]",
  },
  anniversary: {
    label: "יום נישואין",
    plural: "ימי נישואין",
    icon: "💍",
    tone: "from-sky-50 to-blue-50 text-blue-950 ring-blue-100",
    chip: "bg-blue-100 text-blue-900",
    shadow: "shadow-[0_14px_42px_rgba(37,99,235,0.12)]",
  },
  memorial: {
    label: "יארצייט",
    plural: "ימי זיכרון",
    icon: "🕯️",
    tone: "from-slate-50 to-zinc-50 text-slate-950 ring-slate-200",
    chip: "bg-slate-200 text-slate-900",
    shadow: "shadow-[0_14px_42px_rgba(71,85,105,0.12)]",
  },
  custom: {
    label: "אירוע משפחתי",
    plural: "אירועים נוספים",
    icon: "⭐",
    tone: "from-violet-50 to-purple-50 text-purple-950 ring-violet-100",
    chip: "bg-violet-100 text-violet-900",
    shadow: "shadow-[0_14px_42px_rgba(124,58,237,0.12)]",
  },
};

const reminderOptions: Array<{ value: BirthdayReminder; label: string }> = [
  { value: "week-before", label: "שבוע לפני" },
  { value: "three-days-before", label: "3 ימים לפני" },
  { value: "day-before", label: "יום לפני" },
  { value: "same-day", label: "באותו יום" },
];

const monthOptions = [
  "כל החודשים",
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

const emptyForm: EventFormState = {
  title: "",
  person: "",
  relationship: "",
  eventType: "birthday",
  date: "",
  imageUrl: "",
  calendarType: "hebrew",
  reminders: ["week-before"],
  notes: "",
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function getAvatarTone(id: string) {
  const tones = [
    "from-orange-200 to-amber-100 text-orange-950",
    "from-blue-200 to-cyan-100 text-blue-950",
    "from-slate-200 to-zinc-100 text-slate-950",
    "from-violet-200 to-purple-100 text-violet-950",
    "from-pink-200 to-rose-100 text-pink-950",
  ];
  const index = id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[index % tones.length];
}

function getDisplayName(event: FamilyEvent) {
  return event.person || event.name || event.title || "אירוע משפחתי";
}

function getDisplayTitle(event: FamilyEvent) {
  return (
    event.title ||
    getDefaultFamilyEventTitle(event.eventType ?? "birthday", getDisplayName(event))
  );
}

function getDaysLabel(daysUntil: number) {
  if (daysUntil === 0) {
    return "היום";
  }

  if (daysUntil === 1) {
    return "מחר";
  }

  if (daysUntil <= 7) {
    return `בעוד ${daysUntil} ימים`;
  }

  return `עוד ${daysUntil} ימים`;
}

function getBucket(daysUntil: number): TimelineBucket {
  if (daysUntil === 0) return "today";
  if (daysUntil <= 7) return "week";
  if (daysUntil <= 31) return "month";
  return "later";
}

function getHebrewDisplayDate(event: FamilyEvent) {
  return event.hebrewDate || formatHebrewDate(event.gregorianDate, "אין תאריך עברי");
}

function getReminderLabel(reminder: BirthdayReminder) {
  return reminderOptions.find((option) => option.value === reminder)?.label ?? "תזכורת";
}

function EventAvatar({ event, size = "md" }: { event: FamilyEvent; size?: "md" | "lg" }) {
  const name = getDisplayName(event);
  const sizeClass = size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm";

  if (event.imageUrl) {
    return (
      <span className={`${sizeClass} relative shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm`}>
        <Image
          src={event.imageUrl}
          alt={`תמונה של ${name}`}
          fill
          sizes={size === "lg" ? "64px" : "44px"}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarTone(event.id)} font-black shadow-sm`}
      aria-label={`אווטאר של ${name}`}
    >
      {getInitials(name)}
    </span>
  );
}

function UpcomingDashboard({ events }: { events: FamilyEvent[] }) {
  const upcoming = events.slice(0, 3);
  const nextEvent = upcoming[0];

  return (
    <section className="nestly-hero rounded-[28px] p-3.5 text-right sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {nextEvent ? (
            <EventAvatar event={nextEvent} size="lg" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-3xl shadow-sm">
              ⭐
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-black text-purple-800">Family Events</p>
            <h1 className="truncate text-2xl font-black text-[#24151f] sm:text-3xl">
              אירועים משפחתיים קרובים
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-700">
              ימי הולדת, נישואין, יארצייטים ומסורות משפחתיות במקום אחד.
            </p>
          </div>
        </div>

        <div className="grid gap-2 lg:min-w-[360px]">
          {upcoming.length > 0 ? (
            upcoming.map((event) => {
              const type = event.eventType ?? "birthday";
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/85 px-3 py-2 shadow-sm"
                >
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-700">
                    {getDaysLabel(getDaysUntilFamilyEvent(event))}
                  </span>
                  <p className="truncate text-sm font-black text-[#24151f]">
                    {eventTypes[type].icon} {getDisplayTitle(event)}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl bg-white/85 px-3 py-4 text-sm font-black text-slate-700">
              עדיין אין אירועים. הוסף אירוע משפחתי ראשון.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type EventCardProps = {
  event: FamilyEvent;
  dateViewMode: BirthdayDateViewMode;
  onUpdate: (id: string, patch: Partial<FamilyEvent>) => void;
};

function EventCard({ event, dateViewMode, onUpdate }: EventCardProps) {
  const type = event.eventType ?? "birthday";
  const visual = eventTypes[type];
  const daysUntil = getDaysUntilFamilyEvent(event);
  const giftPlan = event.giftPlan ?? {
    ideas: "",
    budget: "",
    purchased: false,
    wrapped: false,
    delivered: false,
  };
  const partyPlan = event.partyPlan ?? {
    cake: false,
    balloons: false,
    invitations: false,
    food: false,
    decorations: false,
  };
  const showBirthdayPlanning = type === "birthday";

  return (
    <article
      className={`rounded-[22px] bg-gradient-to-br ${visual.tone} ${visual.shadow} p-3 text-right ring-1 transition duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-3">
        <EventAvatar event={event} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${visual.chip}`}>
              {visual.icon} {visual.label}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black">{getDisplayTitle(event)}</h3>
              <p className="truncate text-xs font-bold text-slate-600">
                {getDisplayName(event)}
                {event.relationship ? ` · ${event.relationship}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-2xl bg-white/80 px-3 py-2 font-black">
              {getDaysLabel(daysUntil)}
            </span>
            <span className="rounded-2xl bg-white/70 px-3 py-2 font-black">
              {type === "birthday" ? `גיל ${getBirthdayAge(event)}` : "חוזר שנתי"}
            </span>
          </div>

          <div className="mt-2 rounded-2xl bg-white/75 px-3 py-2">
            <p className="truncate text-sm font-black">
              {dateViewMode === "hebrew"
                ? getHebrewDisplayDate(event)
                : formatGregorianDate(event.gregorianDate)}
            </p>
            <p className="truncate text-[11px] font-semibold text-slate-500">
              {dateViewMode === "hebrew"
                ? formatGregorianDate(event.gregorianDate)
                : getHebrewDisplayDate(event)}
              {" · "}
              {getBirthdayCalendarBadge(event.calendarType)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-end gap-1.5">
        {event.reminders.map((reminder) => (
          <span
            key={reminder}
            className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-slate-800"
          >
            {getReminderLabel(reminder)}
          </span>
        ))}
        <button
          type="button"
          onClick={() =>
            onUpdate(event.id, {
              calendarType: event.calendarType === "hebrew" ? "gregorian" : "hebrew",
            })
          }
          className="min-h-8 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          החלף ללוח {event.calendarType === "hebrew" ? "לועזי" : "עברי"}
        </button>
      </div>

      {event.notes && (
        <p className="mt-2 line-clamp-2 rounded-2xl bg-white/60 px-3 py-2 text-xs font-semibold text-slate-700">
          {event.notes}
        </p>
      )}

      {showBirthdayPlanning && (
        <details className="mt-2 rounded-2xl bg-white/65 px-3 py-2">
          <summary className="cursor-pointer list-none text-sm font-black">
            מתנה ותכנון חגיגה
          </summary>
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-black text-slate-700">
                רעיונות למתנה
                <input
                  value={giftPlan.ideas}
                  onChange={(eventChange) =>
                    onUpdate(event.id, {
                      giftPlan: { ...giftPlan, ideas: eventChange.target.value },
                    })
                  }
                  className="mt-1 h-11 w-full rounded-2xl border border-orange-100 bg-white px-3 text-right text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="ספר, משחק, חוויה..."
                />
              </label>
              <label className="text-xs font-black text-slate-700">
                תקציב
                <input
                  value={giftPlan.budget}
                  onChange={(eventChange) =>
                    onUpdate(event.id, {
                      giftPlan: { ...giftPlan, budget: eventChange.target.value },
                    })
                  }
                  className="mt-1 h-11 w-full rounded-2xl border border-orange-100 bg-white px-3 text-right text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="₪"
                />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["purchased", "נקנה"],
                ["wrapped", "נעטף"],
                ["delivered", "נמסר"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-2 text-xs font-black text-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(giftPlan[key as keyof typeof giftPlan])}
                    onChange={(eventChange) =>
                      onUpdate(event.id, {
                        giftPlan: {
                          ...giftPlan,
                          [key]: eventChange.target.checked,
                        },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <details className="rounded-2xl bg-white px-3 py-2">
              <summary className="cursor-pointer list-none text-xs font-black text-orange-900">
                צ׳קליסט מסיבה
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  ["cake", "עוגה"],
                  ["balloons", "בלונים"],
                  ["invitations", "הזמנות"],
                  ["food", "אוכל"],
                  ["decorations", "קישוטים"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex min-h-10 items-center justify-end gap-2 rounded-xl bg-orange-50 px-3 text-xs font-bold text-slate-800"
                  >
                    {label}
                    <input
                      type="checkbox"
                      checked={Boolean(partyPlan[key as keyof typeof partyPlan])}
                      onChange={(eventChange) =>
                        onUpdate(event.id, {
                          partyPlan: {
                            ...partyPlan,
                            [key]: eventChange.target.checked,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </details>
          </div>
        </details>
      )}
    </article>
  );
}

type TimelineSectionProps = {
  title: string;
  subtitle: string;
  events: FamilyEvent[];
  dateViewMode: BirthdayDateViewMode;
  onUpdate: (id: string, patch: Partial<FamilyEvent>) => void;
};

function TimelineSection({
  title,
  subtitle,
  events,
  dateViewMode,
  onUpdate,
}: TimelineSectionProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="nestly-card rounded-[26px] p-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-right">
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">
          {events.length}
        </span>
        <div>
          <h2 className="text-base font-black text-[#24151f]">{title}</h2>
          <p className="text-xs font-semibold text-slate-600">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            dateViewMode={dateViewMode}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </section>
  );
}

function SmartInsights({ events }: { events: FamilyEvent[] }) {
  const thisMonthCount = events.filter((event) => getDaysUntilFamilyEvent(event) <= 31).length;
  const memorialSoon = events.find(
    (event) => event.eventType === "memorial" && getDaysUntilFamilyEvent(event) <= 14
  );
  const missingGift = events.find(
    (event) =>
      event.eventType === "birthday" &&
      getDaysUntilFamilyEvent(event) <= 31 &&
      !event.giftPlan?.ideas
  );
  const anniversarySoon = events.find(
    (event) =>
      event.eventType === "anniversary" &&
      getDaysUntilFamilyEvent(event) <= 31
  );

  const insights = [
    thisMonthCount > 0
      ? `${thisMonthCount} אירועים משפחתיים בחודש הקרוב.`
      : "החודש רגוע, אין אירועים קרובים.",
    anniversarySoon
      ? `${getDisplayTitle(anniversarySoon)} מתקרב.`
      : null,
    memorialSoon ? `כדאי להתכונן ל${getDisplayTitle(memorialSoon)}.` : null,
    missingGift ? `עוד לא הוספת רעיון למתנה עבור ${getDisplayName(missingGift)}.` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {insights.map((insight) => (
        <div
          key={insight}
          className="rounded-[20px] bg-white/75 px-3 py-2 text-right text-xs font-black text-[#24151f] shadow-[0_10px_30px_rgba(124,58,237,0.08)] ring-1 ring-white"
        >
          {insight}
        </div>
      ))}
    </div>
  );
}

export default function FamilyEventsManager() {
  const [events, setEvents] = usePersistentArrayState<FamilyEvent>(
    storageKeys.birthdays,
    initialBirthdays
  );
  const [searchValue, setSearchValue] = useState("");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [dateViewMode, setDateViewMode] = useState<BirthdayDateViewMode>(() =>
    getBirthdayDateViewMode()
  );
  const [form, setForm] = useState<EventFormState>(emptyForm);

  useEffect(() => {
    const needsMigration = events.some(
      (event) =>
        !event.eventType ||
        !event.title ||
        !event.recurringAnnually ||
        !event.reminders?.length ||
        !event.giftPlan ||
        !event.partyPlan
    );

    if (needsMigration) {
      setEvents((currentEvents) => currentEvents.map(normalizeFamilyEvent));
    }
  }, [events, setEvents]);

  const normalizedEvents = useMemo(
    () => events.map(normalizeFamilyEvent),
    [events]
  );

  const visibleEvents = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return normalizedEvents
      .filter((event) => eventFilter === "all" || event.eventType === eventFilter)
      .filter(
        (event) =>
          monthFilter === "all" ||
          new Date(event.gregorianDate).getMonth() === Number(monthFilter)
      )
      .filter(
        (event) =>
          calendarFilter === "all" || event.calendarType === calendarFilter
      )
      .filter((event) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          getDisplayTitle(event).toLowerCase().includes(normalizedSearch) ||
          getDisplayName(event).toLowerCase().includes(normalizedSearch) ||
          event.relationship.toLowerCase().includes(normalizedSearch) ||
          event.gregorianDate.includes(normalizedSearch) ||
          event.hebrewDate.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort(
        (first, second) =>
          getDaysUntilFamilyEvent(first) - getDaysUntilFamilyEvent(second)
      );
  }, [calendarFilter, eventFilter, monthFilter, normalizedEvents, searchValue]);

  const timeline = useMemo(() => {
    return visibleEvents.reduce<Record<TimelineBucket, FamilyEvent[]>>(
      (groups, event) => {
        groups[getBucket(getDaysUntilFamilyEvent(event))].push(event);
        return groups;
      },
      { today: [], week: [], month: [], later: [] }
    );
  }, [visibleEvents]);

  function updateEvent(id: string, patch: Partial<FamilyEvent>) {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === id ? normalizeFamilyEvent({ ...event, ...patch }) : event
      )
    );
  }

  function updateFormEventType(eventType: FamilyEventType) {
    setForm((currentValue) => ({
      ...currentValue,
      eventType,
      calendarType: getDefaultCalendarTypeForEvent(eventType),
    }));
  }

  function toggleReminder(reminder: BirthdayReminder) {
    setForm((currentValue) => ({
      ...currentValue,
      reminders: currentValue.reminders.includes(reminder)
        ? currentValue.reminders.filter((item) => item !== reminder)
        : [...currentValue.reminders, reminder],
    }));
  }

  function handleDateViewChange(viewMode: BirthdayDateViewMode) {
    setDateViewMode(viewMode);
    setBirthdayDateViewMode(viewMode);
  }

  function handleAddEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.date || (!form.title.trim() && !form.person.trim())) {
      return;
    }

    const person = form.person.trim();
    const title =
      form.title.trim() || getDefaultFamilyEventTitle(form.eventType, person);
    const createdEvent = normalizeFamilyEvent({
      id: `family-event-${Date.now()}`,
      title,
      name: person || title,
      person: person || title,
      relationship: form.relationship.trim(),
      eventType: form.eventType,
      gregorianDate: form.date,
      hebrewDate:
        form.calendarType === "hebrew" ? formatHebrewDate(form.date, "") : "",
      calendarType: form.calendarType,
      recurringAnnually: true,
      reminders: form.reminders.length ? form.reminders : ["week-before"],
      notes: form.notes.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
    });

    setEvents((currentEvents) => [...currentEvents, createdEvent]);
    setForm(emptyForm);
    setShowAddForm(false);
  }

  const eventCounts = normalizedEvents.reduce<Record<FamilyEventType, number>>(
    (counts, event) => {
      counts[event.eventType ?? "birthday"] += 1;
      return counts;
    },
    { birthday: 0, anniversary: 0, memorial: 0, custom: 0 }
  );

  return (
    <section className="space-y-3 text-[#24151f]">
      <UpcomingDashboard events={visibleEvents.length ? visibleEvents : normalizedEvents} />

      <section className="nestly-card-strong rounded-[28px] p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => setShowAddForm((currentValue) => !currentValue)}
            className="min-h-11 rounded-2xl bg-[#24151f] px-4 py-2 text-sm font-black text-white shadow-[0_12px_28px_rgba(36,21,31,0.18)] focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {showAddForm ? "סגור טופס" : "הוסף אירוע משפחתי"}
          </button>

          <div className="grid grid-cols-4 gap-2 text-right lg:min-w-[460px]">
            {(Object.keys(eventTypes) as FamilyEventType[]).map((type) => (
              <div key={type} className="rounded-2xl bg-white/80 px-2.5 py-2 shadow-sm">
                <p className="truncate text-[10px] font-black text-slate-500">
                  {eventTypes[type].plural}
                </p>
                <p className="text-lg font-black">
                  {eventTypes[type].icon} {eventCounts[type]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddEvent}
            className="mt-3 grid gap-2 rounded-[22px] bg-white/82 p-3 shadow-inner sm:grid-cols-2"
          >
            <div className="grid grid-cols-2 gap-1.5 sm:col-span-2 lg:grid-cols-4">
              {(Object.keys(eventTypes) as FamilyEventType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateFormEventType(type)}
                  className={`min-h-11 rounded-2xl px-3 text-xs font-black ring-1 ${
                    form.eventType === type
                      ? `${eventTypes[type].chip} ring-transparent`
                      : "bg-white text-slate-700 ring-slate-100"
                  }`}
                >
                  {eventTypes[type].icon} {eventTypes[type].label}
                </button>
              ))}
            </div>

            <input
              value={form.title}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  title: event.target.value,
                }))
              }
              className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="כותרת האירוע"
            />
            <input
              value={form.person}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  person: event.target.value,
                }))
              }
              className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="אדם / זוג / משפחה"
            />
            <input
              value={form.relationship}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  relationship: event.target.value,
                }))
              }
              className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="קרבה, לא חובה"
            />
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  date: event.target.value,
                }))
              }
              className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
              required
            />
            <input
              value={form.imageUrl}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  imageUrl: event.target.value,
                }))
              }
              className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="קישור לתמונה, לא חובה"
            />

            <div className="flex min-h-11 rounded-2xl bg-slate-100 p-1">
              {(["hebrew", "gregorian"] as BirthdayCalendarType[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    setForm((currentValue) => ({
                      ...currentValue,
                      calendarType: mode,
                    }))
                  }
                  className={`flex-1 rounded-xl text-sm font-black ${
                    form.calendarType === mode
                      ? "bg-white text-purple-900 shadow-sm"
                      : "text-slate-700"
                  }`}
                >
                  {mode === "hebrew" ? "עברי" : "לועזי"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-1.5 sm:col-span-2">
              {reminderOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-slate-800 ring-1 ring-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={form.reminders.includes(option.value)}
                    onChange={() => toggleReminder(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  notes: event.target.value,
                }))
              }
              className="min-h-20 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200 sm:col-span-2"
              placeholder="הערות"
            />
            <button
              type="submit"
              className="min-h-11 rounded-2xl bg-purple-700 px-4 py-2 text-sm font-black text-white shadow-[0_12px_28px_rgba(124,58,237,0.2)] sm:col-span-2"
            >
              שמור אירוע משפחתי
            </button>
          </form>
        )}
      </section>

      <SmartInsights events={normalizedEvents} />

      <section className="nestly-card rounded-[28px] p-3">
        <div className="flex flex-wrap justify-end gap-1.5">
          {(["all", "birthday", "anniversary", "memorial", "custom"] as EventFilter[]).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setEventFilter(filter)}
                className={`min-h-10 rounded-full px-3 text-xs font-black ${
                  eventFilter === filter
                    ? "bg-[#24151f] text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-100"
                }`}
              >
                {filter === "all"
                  ? "All"
                  : `${eventTypes[filter].icon} ${eventTypes[filter].plural}`}
              </button>
            )
          )}
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-purple-200"
            placeholder="חיפוש לפי כותרת, אדם, קרבה או תאריך"
          />
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-200"
          >
            {monthOptions.map((month, index) => (
              <option key={month} value={index === 0 ? "all" : String(index - 1)}>
                {month}
              </option>
            ))}
          </select>
          <select
            value={calendarFilter}
            onChange={(event) => setCalendarFilter(event.target.value as CalendarFilter)}
            className="h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="all">כל הלוחות</option>
            <option value="hebrew">לוח עברי</option>
            <option value="gregorian">לוח לועזי</option>
          </select>
          <div className="flex h-11 rounded-2xl bg-slate-100 p-1">
            {(["hebrew", "gregorian"] as BirthdayDateViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleDateViewChange(mode)}
                className={`flex-1 rounded-xl text-sm font-black ${
                  dateViewMode === mode
                    ? "bg-white text-purple-900 shadow-sm"
                    : "text-slate-700"
                }`}
              >
                {mode === "hebrew" ? "עברי" : "לועזי"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {visibleEvents.length === 0 ? (
        <section className="nestly-card-strong rounded-[28px] p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-white text-3xl shadow-sm">
            ⭐
          </div>
          <h2 className="mt-3 text-xl font-black text-[#24151f]">
            אין אירועים משפחתיים להצגה
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-slate-600">
            הוסיפו יום הולדת, יום נישואין, יארצייט או מסורת משפחתית.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-4 min-h-11 rounded-2xl bg-purple-700 px-5 text-sm font-black text-white"
          >
            הוסף אירוע משפחתי ראשון
          </button>
        </section>
      ) : (
        <div className="space-y-3">
          <TimelineSection
            title="היום"
            subtitle="אירועים שמתרחשים עכשיו"
            events={timeline.today}
            dateViewMode={dateViewMode}
            onUpdate={updateEvent}
          />
          <TimelineSection
            title="השבוע"
            subtitle="כדאי להתכונן בימים הקרובים"
            events={timeline.week}
            dateViewMode={dateViewMode}
            onUpdate={updateEvent}
          />
          <TimelineSection
            title="החודש"
            subtitle="אירועים שמתקרבים"
            events={timeline.month}
            dateViewMode={dateViewMode}
            onUpdate={updateEvent}
          />
          <TimelineSection
            title="בהמשך"
            subtitle="כל שאר האירועים השנתיים"
            events={timeline.later}
            dateViewMode={dateViewMode}
            onUpdate={updateEvent}
          />
        </div>
      )}
    </section>
  );
}
