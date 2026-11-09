import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppShell } from "@/components/layout/app-shell";
import { hasSupabaseConfig } from "@/infrastructure/database/supabase/config";
import { getAuthenticatedUserId } from "@/services/auth-service";
import { getProfile } from "@/services/profile-service";
import { hasLocalDemoSession, isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { DemoWorkoutProvider } from "@/features/workouts/demo-workout-store";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  if (isLocalDemoAuthEnabled()) {
    if (!(await hasLocalDemoSession())) redirect("/login");
    return <DemoWorkoutProvider enabled><AppShell signedIn userLabel="test">{children}</AppShell></DemoWorkoutProvider>;
  }
  if (!hasSupabaseConfig()) redirect("/login?error=setup");
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect("/login");

  const profile = await getProfile(userId);
  if (!profile) redirect("/profile/setup");

  return <DemoWorkoutProvider enabled={false}><AppShell signedIn userLabel={profile.display_name}>{children}</AppShell></DemoWorkoutProvider>;
}
