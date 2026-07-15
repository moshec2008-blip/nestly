import type { TimelineItem } from "@/types/timeline";

export type TimelineGroupKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "older";

export type TimelineGroup = {
  key: TimelineGroupKey | string;
  label: string;
  items: TimelineItem[];
};

const dayMs = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getGroupLabel(date: Date, language: "he" | "en") {
  const now = startOfDay(new Date());
  const itemDay = startOfDay(date);
  const diffDays = Math.floor((now.getTime() - itemDay.getTime()) / dayMs);

  if (diffDays === 0) return language === "en" ? "Today" : "היום";
  if (diffDays === 1) return language === "en" ? "Yesterday" : "אתמול";
  if (diffDays <= 7) return language === "en" ? "This week" : "השבוע";
  if (diffDays <= 31) return language === "en" ? "This month" : "החודש";

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "he-IL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getGroupKey(date: Date) {
  const now = startOfDay(new Date());
  const itemDay = startOfDay(date);
  const diffDays = Math.floor((now.getTime() - itemDay.getTime()) / dayMs);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "thisWeek";
  if (diffDays <= 31) return "thisMonth";
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function groupTimelineItems(
  items: TimelineItem[],
  language: "he" | "en" = "he"
): TimelineGroup[] {
  const groups = new Map<string, TimelineGroup>();

  items.forEach((item) => {
    const date = new Date(item.occurredAt);
    const key = getGroupKey(date);
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.items.push(item);
      return;
    }

    groups.set(key, {
      key,
      label: getGroupLabel(date, language),
      items: [item],
    });
  });

  return Array.from(groups.values());
}
