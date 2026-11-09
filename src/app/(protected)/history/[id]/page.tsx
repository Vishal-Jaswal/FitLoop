import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkoutHistoryDetail } from "@/features/workouts/workout-history";
import { isLocalDemoAuthEnabled } from "@/infrastructure/auth/local-demo-auth";
import { getWorkoutSession } from "@/infrastructure/database/supabase/workout-repository";
import { getAuthenticatedUserId } from "@/services/auth-service";

export const metadata: Metadata = { title: "Workout details" };

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demoMode = isLocalDemoAuthEnabled();
  let session = null;
  if (!demoMode) {
    const ownerId = await getAuthenticatedUserId();
    if (!ownerId) notFound();
    session = await getWorkoutSession(ownerId, id);
    if (!session || session.status !== "completed") notFound();
  }
  return <WorkoutHistoryDetail sessionId={id} initialSession={session} demoMode={demoMode} />;
}
