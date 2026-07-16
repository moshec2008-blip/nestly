import NestlyAssistantPage from "@/components/assistant/NestlyAssistantPage";
import AppShell from "@/components/layout/AppShell";

export default function AssistantRoute() {
  return (
    <AppShell>
      <NestlyAssistantPage />
    </AppShell>
  );
}
