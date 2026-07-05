"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  getTaskStats,
  initialFamilyTasks,
  type FamilyTask,
} from "@/data/tasks";
import DateInput from "@/components/ui/DateInput";
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
    return "border-rose-100 bg-rose-50 text-rose-800";
  }

  if (priority === "medium") {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusClass(status: FamilyTask["status"]) {
  return status === "done"
    ? "border-emerald-100 bg-emerald-50 text-emerald-800"
    : "border-sky-100 bg-sky-50 text-sky-800";
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

function createTaskId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}`;
}

export default function TaskManager() {
  const { confirm, toast } = useFeedback();
  const [tasks, setTasks] = usePersistentArrayState<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  );
  const [taskForm, setTaskForm] = useState<TaskForm>(getInitialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<TaskPriorityFilter>("all");
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

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

  const displayedTasks = showAllTasks ? visibleTasks : visibleTasks.slice(0, 4);

  function resetForm() {
    setTaskForm(getInitialTaskForm());
    setEditingTaskId(null);
  }

  function closeForm() {
    resetForm();
    setIsFormOpen(false);
  }

  function openCreateForm() {
    resetForm();
    setIsFormOpen(true);
  }

  function clearFilters() {
    setSearchValue("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }

  function toggleExpandedTask(id: string) {
    setExpandedTaskId((currentId) => (currentId === id ? null : id));
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

      closeForm();
      toast({
        title: "המשימה עודכנה",
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    const task: FamilyTask = {
      id: createTaskId(),
      title: cleanTitle,
      description: cleanDescription || "משימה חדשה ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      priority: taskForm.priority,
      status: "open",
      dueDate: taskForm.dueDate,
    };

    setTasks((currentTasks) => [task, ...currentTasks]);
    closeForm();
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
    setIsFormOpen(true);
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
      closeForm();
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
    {
      title: 'סה"כ',
      value: stats.total,
      note: "כל המשימות",
      accent: "bg-slate-900",
    },
    {
      title: "פתוחות",
      value: stats.openTasks,
      note: "דורשות טיפול",
      accent: "bg-sky-500",
    },
    {
      title: "בוצעו",
      value: stats.doneTasks,
      note: "נסגרו בהצלחה",
      accent: "bg-emerald-500",
    },
    {
      title: "דחופות",
      value: stats.highPriorityTasks,
      note: "עדיפות גבוהה",
      accent: "bg-rose-400",
    },
  ];

  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="flex min-w-[110px] flex-1 items-center justify-between rounded-full border border-[#e6e8ec] bg-white px-2.5 py-2 text-right shadow-[0_6px_16px_rgba(15,23,42,0.04)]"
          >
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black text-slate-500">
                {card.title}
              </p>
              <p className="text-sm font-black text-[#111827]">{card.value}</p>
            </div>
            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${card.accent}`} />
          </div>
        ))}
      </div>

      <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={isFormOpen ? closeForm : openCreateForm}
            className={
              isFormOpen
                ? "min-h-10 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 hover:bg-white"
                : "min-h-10 rounded-2xl bg-[#111827] px-4 py-2 text-sm font-black text-white hover:bg-[#1f2937]"
            }
          >
            {isFormOpen ? "סגור טופס" : "+ משימה חדשה"}
          </button>

          <div>
            <p className="text-[11px] font-bold text-slate-500">
              {isEditing ? "עריכת משימה" : "פתיחת משימה"}
            </p>
            <h2 className="text-sm font-black text-[#111827]">
              {isEditing ? "עדכון משימה קיימת" : "ניהול משימות הבית"}
            </h2>
          </div>
        </div>

        {isFormOpen && (
          <form
            onSubmit={handleSubmitTask}
            className="mt-2.5 grid gap-2 rounded-[16px] border border-[#e6e8ec] bg-[#fafafb] p-2.5 lg:grid-cols-6"
          >
            <input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((currentTask) => ({
                  ...currentTask,
                  title: event.target.value,
                }))
              }
              required
              className="min-h-10 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55 lg:col-span-2"
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
              className="min-h-10 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55"
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
              className="min-h-10 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55"
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
              className="min-h-10 rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/55"
            >
              <option value="high">עדיפות גבוהה</option>
              <option value="medium">עדיפות בינונית</option>
              <option value="low">עדיפות נמוכה</option>
            </select>

            <DateInput
              value={taskForm.dueDate}
              onChange={(dueDate) =>
                setTaskForm((currentTask) => ({
                  ...currentTask,
                  dueDate,
                }))
              }
              required
              label="תאריך יעד"
              inputClassName="min-h-10 w-full rounded-2xl border border-[#d9dde5] bg-white px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/55"
            />

            <textarea
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((currentTask) => ({
                  ...currentTask,
                  description: event.target.value,
                }))
              }
              className="min-h-16 resize-y rounded-2xl border border-[#d9dde5] bg-white px-3 py-2 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55 lg:col-span-5"
              placeholder="פירוט קצר"
            />

            <button
              type="submit"
              className="min-h-10 rounded-2xl bg-[#111827] px-4 py-2 text-sm font-black text-white hover:bg-[#1f2937]"
            >
              {isEditing ? "שמור" : "פתח"}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={clearFilters}
            className="w-fit rounded-full border border-[#e6e8ec] bg-[#fafafb] px-3 py-1.5 text-[11px] font-black text-slate-700 hover:bg-white"
          >
            נקה סינון
          </button>

          <div>
            <p className="text-[10px] font-bold text-slate-500">
              {visibleTasks.length} משימות מוצגות
            </p>
            <h2 className="text-sm font-black text-[#111827]">חיפוש וסינון</h2>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="min-h-9 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55"
            placeholder="חיפוש"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatusFilter)
            }
            className="min-h-9 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/55"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחות</option>
            <option value="done">בוצעו</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as TaskPriorityFilter)
            }
            className="min-h-9 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/55"
          >
            <option value="all">כל העדיפויות</option>
            <option value="high">גבוהה</option>
            <option value="medium">בינונית</option>
            <option value="low">נמוכה</option>
          </select>
        </div>
      </section>

      <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
        <div className="mb-2.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-bold text-slate-500">
            {stats.openTasks} פתוחות / {stats.doneTasks} בוצעו
          </p>

          <div>
            <p className="text-[11px] font-bold text-slate-500">ניהול משימות</p>
            <h2 className="text-sm font-black text-[#111827]">משימות הבית</h2>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#fafafb] p-4 text-center text-sm font-semibold text-slate-600">
            אין משימות להצגה לפי הסינון הנוכחי.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTasks.map((task) => {
              const isExpanded = expandedTaskId === task.id;

              return (
                <article
                  key={task.id}
                  className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] p-2.5 text-right transition hover:bg-[#fffdf8]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1 text-[10px] font-black">
                        <span
                          className={`rounded-full border px-2 py-0.5 ${getStatusClass(
                            task.status
                          )}`}
                        >
                          {statusLabels[task.status]}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {priorityLabels[task.priority]}
                        </span>
                        <span className="rounded-full border border-[#e6e8ec] bg-white px-2 py-0.5 text-slate-600">
                          {task.category}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-sm font-black text-[#111827]">
                        {task.title}
                      </h3>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        יעד: {formatDate(task.dueDate)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpandedTask(task.id)}
                      className="rounded-full border border-[#e6e8ec] bg-white px-2.5 py-1 text-[11px] font-black text-slate-700"
                    >
                      {isExpanded ? "סגור" : "פרטים"}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-2.5 space-y-2 border-t border-[#e6e8ec] pt-2.5">
                      <p className="text-sm leading-6 text-slate-600">
                        {task.description}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        אחראי: {task.owner}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          className={
                            task.status === "done"
                              ? "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-700"
                              : "rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800"
                          }
                        >
                          {task.status === "done" ? "פתח מחדש" : "בוצע"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditTask(task.id)}
                          className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700"
                        >
                          עריכה
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700"
                        >
                          מחיקה
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className={
                          task.status === "done"
                            ? "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-700"
                            : "rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-800"
                        }
                      >
                        {task.status === "done" ? "פתח מחדש" : "בוצע"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditTask(task.id)}
                        className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700"
                      >
                        עריכה
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700"
                      >
                        מחיקה
                      </button>
                    </div>
                  )}
                </article>
              );
            })}

            {visibleTasks.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllTasks((currentValue) => !currentValue)}
                className="w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 hover:bg-white"
              >
                {showAllTasks ? "הצג פחות" : `הצג עוד ${visibleTasks.length - 4}`}
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
