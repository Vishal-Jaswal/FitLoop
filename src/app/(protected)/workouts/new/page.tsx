import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkoutStart } from "@/features/workouts/workout-start";
import { getDemoExercises } from "@/features/workouts/catalog";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { getActiveWorkout, listExercises, listRoutines } from "@/infrastructure/database/supabase/workout-repository";
import { getAuthenticatedUserId } from "@/services/auth-service";
import type { Exercise, Routine } from "@/features/workouts/types";

export const metadata: Metadata = { title: "Start workout" };

export default async function NewWorkoutPage({ searchParams }: { searchParams: Promise<{ routine?: string; exercise?: string }> }) {
  const query = await searchParams;
  const demoMode = isLocalDemoAuthEnabled();
  const ownerId = demoMode ? null : await getAuthenticatedUserId();
  if (ownerId) {
    const active = await getActiveWorkout(ownerId);
    if (active) redirect("/workouts/" + active.id);
  }
  let routines: Routine[] = [];
  let exercises: Exercise[];
  if (demoMode) {
    exercises = getDemoExercises();
  } else {
    const result = await Promise.all([ownerId ? listRoutines(ownerId) : Promise.resolve([]), listExercises()]);
    routines = result[0];
    exercises = result[1];
  }
  return <WorkoutStart routines={routines} exercises={exercises} initialRoutineId={query.routine ?? null} initialExerciseId={query.exercise ?? null} demoMode={demoMode} />;
}
