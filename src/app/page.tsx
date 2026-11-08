import { AppShell } from "@/components/layout/app-shell";
import { DashboardPreview } from "@/components/layout/dashboard-preview";

export default function HomePage() {
  return (
    <AppShell>
      <DashboardPreview />
    </AppShell>
  );
}
