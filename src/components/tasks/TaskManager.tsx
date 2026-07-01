"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  getTaskStats,
  initialFamilyTasks,
  type FamilyTask,
} from "@/data/tasks";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";

type TaskStatusFilter = "all" | FamilyTask["status"];
type TaskPriorityFilter = "all" | FamilyTask["priority"];

type TaskForm = {
  title: string;
  description: string;
  owner: string;
  category: string;
  priority: FamilyTask["priority"];
  dueDate: string;
};

const priorityLabels: Record<FamilyTask["priority"], string> = {
  high: "גבוהה",
  medium: "בינונית",
  low: "נמוכה",
};

const statusLabels: Record<FamilyTask["status"], string> = {
  open: "פתוחה",
  done: "בוצעה",
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialTaskForm(): TaskForm {
  return {
    title: "",
    description: "",
    owner: "הבית",
    category: "כללי",
    priority: "medium",
    dueDate: getTodayDate(),
  };
}

function getTaskForm(task: FamilyTask): TaskForm {
  return {
    title: task.title,
    description: task.description,
    owner: task.owner,
    category: task.category,
    priority: task.priority,
    dueDate: task.dueDate,
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getPriorityClass(priority: FamilyTask["priority"]) {
  if (priority === "high") {
    return "bg-[#b86f68]/16 text-[#f0c6bd]";
  }

  if (priority === "medium") {
    return "bg-[#d8b470]/14 text-[#f4e7c8]";
  }

  return "bg-white/[0.07] text-slate-300";
}

function getStatusClass(status: FamilyTask["status"]) {
  return status === "done"
    ? "bg-emerald-400/12 text-emerald-100"
    : "bg-sky-400/12 text-sky-100";
}

function sortTasks(tasks: FamilyTask[]) {
  const priorityOrder: Record<FamilyTask["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "open" ? -1 : 1;
    }

    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    return a.dueDate.localeCompare(b.dueDate);
  });
}

export default function TaskManager() {
  const { confirm, toast } = useFeedback();
  const [tasks, setTasks] = usePersistentArrayState<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  );
  const [taskForm, setTaskForm] = useState<TaskForm>(getInitialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<TaskPriorityFilter>("all");
  const [showAllTasks, setShowAllTasks] = useState(false);

  const stats = useMemo(() => getTaskStats(tasks), [tasks]);
  const isEditing = Boolean(editingTaskId);

  const visibleTasks = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return sortTasks(tasks)
      .filter((task) => statusFilter === "all" || task.status === statusFilter)
      .filter(
        (task) => priorityFilter === "all" || task.priority === priorityFilter
      )
      .filter((task) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          task.title.toLowerCase().includes(normalizedSearch) ||
          task.description.toLowerCase().includes(normalizedSearch) ||
          task.owner.toLowerCase().includes(normalizedSearch) ||
          task.category.toLowerCase().includes(normalizedSearch) ||
          task.dueDate.includes(normalizedSearch)
        );
      });
  }, [tasks, searchValue, statusFilter, priorityFilter]);
  const displayedTasks = showAllTasks ? visibleTasks : visibleTasks.slice(0, 5);

  function resetForm() {
    setTaskForm(getInitialTaskForm());
    setEditingTaskId(null);
  }

  function clearFilters() {
    setSearchValue("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  function handleSubmitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = taskForm.title.trim();
    const cleanDescription = taskForm.description.trim();
    const cleanOwner = taskForm.owner.trim();
    const cleanCategory = taskForm.category.trim();

    if (!cleanTitle || !cleanOwner || !cleanCategory || !taskForm.dueDate) {
      return;
    }

    if (editingTaskId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title: cleanTitle,
                description: cleanDescription || "משימה ללא פירוט נוסף.",
                owner: cleanOwner,
                category: cleanCategory,
                priority: taskForm.priority,
                dueDate: taskForm.dueDate,
              }
            : task
        )
      );

      resetForm();
      toast({
        title: "המשימה עודכנה",
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    const task: FamilyTask = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      description: cleanDescription || "משימה חדשה ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      priority: taskForm.priority,
      status: "open",
      dueDate: taskForm.dueDate,
    };

    setTasks((currentTasks) => [task, ...currentTasks]);
    resetForm();
    toast({
      title: "משימה חדשה נפתחה",
      description: task.title,
      tone: "success",
    });
  }

  function handleEditTask(id: string) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      return;
    }

    setEditingTaskId(id);
    setTaskForm(getTaskForm(task));
  }

  async function handleDeleteTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    const taskTitle = task?.title ?? "המשימה הזו";
    const approved = await confirm({
      title: "מחיקת משימה",
      description: `למחוק את "${taskTitle}"? אי אפשר לשחזר את המשימה אחרי המחיקה.`,
      confirmLabel: "מחק משימה",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setTasks((currentTasks) => currentTasks.filter((item) => item.id !== id));

    if (editingTaskId === id) {
      resetForm();
    }

    toast({
      title: "המשימה נמחקה",
      description: taskTitle,
      tone: "info",
    });
  }

  function toggleTaskStatus(id: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "done" ? "open" : "done" }
          : task
      )
    );
  }

  const statCards = [
    { title: "סהכ משימות", value: stats.total, note: "כל המשימות במערכת" },
    { title: "פתוחות", value: stats.openTasks, note: "דורשות טיפול" },
    { title: "בוצעו", value: stats.doneTasks, note: "נסגרו בהצלחה" },
    {
      title: "עדיפות גבוהה",
      value: stats.highPriorityTasks,
      note: "פתוחות בלבד",
    },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.title} className="rounded-[18px] bg-slate-800/62 p-3 shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
            <p className="mb-1 truncate text-[11px] text-slate-300">{card.title}</p>
            <p className="text-xl font-black text-white">{card.value}</p>
            <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">{card.note}</p>
          </div>
        ))}
      </div>

      <details
        open={isEditing}
        className="group rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-1 py-1">
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="w-fit rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.1]"
            >
              ביטול עריכה
            </button>
          )}

          <div>
            <p className="mb-1 text-[11px] text-slate-400">
              {isEditing ? "עריכת משימה" : "פתיחת משימה"}
            </p>
            <h2 className="text-lg font-black">
              {isEditing ? "עדכון משימה קיימת" : "משימה חדשה"}
            </h2>
          </div>
        </summary>

        <form onSubmit={handleSubmitTask} className="mt-3 grid gap-3 lg:grid-cols-6">
          <input
            value={taskForm.title}
            onChange={(event) =>
              setTaskForm((currentTask) => ({
                ...currentTask,
                title: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="שם המשימה"
          />

          <input
            value={taskForm.owner}
            onChange={(event) =>
              setTaskForm((currentTask) => ({
                ...currentTask,
                owner: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="אחראי"
          />

          <input
            value={taskForm.category}
            onChange={(event) =>
              setTaskForm((currentTask) => ({
                ...currentTask,
                category: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="קטגוריה"
          />

          <select
            value={taskForm.priority}
            onChange={(event) =>
              setTaskForm((currentTask) => ({
                ...currentTask,
                priority: event.target.value as FamilyTask["priority"],
              }))
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="high">עדיפות גבוהה</option>
            <option value="medium">עדיפות בינונית</option>
            <option value="low">עדיפות נמוכה</option>
          </select>

          <input
            value={taskForm.dueDate}
            onChange={(event) =>
              setTaskForm((currentTask) => ({
                ...currentTask,
                dueDate: event.target.value,
              }))
            }
            required
            type="date"
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          />

          <textarea
            value={taskForm.description}
            onChange={(event) =>
              setTaskForm((currentTask) => ({
                ...currentTask,
                description: event.target.value,
              }))
            }
            className="min-h-20 resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-5"
            placeholder="פירוט קצר"
          />

          <button
            type="submit"
            className="rounded-2xl bg-[#f4e7c8] px-5 py-3 text-sm font-black text-slate-950 hover:bg-[#fff3d6]"
          >
            {isEditing ? "שמור שינויים" : "פתח משימה"}
          </button>
        </form>
      </details>

      <section className="rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={clearFilters}
            className="w-fit rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.1]"
          >
            נקה סינון
          </button>

          <div>
            <p className="mb-1 text-xs text-slate-400">
              {visibleTasks.length} משימות מוצגות
            </p>
            <h2 className="text-lg font-black">חיפוש וסינון</h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="חיפוש לפי שם, אחראי, קטגוריה או תאריך"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatusFilter)
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחות בלבד</option>
            <option value="done">בוצעו בלבד</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as TaskPriorityFilter)
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="all">כל העדיפויות</option>
            <option value="high">גבוהה</option>
            <option value="medium">בינונית</option>
            <option value="low">נמוכה</option>
          </select>
        </div>
      </section>

      <section className="rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-bold text-slate-400">
            {stats.openTasks} פתוחות / {stats.doneTasks} בוצעו
          </p>

          <div>
            <p className="mb-1 text-xs text-slate-400">ניהול משימות</p>
            <h2 className="text-lg font-black">משימות הבית</h2>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            אין משימות להצגה לפי הסינון הנוכחי.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 text-right"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={
                        task.status === "done"
                          ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                          : "rounded-xl bg-emerald-400/14 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/20"
                      }
                    >
                      {task.status === "done" ? "פתח מחדש" : "סמן כבוצעה"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditTask(task.id)}
                      className="rounded-xl bg-sky-400/12 px-4 py-2 text-sm font-bold text-sky-100 hover:bg-sky-400/18"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="rounded-xl bg-[#b86f68]/14 px-4 py-2 text-sm font-bold text-[#f0c6bd] hover:bg-[#b86f68]/20"
                    >
                      מחיקה
                    </button>
                  </div>

                  <div className="max-w-3xl">
                    <div className="mb-3 flex flex-wrap justify-end gap-2 text-xs font-bold">
                      <span
                        className={`rounded-full px-3 py-1 ${getStatusClass(
                          task.status
                        )}`}
                      >
                        {statusLabels[task.status]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        עדיפות {priorityLabels[task.priority]}
                      </span>
                      <span className="rounded-full bg-white/[0.07] px-3 py-1 text-slate-300">
                        {task.category}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white">{task.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-400">
                      {task.description}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      אחראי: {task.owner} | יעד: {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {visibleTasks.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllTasks((currentValue) => !currentValue)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.09]"
              >
                {showAllTasks ? "הצג פחות" : `הצג עוד ${visibleTasks.length - 5}`}
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
