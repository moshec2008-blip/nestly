import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import SettingsManager from "@/components/settings/SettingsManager";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="הגדרות"
        title="הגדרות"
        description="ניהול שפה, נגישות, תצוגה ושמירה מקומית של נתוני המערכת."
        showBackHome
      />

      <SettingsManager />
    </AppShell>
  );
}
