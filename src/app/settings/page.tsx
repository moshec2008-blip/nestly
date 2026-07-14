import AppShell from "@/components/layout/AppShell";
import LocalizedPageHero from "@/components/layout/LocalizedPageHero";
import SettingsManager from "@/components/settings/SettingsManager";

export default function SettingsPage() {
  return (
    <AppShell>
      <LocalizedPageHero module="settings" />
      <SettingsManager />
    </AppShell>
  );
}
