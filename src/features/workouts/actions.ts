"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUserId } from "@/services/auth-service";
import {
  addRoutineExercise,
  addExerciseToWorkout,
  addWorkoutSet,
  cancelWorkout,
  createRoutine,
  deleteRoutine,
  deleteWorkoutSet,
  duplicateRoutine,
  finishWorkout,
  getExerciseProgress,
  removeRoutineExercise,
  reorderRoutineExercises,
  startWorkout,
  updateRoutine,
  updateRoutineExercise,
  updateWorkoutSet,
} from "@/infrastructure/database/supabase/workout-repository";
import { routineInputSchema, routineTargetSchema, weightUnitSchema, workoutSetSchema } from "@/shared/validation/workouts";
import type { Routine, RoutineExercise, SessionExercise, WeightUnit, WorkoutSet, WorkoutSession } from "./types";
import type { ProgressSummary } from "./types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function currentOwner(): Promise<string | null> {
  try {
    return await getAuthenticatedUserId();
  } catch {
    return null;
  }
}

function fail<T>(error: unknown, fallback: string): ActionResult<T> {
  return { ok: false, error: error instanceof Error ? error.message : fallback };
}

export async function createRoutineAction(values: { name: string; description: string | null }): Promise<ActionResult<Routine>> {
  const parsed = routineInputSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the routine details." };
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to save a routine." };
  try {
    const routine = await createRoutine(ownerId, parsed.data.name, parsed.data.description || null);
    revalidatePath("/routines");
    return { ok: true, data: routine };
  } catch (error) { return fail(error, "We could not create this routine."); }
}

export async function updateRoutineAction(routineId: string, values: { name: string; description: string | null }): Promise<ActionResult<null>> {
  const parsed = routineInputSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the routine details." };
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to save a routine." };
  try {
    await updateRoutine(ownerId, routineId, parsed.data.name, parsed.data.description || null);
    revalidatePath("/routines");
    revalidatePath(`/routines/${routineId}`);
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not update this routine."); }
}

export async function deleteRoutineAction(routineId: string): Promise<ActionResult<null>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to manage routines." };
  try {
    await deleteRoutine(ownerId, routineId);
    revalidatePath("/routines");
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not delete this routine."); }
}

export async function duplicateRoutineAction(routineId: string): Promise<ActionResult<Routine>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to manage routines." };
  try {
    const routine = await duplicateRoutine(ownerId, routineId);
    revalidatePath("/routines");
    return { ok: true, data: routine };
  } catch (error) { return fail(error, "We could not duplicate this routine."); }
}

export async function addRoutineExerciseAction(routineId: string, exerciseId: string): Promise<ActionResult<RoutineExercise>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to edit a routine." };
  try {
    const member = await addRoutineExercise(ownerId, routineId, exerciseId);
    revalidatePath(`/routines/${routineId}`);
    return { ok: true, data: member };
  } catch (error) { return fail(error, "We could not add this exercise."); }
}

export async function removeRoutineExerciseAction(routineId: string, memberId: string): Promise<ActionResult<null>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to edit a routine." };
  try {
    await removeRoutineExercise(ownerId, routineId, memberId);
    revalidatePath(`/routines/${routineId}`);
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not remove this exercise."); }
}

export async function updateRoutineExerciseAction(routineId: string, memberId: string, values: unknown): Promise<ActionResult<null>> {
  const parsed = routineTargetSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the exercise targets." };
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to edit a routine." };
  try {
    await updateRoutineExercise(ownerId, routineId, memberId, parsed.data);
    revalidatePath(`/routines/${routineId}`);
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not save those targets."); }
}

export async function reorderRoutineExercisesAction(routineId: string, exerciseIds: string[]): Promise<ActionResult<null>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to edit a routine." };
  try {
    await reorderRoutineExercises(routineId, exerciseIds);
    revalidatePath(`/routines/${routineId}`);
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not reorder the exercises."); }
}

export async function startWorkoutAction(routineId: string | null, unit: WeightUnit): Promise<ActionResult<WorkoutSession>> {
  const parsedUnit = weightUnitSchema.safeParse(unit);
  if (!parsedUnit.success) return { ok: false, error: "Choose kg or lb." };
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to save workouts." };
  try {
    const session = await startWorkout(ownerId, routineId, parsedUnit.data);
    revalidatePath("/workouts");
    return { ok: true, data: session };
  } catch (error) { return fail(error, "We could not start this workout."); }
}

export async function addExerciseToWorkoutAction(sessionId: string, exerciseId: string): Promise<ActionResult<SessionExercise>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to log a workout." };
  try {
    const exercise = await addExerciseToWorkout(ownerId, sessionId, exerciseId);
    revalidatePath(`/workouts/${sessionId}`);
    return { ok: true, data: exercise };
  } catch (error) { return fail(error, "We could not add this exercise."); }
}

export async function addWorkoutSetAction(sessionId: string, exerciseId: string, setType: "warmup" | "working"): Promise<ActionResult<WorkoutSet>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to log a workout." };
  try {
    const set = await addWorkoutSet(ownerId, sessionId, exerciseId, setType);
    revalidatePath(`/workouts/${sessionId}`);
    return { ok: true, data: set };
  } catch (error) { return fail(error, "We could not add a set."); }
}

export async function saveWorkoutSetAction(sessionId: string, exerciseId: string, setId: string, values: unknown): Promise<ActionResult<null>> {
  const parsed = workoutSetSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the set details." };
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to log a workout." };
  try {
    await updateWorkoutSet(ownerId, sessionId, exerciseId, setId, parsed.data);
    revalidatePath(`/workouts/${sessionId}`);
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not save this set."); }
}

export async function deleteWorkoutSetAction(sessionId: string, exerciseId: string, setId: string): Promise<ActionResult<null>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to log a workout." };
  try {
    await deleteWorkoutSet(exerciseId, setId);
    revalidatePath(`/workouts/${sessionId}`);
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not delete this set."); }
}

export async function finishWorkoutAction(sessionId: string): Promise<ActionResult<null>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to finish a workout." };
  try {
    await finishWorkout(sessionId);
    revalidatePath("/history");
    revalidatePath(`/history/${sessionId}`);
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not finish this workout."); }
}

export async function cancelWorkoutAction(sessionId: string): Promise<ActionResult<null>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to cancel a workout." };
  try {
    await cancelWorkout(ownerId, sessionId);
    revalidatePath("/workouts/new");
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (error) { return fail(error, "We could not cancel this workout."); }
}

export async function getExerciseProgressAction(exerciseId: string): Promise<ActionResult<ProgressSummary>> {
  const ownerId = await currentOwner();
  if (!ownerId) return { ok: false, error: "Sign in with Supabase to view progression." };
  try {
    return { ok: true, data: await getExerciseProgress(ownerId, exerciseId) };
  } catch (error) { return fail(error, "We could not load exercise progression."); }
}
