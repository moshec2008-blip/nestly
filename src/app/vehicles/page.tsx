import AppShell from "@/components/layout/AppShell";
import LocalizedPageHero from "@/components/layout/LocalizedPageHero";
import VehiclesManager from "@/components/vehicles/VehiclesManager";

export default function VehiclesPage() {
  return (
    <AppShell>
      <LocalizedPageHero module="vehicles" />
      <VehiclesManager />
    </AppShell>
  );
}
