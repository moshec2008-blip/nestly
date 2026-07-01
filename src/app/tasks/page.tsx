import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import TaskManager from "@/components/tasks/TaskManager";

export default function TasksPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="מרכז משימות"
        title="משימות"
        description="ניהול משימות, אחראים, קטגוריות, עדיפויות ותאריכי יעד בצורה פשוטה וברורה."
        showBackHome
      />

      <TaskManager />
    </AppShell>
  );
}
