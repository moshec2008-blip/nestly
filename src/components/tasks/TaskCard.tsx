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

export default function TaskCard({
  task,
  isExpanded,
  onToggleExpanded,
  onToggleStatus,
  onEdit,
  onDelete,
}: TaskCardProps) {
  return (
    <article className="nestly-interactive rounded-2xl border border-[#eadfcd] bg-white p-3 text-right shadow-[0_10px_24px_rgba(33,43,63,0.055)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1 text-[10px] font-black">
            <span className={`rounded-full border px-2 py-0.5 ${getStatusClass(task.status)}`}>
              {statusLabels[task.status]}
            </span>
            <span className={`rounded-full border px-2 py-0.5 ${getPriorityClass(task.priority)}`}>
              {priorityLabels[task.priority]}
            </span>
            <span className="rounded-full border border-[#eadfcd] bg-white px-2 py-0.5 text-slate-700">
              {task.category}
            </span>
          </div>

          <h3 className="mt-1.5 text-sm font-black text-[#111827]">
            {task.title}
          </h3>
          <p className="mt-1 text-[12px] font-semibold text-slate-600">
            יעד: {formatHebrewDateLabel(task.dueDate)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleExpanded(task.id)}
          className="min-h-11 rounded-full border border-[#eadfcd] bg-[#fff8eb] px-3 py-2 text-[11px] font-black text-[#7a5212] transition hover:bg-white"
        >
          {isExpanded ? "סגור" : "פרטים"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 space-y-2 border-t border-[#eadfcd] pt-2.5">
          <p className="text-sm leading-6 text-slate-600">
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
                  ? "min-h-11 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700"
                  : "min-h-11 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-800"
              }
            >
              {task.status === "done" ? "פתח מחדש" : "בוצע"}
            </button>

            <button
              type="button"
              onClick={() => onEdit(task.id)}
              className="min-h-11 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700"
            >
              עריכה
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="min-h-11 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-black text-rose-700"
            >
              מחיקה
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
