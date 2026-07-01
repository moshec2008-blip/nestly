import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import ModuleManager from "@/components/shared/ModuleManager";
import { initialHealthRecords } from "@/data/modules";
import { storageKeys } from "@/lib/storageKeys";

export default function HealthPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="בריאות"
        title="בריאות"
        description="ניהול תורים, בדיקות, תרופות ומעקב בריאות משפחתי במקום אחד."
        showBackHome
      />

      <ModuleManager
        storageKey={storageKeys.health}
        initialRecords={initialHealthRecords}
        formTitle="הוספת פריט בריאות"
        listTitle="מעקב בריאות"
        defaultCategory="בריאות"
      />
    </AppShell>
  );
}
