import FinanceHeader from "@/components/finance/FinanceHeader";
import FinanceManager from "@/components/finance/FinanceManager";
import AppShell from "@/components/layout/AppShell";

export default function FinancePage() {
  return (
    <AppShell>
      <FinanceHeader />
      <FinanceManager />
    </AppShell>
  );
}
