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
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+0.75rem)] text-right text-[#111827] shadow-[0_8px_22px_rgba(15,23,42,0.045)] lg:pb-2.5">
      <div className="mb-2 flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-bold text-slate-600">
          {openTasks} פתוחות / {doneTasks} בוצעו
        </p>

        <div>
          <p className="text-[11px] font-bold text-slate-600">
            משימות שחשובות עכשיו
          </p>
          <h2 className="text-sm font-black text-[#111827]">משימות הבית</h2>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#fafafb] p-5 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
            ✓
          </div>
          <p className="mt-3 text-base font-black text-[#111827]">
            הכל רגוע כאן כרגע
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm font-semibold leading-6 text-slate-600">
            כשתהיה משימה חדשה למשפחה, היא תופיע כאן בצורה קצרה וברורה.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
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
              className="min-h-10 w-full rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-1.5 text-sm font-black text-slate-700 transition hover:bg-white active:scale-[0.99]"
            >
              {showAllTasks ? "הצג פחות" : `הצג עוד ${tasks.length - 5}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
