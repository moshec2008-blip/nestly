"use client";

// טיוטות פעולה: מסמך סרוק מציע פעולה (הוצאה/משימה), המודול היעד פותח
// טופס ממולא מראש — והמשתמש תמיד מאשר לפני שמשהו נשמר.

const financeDraftKey = "nestly-draft-finance";
const taskDraftKey = "nestly-draft-task";

export type FinanceDraft = {
  title: string;
  category: string;
  amount?: number;
  date?: string;
  reminderDate?: string;
};

export type TaskDraft = {
  title: string;
  description?: string;
  dueDate?: string;
};

function writeDraft(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אין אחסון זמין — הפעולה פשוט תיפתח בלי מילוי מראש.
  }
}

function consumeDraft<T>(key: string): T | null {
  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    window.localStorage.removeItem(key);
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function setFinanceDraft(draft: FinanceDraft) {
  writeDraft(financeDraftKey, draft);
}

export function consumeFinanceDraft() {
  return consumeDraft<FinanceDraft>(financeDraftKey);
}

export function setTaskDraft(draft: TaskDraft) {
  writeDraft(taskDraftKey, draft);
}

export function consumeTaskDraft() {
  return consumeDraft<TaskDraft>(taskDraftKey);
}
