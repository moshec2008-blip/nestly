"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import HebrewDateInput from "@/components/ui/HebrewDateInput";
import { initialBirthdays } from "@/data/birthdays";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import type {
  BirthdayCalendarType,
  BirthdayReminder,
  FamilyEvent,
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
type EventFilter = "all" | "birthday" | "other" | FamilyEventType;
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
    soft: string;
  }
> = {
  birthday: {
    label: "יום הולדת",
    plural: "ימי הולדת",
    icon: "🎂",
    tone: "text-orange-950",
    chip: "bg-orange-100 text-orange-900",
    soft: "bg-orange-50 ring-orange-100",
  },
  anniversary: {
    label: "יום נישואין",
    plural: "ימי נישואין",
    icon: "💍",
    tone: "text-blue-950",
    chip: "bg-blue-100 text-blue-900",
    soft: "bg-blue-50 ring-blue-100",
  },
  memorial: {
    label: "יארצייט",
    plural: "ימי זיכרון",
    icon: "🕯️",
    tone: "text-slate-950",
    chip: "bg-slate-200 text-slate-900",
    soft: "bg-slate-50 ring-slate-200",
  },
  custom: {
    label: "אירוע משפחתי",
    plural: "אירועים נוספים",
    icon: "⭐",
    tone: "text-purple-950",
    chip: "bg-violet-100 text-violet-900",
    soft: "bg-violet-50 ring-violet-100",
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

const fieldClass =
  "h-11 rounded-2xl border border-slate-100 bg-white px-3 text-right text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-purple-200";

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
    "from-orange-100 to-amber-50 text-orange-950 ring-orange-100",
    "from-blue-100 to-cyan-50 text-blue-950 ring-blue-100",
    "from-slate-100 to-zinc-50 text-slate-950 ring-slate-200",
    "from-violet-100 to-purple-50 text-violet-950 ring-violet-100",
    "from-pink-100 to-rose-50 text-pink-950 ring-pink-100",
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
  if (daysUntil === 0) return "היום";
  if (daysUntil === 1) return "מחר";
  if (daysUntil <= 7) return `בעוד ${daysUntil} ימים`;
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

function EventAvatar({
  event,
  size = "md",
}: {
  event: FamilyEvent;
  size?: "sm" | "md" | "lg";
}) {
  const name = getDisplayName(event);
  const sizeClass =
    size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";

  if (event.imageUrl) {
    return (
      <span className={`${sizeClass} relative shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm`}>
        <Image
          src={event.imageUrl}
          alt={`תמונה של ${name}`}
          fill
          sizes={size === "lg" ? "56px" : "40px"}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarTone(event.id)} font-black shadow-sm ring-1`}
      aria-label={`אווטאר של ${name}`}
    >
      {getInitials(name)}
    </span>
  );
}

function UpcomingDashboard({
  events,
  isAddFormOpen,
  onToggleAddForm,
}: {
  events: FamilyEvent[];
  isAddFormOpen: boolean;
  onToggleAddForm: () => void;
}) {
  const upcoming = events.slice(0, 3);
  const nextEvent = upcoming[0];

  return (
    <section className="rounded-[18px] bg-gradient-to-br from-[#fff8eb] to-white p-2.5 text-right shadow-[0_10px_24px_rgba(154,107,23,0.07)] ring-1 ring-[#eadfcd]">
      <div className="flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#7a5212]">האירוע הקרוב</p>
          {nextEvent ? (
            <>
              <h1 className="mt-0.5 truncate text-base font-black text-[#24151f] sm:text-lg">
                {eventTypes[nextEvent.eventType ?? "birthday"].icon} {getDisplayTitle(nextEvent)}
              </h1>
              <p className="mt-0.5 text-xs font-bold text-slate-700 sm:text-sm">
                {getDaysLabel(getDaysUntilFamilyEvent(nextEvent))}
                {nextEvent.eventType === "birthday"
                  ? ` · גיל ${getBirthdayAge(nextEvent)}`
                  : ""}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-0.5 text-base font-black text-[#24151f] sm:text-lg">
                אירועי משפחה
              </h1>
              <p className="mt-0.5 text-xs font-bold text-slate-700 sm:text-sm">
                הוסיפו את האירוע המשפחתי הראשון.
              </p>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleAddForm}
            className="family-events-dark-action min-h-11 whitespace-nowrap rounded-2xl px-3 text-xs font-black shadow-[0_10px_22px_rgba(36,21,31,0.14)] transition focus:outline-none focus:ring-2 focus:ring-[#eadfcd]"
          >
            {isAddFormOpen ? "סגור" : "+ הוסף אירוע"}
          </button>
          {nextEvent ? (
            <EventAvatar event={nextEvent} />
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm">
              ⭐
            </span>
          )}
        </div>
      </div>

      {upcoming.length > 1 && (
        <div className="mt-2 grid gap-1">
          {upcoming.slice(1).map((event) => {
            const type = event.eventType ?? "birthday";
            return (
              <div
                key={event.id}
                className="flex min-h-8 items-center justify-between gap-2 rounded-2xl bg-white/70 px-2.5 text-[11px] font-black text-slate-700 shadow-sm"
              >
                <span>{getDaysLabel(getDaysUntilFamilyEvent(event))}</span>
                <span className="truncate">
                  {eventTypes[type].icon} {getDisplayTitle(event)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

type EventRowProps = {
  event: FamilyEvent;
  dateViewMode: BirthdayDateViewMode;
  onSelect: (event: FamilyEvent) => void;
};

function EventRow({ event, dateViewMode, onSelect }: EventRowProps) {
  const type = event.eventType ?? "birthday";
  const visual = eventTypes[type];
  const daysUntil = getDaysUntilFamilyEvent(event);
  const primaryDate =
    dateViewMode === "hebrew"
      ? getHebrewDisplayDate(event)
      : formatGregorianDate(event.gregorianDate);
  const giftHint =
    type === "birthday"
      ? event.giftPlan?.ideas
        ? "🎁 יש רעיון למתנה"
        : "🎁 מתנה לא הוגדרה"
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className={`grid min-h-[68px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-[14px] px-2 py-1.5 text-right transition hover:bg-[#fafafb] ${visual.tone}`}
    >
      <EventAvatar event={event} size="sm" />

      <span className="min-w-0">
        <span className="flex items-center justify-end gap-1.5">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${visual.chip}`}>
            {visual.icon} {visual.label}
          </span>
          <span className="truncate text-sm font-black text-[#24151f]">
            {getDisplayName(event)}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs font-bold text-slate-600">
          {getDaysLabel(daysUntil)}
          {type === "birthday" ? ` · גיל ${getBirthdayAge(event)}` : ""}
          {giftHint ? ` · ${giftHint}` : ""}
        </span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">
          {primaryDate}
        </span>
      </span>

      <span className="text-left text-xs font-black text-slate-400">›</span>
    </button>
  );
}

type TimelineSectionProps = {
  title: string;
  subtitle: string;
  events: FamilyEvent[];
  dateViewMode: BirthdayDateViewMode;
  limit?: number;
  showAll?: boolean;
  onShowAll?: () => void;
  onSelect: (event: FamilyEvent) => void;
};

function TimelineSection({
  title,
  subtitle,
  events,
  dateViewMode,
  limit,
  showAll = true,
  onShowAll,
  onSelect,
}: TimelineSectionProps) {
  if (events.length === 0) {
    return null;
  }

  const visibleEvents = limit && !showAll ? events.slice(0, limit) : events;
  const hiddenCount = events.length - visibleEvents.length;

  return (
    <section className="rounded-[18px] bg-white/88 p-2 text-right shadow-[0_8px_22px_rgba(36,21,31,0.035)] ring-1 ring-[#e6e8ec]">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#fafafb] px-2 py-0.5 text-[11px] font-black text-slate-600">
          {events.length}
        </span>
        <div>
          <h2 className="text-sm font-black text-[#24151f]">{title}</h2>
          <p className="text-[11px] font-semibold text-slate-600">{subtitle}</p>
        </div>
      </div>

      <div className="divide-y divide-[#eef0f3]">
        {visibleEvents.map((event) => (
          <EventRow
            key={event.id}
            event={event}
            dateViewMode={dateViewMode}
            onSelect={onSelect}
          />
        ))}
      </div>

      {hiddenCount > 0 && onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-2 min-h-11 w-full rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-800 transition hover:bg-[#fff8eb] focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
          הצג עוד {hiddenCount}
        </button>
      )}
    </section>
  );
}

type EventDetailsSheetProps = {
  event: FamilyEvent;
  dateViewMode: BirthdayDateViewMode;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<FamilyEvent>) => void;
  onDelete: (id: string) => void;
};

function EventDetailsSheet({
  event,
  dateViewMode,
  onClose,
  onUpdate,
  onDelete,
}: EventDetailsSheetProps) {
  const type = event.eventType ?? "birthday";
  const visual = eventTypes[type];
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(eventTarget) => {
        if (eventTarget.target === eventTarget.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[26px] bg-white p-4 text-right shadow-[0_28px_90px_rgba(15,23,42,0.28)] ring-1 ring-[#eadfcd]">
        <div className="flex items-start justify-between gap-3 border-b border-[#eef0f3] pb-3">
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#e6e8ec] bg-white text-lg font-black text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-200"
            aria-label="סגור"
          >
            ×
          </button>
          <div className="flex min-w-0 items-start justify-end gap-2.5">
            <div className="min-w-0">
              <p className={`text-xs font-black ${visual.tone}`}>
                {visual.icon} {visual.label} · {getDaysLabel(getDaysUntilFamilyEvent(event))}
              </p>
              <h3 className="mt-1 truncate text-lg font-black text-[#24151f]">
                {getDisplayTitle(event)}
              </h3>
              <p className="truncate text-sm font-bold text-slate-600">
                {getDisplayName(event)}
                {event.relationship ? ` · ${event.relationship}` : ""}
              </p>
            </div>
            <EventAvatar event={event} />
          </div>
        </div>

        <div className="grid gap-2 py-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#fafafb] p-3">
            <p className="text-[11px] font-black text-slate-500">תאריך עברי</p>
            <p className="mt-1 text-sm font-black text-[#24151f]">
              {getHebrewDisplayDate(event)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fafafb] p-3">
            <p className="text-[11px] font-black text-slate-500">תאריך לועזי</p>
            <p className="mt-1 text-sm font-black text-[#24151f]">
              {formatGregorianDate(event.gregorianDate)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fafafb] p-3">
            <p className="text-[11px] font-black text-slate-500">גיל / שנה</p>
            <p className="mt-1 text-sm font-black text-[#24151f]">
              {type === "birthday" ? `גיל ${getBirthdayAge(event)}` : "אירוע שנתי"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fafafb] p-3">
            <p className="text-[11px] font-black text-slate-500">לוח</p>
            <p className="mt-1 text-sm font-black text-[#24151f]">
              {getBirthdayCalendarBadge(event.calendarType)}
            </p>
          </div>
        </div>

        <details className="rounded-2xl bg-[#fafafb] p-3">
          <summary className="cursor-pointer list-none text-sm font-black text-[#24151f]">
            תזכורות ופרטים
          </summary>
          <div className="mt-3 flex flex-wrap justify-end gap-1.5">
            {event.reminders.map((reminder) => (
              <span
                key={reminder}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 ring-1 ring-slate-100"
              >
                {getReminderLabel(reminder)}
              </span>
            ))}
          </div>
          {event.notes && (
            <p className="mt-2 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700">
              {event.notes}
            </p>
          )}
        </details>

        {type === "birthday" && (
          <details className="mt-2 rounded-2xl bg-orange-50/70 p-3 ring-1 ring-orange-100">
            <summary className="cursor-pointer list-none text-sm font-black text-orange-950">
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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdate(event.id, {
                calendarType: event.calendarType === "hebrew" ? "gregorian" : "hebrew",
              })
            }
            className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-[#fff8eb] focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            החלף לוח
          </button>
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-800 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            מחיקה
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] font-bold text-slate-500">
          תצוגה נוכחית: {dateViewMode === "hebrew" ? "עברית" : "לועזית"}
        </p>
      </div>
    </div>
  );
}

function SmartInsights({ events }: { events: FamilyEvent[] }) {
  const thisMonthCount = events.filter(
    (event) => getDaysUntilFamilyEvent(event) <= 31
  ).length;
  const missingGift = events.find(
    (event) =>
      event.eventType === "birthday" &&
      getDaysUntilFamilyEvent(event) <= 31 &&
      !event.giftPlan?.ideas
  );
  const insight = missingGift
    ? `עוד לא הוספת רעיון למתנה עבור ${getDisplayName(missingGift)}.`
    : thisMonthCount > 0
      ? `${thisMonthCount} אירועים משפחתיים בחודש הקרוב.`
      : "החודש רגוע, אין אירועים קרובים.";

  return (
    <div className="rounded-[18px] bg-white/76 px-3 py-2 text-right text-xs font-black text-[#24151f] shadow-[0_8px_24px_rgba(124,58,237,0.06)] ring-1 ring-white">
      {insight}
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAllLater, setShowAllLater] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dateViewMode, setDateViewMode] = useState<BirthdayDateViewMode>(() =>
    getBirthdayDateViewMode()
  );
  const [form, setForm] = useState<EventFormState>(emptyForm);

  useEffect(() => {
    // חשוב: בדיקת undefined ולא ערך שקרי — recurringAnnually=false הוא ערך
    // לגיטימי שנשמר, ובדיקה שקרית גרמה ללולאת עדכונים אינסופית.
    const needsMigration = events.some(
      (event) =>
        event.eventType === undefined ||
        !event.title ||
        event.recurringAnnually === undefined ||
        !event.reminders?.length ||
        !event.giftPlan ||
        !event.partyPlan
    );

    if (!needsMigration) {
      return;
    }

    setEvents((currentEvents) => {
      const normalized = currentEvents.map(normalizeFamilyEvent);

      // מעדכנים רק אם באמת השתנה משהו, כדי לא ליצור כתיבות מיותרות.
      return JSON.stringify(normalized) === JSON.stringify(currentEvents)
        ? currentEvents
        : normalized;
    });
  }, [events, setEvents]);

  const normalizedEvents = useMemo(
    () => events.map(normalizeFamilyEvent),
    [events]
  );

  const visibleEvents = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return normalizedEvents
      .filter((event) => {
        if (eventFilter === "all") return true;
        if (eventFilter === "other") return event.eventType !== "birthday";
        return event.eventType === eventFilter;
      })
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
        if (!normalizedSearch) return true;

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

  const selectedEvent =
    normalizedEvents.find((event) => event.id === selectedEventId) ?? null;

  function updateEvent(id: string, patch: Partial<FamilyEvent>) {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === id ? normalizeFamilyEvent({ ...event, ...patch }) : event
      )
    );
  }

  function deleteEvent(id: string) {
    const approved = window.confirm("למחוק את האירוע המשפחתי?");

    if (!approved) return;

    setEvents((currentEvents) => currentEvents.filter((event) => event.id !== id));
    setSelectedEventId(null);
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

  function handleAddEvent(event: FormEvent<HTMLFormElement>) {
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

  return (
    <section className="space-y-2 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] text-[#24151f] lg:pb-0">
      <UpcomingDashboard
        events={visibleEvents.length ? visibleEvents : normalizedEvents}
        isAddFormOpen={showAddForm}
        onToggleAddForm={() => setShowAddForm((currentValue) => !currentValue)}
      />

      <section className="rounded-[18px] bg-white/78 p-2 shadow-[0_8px_22px_rgba(36,21,31,0.04)] ring-1 ring-[#eadfcd]/70">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <div className="flex shrink-0 justify-end gap-1 rounded-2xl bg-[#f7f4ef] p-1">
            {[
              { id: "all", label: "הכל" },
              { id: "birthday", label: "ימי הולדת" },
              { id: "other", label: "אירועים נוספים" },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setEventFilter(filter.id as EventFilter)}
                className={
                  eventFilter === filter.id
                    ? "family-events-dark-action min-h-11 whitespace-nowrap rounded-xl px-3 text-xs font-black shadow-sm focus:outline-none focus:ring-2 focus:ring-[#eadfcd]"
                    : "min-h-11 whitespace-nowrap rounded-xl px-3 text-xs font-black text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          <label className="relative block w-36 shrink-0 sm:w-48 md:w-56 lg:w-64">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            >
              <path
                d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="min-h-10 w-full rounded-2xl border border-slate-100 bg-white py-2 pl-3 pr-9 text-right text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-purple-200"
              placeholder="חיפוש אירוע"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((currentValue) => !currentValue)}
            className="min-h-11 shrink-0 whitespace-nowrap rounded-2xl bg-white px-3 text-xs font-black text-slate-800 shadow-sm ring-1 ring-slate-100 transition hover:bg-[#fff8eb] focus:outline-none focus:ring-2 focus:ring-purple-200"
            aria-expanded={showAdvancedFilters}
          >
            סינון
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="mt-2 grid gap-2 rounded-2xl bg-[#fafafb] p-2 md:grid-cols-3">
            <select
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              className={fieldClass}
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
              className={fieldClass}
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
        )}

        {showAddForm && (
          <form
            onSubmit={handleAddEvent}
            className="mt-2 grid gap-2 rounded-[18px] bg-white/82 p-2 shadow-inner sm:grid-cols-2"
          >
            <div className="grid grid-cols-2 gap-1.5 sm:col-span-2 lg:grid-cols-4">
              {(Object.keys(eventTypes) as FamilyEventType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateFormEventType(type)}
                  className={`min-h-11 rounded-2xl px-2 text-xs font-black ring-1 transition focus:outline-none focus:ring-2 focus:ring-purple-200 ${
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
              className={fieldClass}
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
              className={fieldClass}
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
              className={fieldClass}
              placeholder="קרבה, לא חובה"
            />
            {form.calendarType === "hebrew" ? (
              <HebrewDateInput
                value={form.date}
                onChange={(date) =>
                  setForm((currentValue) => ({ ...currentValue, date }))
                }
              />
            ) : (
              <input
                type="date"
                value={form.date}
                onChange={(event) =>
                  setForm((currentValue) => ({
                    ...currentValue,
                    date: event.target.value,
                  }))
                }
                className={fieldClass}
                required
              />
            )}
            <input
              value={form.imageUrl}
              onChange={(event) =>
                setForm((currentValue) => ({
                  ...currentValue,
                  imageUrl: event.target.value,
                }))
              }
              className={fieldClass}
              placeholder="קישור לתמונה, לא חובה"
            />

            <div className="flex h-11 rounded-2xl bg-slate-100 p-1">
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
                  className={`flex-1 rounded-xl text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-purple-200 ${
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
                  className="flex min-h-11 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-slate-800 ring-1 ring-slate-100"
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
              className="min-h-16 rounded-2xl border border-slate-100 bg-white px-3 py-2 text-right text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200 sm:col-span-2"
              placeholder="הערות"
            />
            <button
              type="submit"
              className="family-events-dark-action min-h-11 rounded-2xl px-4 text-sm font-black shadow-[0_12px_28px_rgba(36,21,31,0.18)] transition focus:outline-none focus:ring-2 focus:ring-purple-200 sm:col-span-2"
            >
              שמור אירוע משפחתי
            </button>
          </form>
        )}
      </section>

      <SmartInsights events={normalizedEvents} />

      {visibleEvents.length === 0 ? (
        <section className="nestly-card-strong rounded-[18px] p-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-[18px] bg-white text-2xl shadow-sm">
            ⭐
          </div>
          <h2 className="mt-2 text-base font-black text-[#24151f]">
            אין אירועים משפחתיים להצגה
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs font-semibold text-slate-600 sm:text-sm">
            הוסיפו יום הולדת, יום נישואין, יארצייט או מסורת משפחתית.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="family-events-dark-action mt-3 min-h-11 whitespace-nowrap rounded-2xl px-5 text-sm font-black shadow-[0_10px_22px_rgba(36,21,31,0.14)] transition focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            הוסף אירוע משפחתי ראשון
          </button>
        </section>
      ) : (
        <div className="space-y-2">
          <TimelineSection
            title="היום"
            subtitle="אירועים שמתרחשים עכשיו"
            events={timeline.today}
            dateViewMode={dateViewMode}
            onSelect={(event) => setSelectedEventId(event.id)}
          />
          <TimelineSection
            title="השבוע"
            subtitle="כדאי להתכונן בימים הקרובים"
            events={timeline.week}
            dateViewMode={dateViewMode}
            onSelect={(event) => setSelectedEventId(event.id)}
          />
          <TimelineSection
            title="החודש"
            subtitle="אירועים שמתקרבים"
            events={timeline.month}
            dateViewMode={dateViewMode}
            onSelect={(event) => setSelectedEventId(event.id)}
          />
          <TimelineSection
            title="בהמשך"
            subtitle="שאר האירועים השנתיים"
            events={timeline.later}
            dateViewMode={dateViewMode}
            limit={4}
            showAll={showAllLater}
            onShowAll={() => setShowAllLater(true)}
            onSelect={(event) => setSelectedEventId(event.id)}
          />
        </div>
      )}

      {selectedEvent && (
        <EventDetailsSheet
          event={selectedEvent}
          dateViewMode={dateViewMode}
          onClose={() => setSelectedEventId(null)}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
        />
      )}
    </section>
  );
}
