import type { KeyboardEvent } from "react";
import type { FamilyTask } from "@/data/tasks";
import { formatHebrewDateLabel } from "@/utils/formatters";

type TaskCardProps = {
  task: FamilyTask;
  isExpanded: boolean;
  onToggleExpanded: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

function getPriorityClass(priority: FamilyTask["priority"]) {
  if (priority === "high") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (priority === "medium") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}

function getStatusClass(status: FamilyTask["status"]) {
  return status === "done"
    ? "border-emerald-100 bg-emerald-50 text-emerald-800"
    : "border-sky-100 bg-sky-50 text-sky-800";
}

function isTaskOverdue(task: FamilyTask) {
  if (task.status === "done") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return !Number.isNaN(dueDate.getTime()) && dueDate < today;
}

export default function TaskCard({
  task,
  isExpanded,
  onToggleExpanded,
  onToggleStatus,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isUrgent = task.priority === "high" || isTaskOverdue(task);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggleExpanded(task.id);
    }
  }

  return (
    <article
      className={[
        "nestly-interactive cursor-pointer rounded-2xl border bg-white p-2.5 text-right shadow-[0_8px_18px_rgba(33,43,63,0.045)] outline-none transition hover:bg-[#fffdf8] focus:ring-2 focus:ring-blue-100",
        isUrgent ? "border-[#d8b470] bg-[#fffaf1]" : "border-[#eadfcd]",
        task.status === "done" ? "opacity-80" : "",
      ].join(" ")}
      onClick={() => onToggleExpanded(task.id)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
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
            <span className="rounded-full border border-[#eadfcd] bg-white px-2 py-0.5 text-slate-700">
              {formatHebrewDateLabel(task.dueDate)}
            </span>
          </div>

          <h3 className="mt-1.5 line-clamp-1 text-sm font-black text-[#111827]">
            {task.title}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-slate-600">
            {task.category} · {task.owner}
          </p>
        </div>

        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff8eb] text-[15px] font-black text-[#7a5212]">
          {isExpanded ? "×" : "⋯"}
        </span>
      </div>

      {isExpanded && (
        <div
          className="mt-2 space-y-2 border-t border-[#eadfcd] pt-2"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-sm leading-5 text-slate-600">
            {task.description}
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            אחראי: {task.owner}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onToggleStatus(task.id)}
              className={
                task.status === "done"
                  ? "min-h-10 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700"
                  : "min-h-10 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800"
              }
            >
              {task.status === "done" ? "פתח מחדש" : "בוצע"}
            </button>

            <button
              type="button"
              onClick={() => onEdit(task.id)}
              className="min-h-10 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700"
            >
              עריכה
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="min-h-10 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-700"
            >
              מחיקה
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
