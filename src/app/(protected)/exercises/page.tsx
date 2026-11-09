import type { Metadata } from "next";
import { ExerciseLibrary } from "@/features/workouts/exercise-library";
import { getDemoExercises } from "@/features/workouts/catalog";
import { listExercises } from "@/infrastructure/database/supabase/workout-repository";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";

export const metadata: Metadata = { title: "Exercise library" };

export default async function ExercisesPage() {
  const exercises = isLocalDemoAuthEnabled() ? getDemoExercises() : await listExercises();
  return <ExerciseLibrary exercises={exercises} />;
}
