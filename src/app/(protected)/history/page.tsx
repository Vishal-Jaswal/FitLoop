import type { Metadata } from "next";
import { WorkoutHistory } from "@/features/workouts/workout-history";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { listWorkoutHistory } from "@/infrastructure/database/supabase/workout-repository";
import { getAuthenticatedUserId } from "@/services/auth-service";

export const metadata: Metadata = { title: "Workout history" };

export default async function HistoryPage() {
  const demoMode = isLocalDemoAuthEnabled();
  const ownerId = demoMode ? null : await getAuthenticatedUserId();
  const sessions = ownerId ? await listWorkoutHistory(ownerId) : [];
  return <WorkoutHistory initialSessions={sessions} demoMode={demoMode} />;
}
