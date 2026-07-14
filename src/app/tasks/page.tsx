import AppShell from "@/components/layout/AppShell";
import LocalizedPageHero from "@/components/layout/LocalizedPageHero";
import TaskManager from "@/components/tasks/TaskManager";

export default function TasksPage() {
  return (
    <AppShell>
      <LocalizedPageHero module="tasks" />
      <TaskManager />
    </AppShell>
  );
}
