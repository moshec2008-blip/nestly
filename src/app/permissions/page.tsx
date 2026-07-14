import AppShell from "@/components/layout/AppShell";
import LocalizedPageHero from "@/components/layout/LocalizedPageHero";
import PermissionsManager from "@/components/permissions/PermissionsManager";

export default function PermissionsPage() {
  return (
    <AppShell>
      <LocalizedPageHero module="permissions" />
      <PermissionsManager />
    </AppShell>
  );
}
