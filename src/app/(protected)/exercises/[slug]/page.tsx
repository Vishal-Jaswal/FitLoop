import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExerciseDetail } from "@/features/workouts/exercise-detail";
import { getDemoExercises } from "@/features/workouts/catalog";
import { getExerciseProgress, findExerciseBySlug } from "@/infrastructure/database/supabase/workout-repository";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { getAuthenticatedUserId } from "@/services/auth-service";
import type { ProgressSummary } from "@/features/workouts/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const exercise = isLocalDemoAuthEnabled() ? getDemoExercises().find((item) => item.slug === slug) : await findExerciseBySlug(slug);
  return { title: exercise?.name ?? "Exercise" };
}

export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demoMode = isLocalDemoAuthEnabled();
  const exercise = demoMode ? getDemoExercises().find((item) => item.slug === slug) ?? null : await findExerciseBySlug(slug);
  if (!exercise) notFound();
  let progress: ProgressSummary = { previous: null, record: null };
  if (!demoMode) {
    const ownerId = await getAuthenticatedUserId();
    if (ownerId) progress = await getExerciseProgress(ownerId, exercise.id);
  }
  return <ExerciseDetail exercise={exercise} initialProgress={progress} />;
}
