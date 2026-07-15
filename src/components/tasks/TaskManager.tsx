"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getTaskStats,
  initialFamilyTasks,
  type FamilyTask,
} from "@/data/tasks";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskForm from "@/components/tasks/TaskForm";
import TaskList from "@/components/tasks/TaskList";
import TaskStats from "@/components/tasks/TaskStats";
import type {
  TaskFormValues,
  TaskPriorityFilter,
  TaskStatusFilter,
} from "@/components/tasks/taskTypes";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { consumeTaskDraft } from "@/lib/actionDrafts";
import { storageKeys } from "@/lib/storageKeys";
import {
  markFirstUsefulAction,
  trackTelemetryEvent,
} from "@/services/telemetry";
import { recordMeaningfulActivity } from "@/services/timelineService";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialTaskForm(): TaskFormValues {
  return {
    title: "",
    description: "",
    owner: "הבית",
    category: "כללי",
    priority: "medium",
    dueDate: getTodayDate(),
  };
}

function getTaskForm(task: FamilyTask): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    owner: task.owner,
    category: task.category,
    priority: task.priority,
    dueDate: task.dueDate,
  };
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

function isTaskOverdue(task: FamilyTask) {
  if (task.status === "done") {
    return false;
  }

  const today = getTodayDate();
  return Boolean(task.dueDate) && task.dueDate < today;
}

export default function TaskManager() {
  const { confirm, toast } = useFeedback();
  const [tasks, setTasks] = usePersistentArrayState<FamilyTask>(
    storageKeys.tasks,
    initialFamilyTasks
  );
  const [taskForm, setTaskForm] = useState<TaskFormValues>(getInitialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // טיוטת משימה ממסמך סרוק — פותחת טופס ממולא מראש לאישור המשתמש.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const draft = consumeTaskDraft();

      if (draft) {
        setTaskForm({
          ...getInitialTaskForm(),
          title: draft.title,
          description: draft.description ?? "",
          dueDate: draft.dueDate || getTodayDate(),
        });
        setIsFormOpen(true);
        toast({
          title: "טיוטת משימה מהמסמך מוכנה",
          description: "בדקו את הפרטים ושמרו כדי ליצור את המשימה.",
          tone: "info",
        });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      .filter((task) => {
        if (statusFilter === "all") {
          return true;
        }

        if (statusFilter === "overdue") {
          return isTaskOverdue(task);
        }

        return task.status === statusFilter;
      })
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
    markFirstUsefulAction("task_created", "tasks");
    trackTelemetryEvent({
      name: "task_created",
      module: "tasks",
      properties: {
        priority: task.priority,
        hasDescription: Boolean(cleanDescription),
        hasDueDate: Boolean(task.dueDate),
      },
    });
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
    setExpandedTaskId(id);
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
    const task = tasks.find((item) => item.id === id);
    const isCompleting = task?.status === "open";

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, status: task.status === "done" ? "open" : "done" }
          : task
      )
    );

    if (task) {
      if (isCompleting) {
        markFirstUsefulAction("task_completed", "tasks");
        recordMeaningfulActivity({
          eventType: "task_completed",
          title: `${task.owner} השלים את המשימה "${task.title}"`,
          description: task.description,
          occurredAt: new Date().toISOString(),
          actorDisplayName: task.owner,
          sourceModule: "tasks",
          sourceEntityType: "task",
          sourceEntityId: task.id,
          sourceUrl: "/tasks",
          relatedEntityIds: [task.id],
          relatedFamilyMemberIds: [],
          eventKey: `task_completed:${task.id}:${new Date().toISOString().slice(0, 10)}`,
          metadata: {
            category: task.category,
            priority: task.priority,
            dueDate: task.dueDate,
            sourceLabel: "משימות",
          },
          userConfirmed: true,
        });
        trackTelemetryEvent({
          name: "task_completed",
          module: "tasks",
          properties: {
            priority: task.priority,
            overdue: task.dueDate < getTodayDate(),
          },
        });
      } else {
        recordMeaningfulActivity({
          eventType: "task_reopened",
          title: `המשימה "${task.title}" נפתחה מחדש`,
          description: task.description,
          occurredAt: new Date().toISOString(),
          actorDisplayName: task.owner,
          sourceModule: "tasks",
          sourceEntityType: "task",
          sourceEntityId: task.id,
          sourceUrl: "/tasks",
          relatedEntityIds: [task.id],
          relatedFamilyMemberIds: [],
          eventKey: `task_reopened:${task.id}:${new Date().toISOString().slice(0, 10)}`,
          metadata: {
            category: task.category,
            priority: task.priority,
            sourceLabel: "משימות",
          },
          userConfirmed: true,
        });
        trackTelemetryEvent({
          name: "task_reopened",
          module: "tasks",
          properties: { priority: task.priority },
        });
      }

      toast({
        title: isCompleting ? "סומן כבוצע" : "המשימה נפתחה מחדש",
        description: isCompleting
          ? `${task.title} ירדה מהרשימה. עוד צעד קטן לבית רגוע יותר.`
          : task.title,
        tone: isCompleting ? "success" : "info",
      });
    }
  }

  const statCards = [
    {
      title: 'סה"כ',
      value: stats.total,
      accent: "bg-slate-500",
    },
    {
      title: "פתוחות",
      value: stats.openTasks,
      accent: "bg-sky-500",
    },
    {
      title: "בוצעו",
      value: stats.doneTasks,
      accent: "bg-emerald-500",
    },
    {
      title: "דחופות",
      value: stats.highPriorityTasks,
      accent: "bg-rose-400",
    },
  ];

  return (
    <section className="space-y-2.5">
      <TaskStats cards={statCards} />

      {!isFormOpen && (
        <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={openCreateForm}
              className="min-h-10 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 py-2 text-sm font-black text-[#111827] shadow-[0_8px_18px_rgba(33,43,63,0.06)] transition hover:bg-white"
            >
              + משימה חדשה
            </button>

            <div>
              <p className="text-[11px] font-bold text-slate-500">
                פתיחת משימה
              </p>
              <h2 className="text-sm font-black text-[#111827]">
                ניהול משימות הבית
              </h2>
            </div>
          </div>
        </section>
      )}

      {isFormOpen && (
        <TaskForm
          form={taskForm}
          isEditing={isEditing}
          onSubmit={handleSubmitTask}
          onClose={closeForm}
          onChange={setTaskForm}
        />
      )}

      <TaskFilters
        visibleCount={visibleTasks.length}
        searchValue={searchValue}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onSearchChange={setSearchValue}
        onStatusFilterChange={setStatusFilter}
        onPriorityFilterChange={setPriorityFilter}
        onClearFilters={clearFilters}
      />

      <TaskList
        tasks={visibleTasks}
        openTasks={stats.openTasks}
        doneTasks={stats.doneTasks}
        showAllTasks={showAllTasks}
        expandedTaskId={expandedTaskId}
        onToggleExpanded={toggleExpandedTask}
        onToggleStatus={toggleTaskStatus}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onToggleShowAll={() =>
          setShowAllTasks((currentValue) => !currentValue)
        }
      />
    </section>
  );
}
