import type { TaskPriorityFilter, TaskStatusFilter } from "@/components/tasks/taskTypes";

type TaskFiltersProps = {
  visibleCount: number;
  searchValue: string;
  statusFilter: TaskStatusFilter;
  priorityFilter: TaskPriorityFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: TaskStatusFilter) => void;
  onPriorityFilterChange: (value: TaskPriorityFilter) => void;
  onClearFilters: () => void;
};

export default function TaskFilters({
  visibleCount,
  searchValue,
  statusFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onClearFilters,
}: TaskFiltersProps) {
  return (
    <section className="rounded-[18px] border border-[#e6e8ec] bg-white p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onClearFilters}
          className="min-h-11 w-fit rounded-full border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-[11px] font-black text-slate-700 hover:bg-white"
        >
          נקה סינון
        </button>

        <div>
          <p className="text-[10px] font-bold text-slate-500">
            {visibleCount} משימות מוצגות
          </p>
          <h2 className="text-sm font-black text-[#111827]">חיפוש וסינון</h2>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-h-11 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#007aff]/55"
          placeholder="חיפוש"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as TaskStatusFilter)
          }
          className="min-h-11 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/55"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="open">פתוחות</option>
          <option value="done">בוצעו</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            onPriorityFilterChange(event.target.value as TaskPriorityFilter)
          }
          className="min-h-11 rounded-2xl border border-[#d9dde5] bg-[#fafafb] px-3 text-right text-sm font-semibold text-[#111827] outline-none focus:border-[#007aff]/55"
        >
          <option value="all">כל העדיפויות</option>
          <option value="high">גבוהה</option>
          <option value="medium">בינונית</option>
          <option value="low">נמוכה</option>
        </select>
      </div>
    </section>
  );
}

