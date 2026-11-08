import type { Metadata } from "next";
import { DashboardPreview } from "@/components/layout/dashboard-preview";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  if (isLocalDemoAuthEnabled()) return <DashboardPreview demoMode name="test" />;
  const userId = await getAuthenticatedUserId();
  const profile = userId ? await getProfile(userId) : null;
  return <DashboardPreview name={profile?.display_name ?? "there"} />;
}
