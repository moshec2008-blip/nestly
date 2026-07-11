import SecurityManager from "@/components/auth/SecurityManager";
import AppShell from "@/components/layout/AppShell";

export default function SecurityPage() {
  return (
    <AppShell>
      <SecurityManager />
    </AppShell>
  );
}
