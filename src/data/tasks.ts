export type FamilyTask = {
  id: string;
  title: string;
  description: string;
  owner: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "open" | "done";
  dueDate: string;
  completedAt?: string;
};

export function isFamilyTask(value: unknown): value is FamilyTask {
  if (!value || typeof value !== "object") {
    return false;
  }

  const task = value as Partial<FamilyTask>;

  return (
    typeof task.id === "string" &&
    task.id.length > 0 &&
    typeof task.title === "string" &&
    (task.status === "open" || task.status === "done") &&
    (task.completedAt === undefined || typeof task.completedAt === "string")
  );
}

export const initialFamilyTasks: FamilyTask[] = [
  {
    id: "1",
    title: "לעבור על התקציב החודשי",
    description: "בדיקה קצרה של הוצאות והכנסות במסך הכספים.",
    owner: "הבית",
    category: "כספים",
    priority: "high",
    status: "open",
    dueDate: "2026-06-15",
  },
  {
    id: "2",
    title: "לסדר מסמכים חשובים",
    description: "להכין מקום מסודר למסמכים וקבצים משפחתיים.",
    owner: "הבית",
    category: "מסמכים",
    priority: "medium",
    status: "open",
    dueDate: "2026-06-20",
  },
  {
    id: "3",
    title: "לבדוק שהגיבוי עובד",
    description: "להוריד גיבוי JSON ממסך הכספים ולוודא שהוא נשמר.",
    owner: "הבית",
    category: "מערכת",
    priority: "medium",
    status: "done",
    dueDate: "2026-06-10",
  },
];

export function getTaskStats(tasks: FamilyTask[]) {
  const openTasks = tasks.filter((task) => task.status === "open").length;
  const doneTasks = tasks.filter((task) => task.status === "done").length;
  const highPriorityTasks = tasks.filter(
    (task) => task.status === "open" && task.priority === "high"
  ).length;

  return {
    total: tasks.length,
    openTasks,
    doneTasks,
    highPriorityTasks,
  };
}
