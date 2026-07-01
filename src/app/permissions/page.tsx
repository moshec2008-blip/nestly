import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import PermissionsManager from "@/components/permissions/PermissionsManager";

export default function PermissionsPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="הרשאות ושיתוף"
        title="הרשאות ושיתוף משפחתי"
        description="ניהול תפקידים, אזורים פרטיים ומשותפים, והרשאות צפייה, יצירה, עריכה ומחיקה לפי מודול."
        showBackHome
      />

      <PermissionsManager />
    </AppShell>
  );
}
