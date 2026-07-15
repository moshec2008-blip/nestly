import type {
  CommandCenterItem,
  CommandCenterPriority,
} from "@/types/commandCenter";

const dayMs = 24 * 60 * 60 * 1000;

const sourceImportance: Record<CommandCenterItem["sourceModule"], number> = {
  smart_inbox: 28,
  tasks: 24,
  finance: 24,
  documents: 22,
  vehicles: 20,
  health: 20,
  shopping: 14,
  events: 14,
  permissions: 12,
  family: 10,
  knowledge: 8,
};

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function getDaysUntil(value: string | undefined, now = new Date()) {
  if (!value) {
    return null;
  }

  const date = startOfDay(new Date(value));
  const today = startOfDay(now);
  const diff = Math.round((date.getTime() - today.getTime()) / dayMs);

  return Number.isFinite(diff) ? diff : null;
}

export function calculateUrgencyScore(
  item: Pick<
    CommandCenterItem,
    "dueAt" | "requiresReview" | "isBlocked" | "priority" | "sourceModule"
  >,
  now = new Date()
) {
  const daysUntil = getDaysUntil(item.dueAt, now);
  let score = 0;

  if (daysUntil !== null) {
    if (daysUntil < 0) score += 70;
    else if (daysUntil === 0) score += 50;
    else if (daysUntil <= 2) score += 34;
    else if (daysUntil <= 7) score += 18;
    else if (daysUntil <= 30) score += 6;
  }

  if (item.requiresReview) score += 26;
  if (item.isBlocked) score -= 18;
  if (item.priority === "critical") score += 34;
  if (item.priority === "high") score += 18;
  if (item.priority === "low") score -= 8;
  if (item.sourceModule === "smart_inbox") score += 14;

  return Math.max(0, Math.min(100, score));
}

export function calculateImportanceScore(
  item: Pick<
    CommandCenterItem,
    "priority" | "sourceModule" | "requiresReview" | "isBlocked"
  >
) {
  let score = sourceImportance[item.sourceModule] ?? 10;

  if (item.priority === "critical") score += 36;
  if (item.priority === "high") score += 22;
  if (item.priority === "normal") score += 10;
  if (item.requiresReview) score += 14;
  if (item.isBlocked) score -= 8;

  return Math.max(0, Math.min(100, score));
}

export function priorityFromScores(
  urgencyScore: number,
  importanceScore: number
): CommandCenterPriority {
  if (urgencyScore >= 76 || urgencyScore + importanceScore >= 138) {
    return "critical";
  }

  if (urgencyScore >= 48 || importanceScore >= 62) {
    return "high";
  }

  if (urgencyScore <= 10 && importanceScore <= 24) {
    return "low";
  }

  return "normal";
}

export function sortCommandCenterItems(items: CommandCenterItem[]) {
  return [...items].sort((first, second) => {
    const firstScore = first.urgencyScore * 1.5 + first.importanceScore;
    const secondScore = second.urgencyScore * 1.5 + second.importanceScore;

    if (firstScore !== secondScore) {
      return secondScore - firstScore;
    }

    if (first.dueAt && second.dueAt) {
      return first.dueAt.localeCompare(second.dueAt);
    }

    if (first.dueAt) return -1;
    if (second.dueAt) return 1;

    return first.title.localeCompare(second.title, "he");
  });
}

export function explainCommandCenterReason(item: CommandCenterItem, now = new Date()) {
  const daysUntil = getDaysUntil(item.dueAt, now);

  if (item.requiresReview) {
    return "ממתין לבדיקה לפני שאפשר להמשיך.";
  }

  if (daysUntil !== null && daysUntil < 0) {
    return "תאריך היעד עבר.";
  }

  if (daysUntil === 0) {
    return "זה מיועד להיום.";
  }

  if (daysUntil !== null && daysUntil <= 7) {
    return `מתקרב בעוד ${daysUntil} ימים.`;
  }

  if (item.isBlocked && item.blockedReason) {
    return item.blockedReason;
  }

  if (item.priority === "high" || item.priority === "critical") {
    return "זה מסומן כחשוב.";
  }

  return "זה הפריט שהכי כדאי לקדם עכשיו.";
}
