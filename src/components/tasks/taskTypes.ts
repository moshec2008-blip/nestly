import type { FamilyTask } from "@/data/tasks";

export type TaskStatusFilter = "all" | FamilyTask["status"];
export type TaskPriorityFilter = "all" | FamilyTask["priority"];

export type TaskFormValues = {
  title: string;
  description: string;
  owner: string;
  category: string;
  priority: FamilyTask["priority"];
  dueDate: string;
};

