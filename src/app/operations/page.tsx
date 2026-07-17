import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import OperationsDashboard from "@/components/operations/OperationsDashboard";
import {
  getOperationalHealthSnapshot,
  isOperationsEnabled,
} from "@/lib/operations/health";

export default function OperationsPage() {
  if (!isOperationsEnabled()) {
    notFound();
  }

  return (
    <AppShell>
      <OperationsDashboard snapshot={getOperationalHealthSnapshot()} />
    </AppShell>
  );
}
