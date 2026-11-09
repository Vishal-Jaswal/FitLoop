import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoutineEditor } from "@/features/workouts/routine-editor";
import { getDemoExercises } from "@/features/workouts/catalog";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { listExercises, getRoutine } from "@/infrastructure/database/supabase/workout-repository";
import { getAuthenticatedUserId } from "@/services/auth-service";

export const metadata: Metadata = { title: "Edit routine" };

export default async function RoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demoMode = isLocalDemoAuthEnabled();
  let routine = null;
  let exercises = getDemoExercises();
  if (!demoMode) {
    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) notFound();
    routine = await getRoutine(ownerId, id);
    if (!routine) notFound();
    exercises = await listExercises();
  }
  return <RoutineEditor routineId={id} initialRoutine={routine} exercises={exercises} demoMode={demoMode} />;
}
