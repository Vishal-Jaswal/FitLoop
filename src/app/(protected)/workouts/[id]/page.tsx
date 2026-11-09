import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ActiveWorkout } from "@/features/workouts/active-workout";
import { getDemoExercises } from "@/features/workouts/catalog";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { getWorkoutSession, listExercises } from "@/infrastructure/database/supabase/workout-repository";
import { getAuthenticatedUserId } from "@/services/auth-service";

export const metadata: Metadata = { title: "Active workout" };

export default async function ActiveWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demoMode = isLocalDemoAuthEnabled();
  let session = null;
  let exercises = getDemoExercises();
  if (!demoMode) {
    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) notFound();
    session = await getWorkoutSession(ownerId, id);
    if (!session) notFound();
    if (session.status === "completed") redirect("/history/" + id);
    if (session.status === "cancelled") redirect("/workouts/new");
    exercises = await listExercises();
  }
  return <ActiveWorkout sessionId={id} initialSession={session} exercises={exercises} demoMode={demoMode} />;
}
