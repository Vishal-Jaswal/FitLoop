import type { Metadata } from "next";
import { RoutineLibrary } from "@/features/workouts/routine-library";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { listRoutines } from "@/infrastructure/database/supabase/workout-repository";
import { getAuthenticatedUserId } from "@/services/auth-service";

export const metadata: Metadata = { title: "Routines" };

export default async function RoutinesPage() {
  const demoMode = isLocalDemoAuthEnabled();
  const ownerId = demoMode ? null : await getAuthenticatedUserId();
  const routines = ownerId ? await listRoutines(ownerId) : [];
  return <RoutineLibrary initialRoutines={routines} demoMode={demoMode} />;
}
