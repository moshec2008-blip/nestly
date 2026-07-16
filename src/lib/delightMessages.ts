export type DelightMessageKey =
  | "taskCreated"
  | "taskUpdated"
  | "taskCompleted"
  | "taskReopened"
  | "allTasksHandled"
  | "shoppingItemAdded"
  | "shoppingItemPurchased"
  | "shoppingListCompleted"
  | "shoppingItemRestored"
  | "changesSaved";

type DelightMessage = {
  title: string;
  description?: string;
};

export function getDelightMessage(
  key: DelightMessageKey,
  context: { title?: string; owner?: string; remaining?: number } = {}
): DelightMessage {
  const itemTitle = context.title ?? "הפריט";

  const messages: Record<DelightMessageKey, DelightMessage> = {
    taskCreated: {
      title: "המשימה נשמרה",
      description: context.title,
    },
    taskUpdated: {
      title: "השינויים נשמרו",
      description: context.title,
    },
    taskCompleted: {
      title: context.owner
        ? `${context.owner} השלים את המשימה`
        : "המשימה הושלמה",
      description: context.title,
    },
    taskReopened: {
      title: "המשימה נפתחה מחדש",
      description: context.title,
    },
    allTasksHandled: {
      title: "הכול הושלם להיום",
      description: "אין משימות פתוחות שמחכות כרגע.",
    },
    shoppingItemAdded: {
      title: "הפריט נוסף לקניות",
      description: context.title,
    },
    shoppingItemPurchased: {
      title: `${itemTitle} סומן כנרכש`,
      description:
        typeof context.remaining === "number"
          ? context.remaining > 0
            ? `נשארו ${context.remaining} פריטים לקנייה.`
            : "זה היה הפריט האחרון ברשימה."
          : undefined,
    },
    shoppingListCompleted: {
      title: "הקניות הושלמו",
      description: "כל הפריטים סומנו כנרכשו. אפשר להמשיך בקצב רגוע.",
    },
    shoppingItemRestored: {
      title: "הפריט חזר לרשימה",
      description: context.title,
    },
    changesSaved: {
      title: "השינויים נשמרו",
      description: context.title,
    },
  };

  return messages[key];
}
