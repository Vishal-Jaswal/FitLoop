import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const profile = await getProfile(userId);
  if (!profile) redirect("/profile/setup");

  return <AppShell active="Overview" signedIn userLabel={profile.display_name}>{children}</AppShell>;
}
