import type { FamilyTask } from "@/data/tasks";
import TaskCard from "@/components/tasks/TaskCard";

type TaskListProps = {
  tasks: FamilyTask[];
  openTasks: number;
  doneTasks: number;
  showAllTasks: boolean;
  expandedTaskId: string | null;
  onToggleExpanded: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleShowAll: () => void;
};

export default function TaskList({
  tasks,
  openTasks,
  doneTasks,
  showAllTasks,
  expandedTaskId,
  onToggleExpanded,
  onToggleStatus,
  onEdit,
  onDelete,
  onToggleShowAll,
}: TaskListProps) {
  const displayedTasks = showAllTasks ? tasks : tasks.slice(0, 5);

  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="mb-2.5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-bold text-slate-500">
          {openTasks} פתוחות / {doneTasks} בוצעו
        </p>

        <div>
          <p className="text-[11px] font-bold text-slate-500">ניהול משימות</p>
          <h2 className="text-sm font-black text-[#111827]">משימות הבית</h2>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#fafafb] p-4 text-center text-sm font-semibold text-slate-600">
          אין משימות להצגה לפי הסינון הנוכחי.
        </div>
      ) : (
        <div className="space-y-2">
          {displayedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTaskId === task.id}
              onToggleExpanded={onToggleExpanded}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {tasks.length > 5 && (
            <button
              type="button"
              onClick={onToggleShowAll}
              className="w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 hover:bg-white"
            >
              {showAllTasks ? "הצג פחות" : `הצג עוד ${tasks.length - 5}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
