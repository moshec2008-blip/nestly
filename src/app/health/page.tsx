import AppShell from "@/components/layout/AppShell";
import HealthManager from "@/components/health/HealthManager";
import PageHero from "@/components/layout/PageHero";

export default function HealthPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="בריאות"
        title="בריאות"
        description="ניהול תורים, בדיקות, תרופות ומעקב בריאות משפחתי במקום אחד."
        showBackHome
      />

      <HealthManager />
    </AppShell>
  );
}
