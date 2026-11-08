import type { Metadata } from "next";
import { DashboardPreview } from "@/components/layout/dashboard-preview";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const userId = await getAuthenticatedUserId();
  const profile = userId ? await getProfile(userId) : null;
  return <DashboardPreview name={profile?.display_name ?? "there"} />;
}
