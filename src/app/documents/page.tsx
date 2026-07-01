import DocumentsManager from "@/components/documents/DocumentsManager";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";

export default function DocumentsPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="מסמכים"
        title="מסמכים"
        description="צירוף קבצים, ארגון מסמכים, חוזים, אישורים ותזכורות למסמכים חשובים."
        showBackHome
      />

      <DocumentsManager />
    </AppShell>
  );
}
