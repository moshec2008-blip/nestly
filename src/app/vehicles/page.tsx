import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import VehiclesManager from "@/components/vehicles/VehiclesManager";

export default function VehiclesPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="רכבים"
        title="רכבים"
        description="ניהול טיפולים, טסטים, ביטוחים והוצאות רכב משפחתיות."
        showBackHome
      />

      <VehiclesManager />
    </AppShell>
  );
}
