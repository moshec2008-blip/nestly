import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import ModuleManager from "@/components/shared/ModuleManager";
import { initialVehicleRecords } from "@/data/modules";
import { storageKeys } from "@/lib/storageKeys";

export default function VehiclesPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="רכבים"
        title="רכבים"
        description="ניהול טיפולים, טסטים, ביטוחים והוצאות רכב משפחתיות."
        showBackHome
      />

      <ModuleManager
        storageKey={storageKeys.vehicles}
        initialRecords={initialVehicleRecords}
        formTitle="הוספת פריט רכב"
        listTitle="מעקב רכבים"
        defaultCategory="רכב"
      />
    </AppShell>
  );
}
