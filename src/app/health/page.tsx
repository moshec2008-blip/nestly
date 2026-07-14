import HealthManager from "@/components/health/HealthManager";
import AppShell from "@/components/layout/AppShell";
import LocalizedPageHero from "@/components/layout/LocalizedPageHero";

export default function HealthPage() {
  return (
    <AppShell>
      <LocalizedPageHero module="health" />
      <HealthManager />
    </AppShell>
  );
}
