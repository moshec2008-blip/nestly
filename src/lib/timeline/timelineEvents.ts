import type { AppIconName } from "@/components/ui/AppIcon";
import type { TimelineImportance, TimelineSourceModule } from "@/types/timeline";

export const timelineModuleIcons: Record<TimelineSourceModule, AppIconName> = {
  tasks: "check",
  shopping: "shopping",
  finance: "finance",
  documents: "document",
  vehicles: "car",
  health: "health",
  family: "family",
  events: "calendar",
  knowledge: "knowledge",
  smart_inbox: "spark",
  permissions: "lock",
  system: "timeline",
};

export const timelineModuleTones: Record<TimelineSourceModule, string> = {
  tasks: "bg-orange-50 text-orange-700 ring-orange-100",
  shopping: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  finance: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  documents: "bg-violet-50 text-violet-700 ring-violet-100",
  vehicles: "bg-blue-50 text-blue-700 ring-blue-100",
  health: "bg-rose-50 text-rose-700 ring-rose-100",
  family: "bg-purple-50 text-purple-700 ring-purple-100",
  events: "bg-pink-50 text-pink-700 ring-pink-100",
  knowledge: "bg-teal-50 text-teal-700 ring-teal-100",
  smart_inbox: "bg-amber-50 text-amber-700 ring-amber-100",
  permissions: "bg-slate-100 text-slate-700 ring-slate-200",
  system: "bg-stone-100 text-stone-700 ring-stone-200",
};

export function importanceTone(importance: TimelineImportance) {
  if (importance === "critical") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (importance === "important") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-slate-50 text-slate-600 ring-slate-100";
}
