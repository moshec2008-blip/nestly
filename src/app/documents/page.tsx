import DocumentsManager from "@/components/documents/DocumentsManager";
import AppShell from "@/components/layout/AppShell";
import LocalizedPageHero from "@/components/layout/LocalizedPageHero";

export default function DocumentsPage() {
  return (
    <AppShell>
      <LocalizedPageHero module="documents" />
      <DocumentsManager />
    </AppShell>
  );
}
