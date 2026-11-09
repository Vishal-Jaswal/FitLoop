import type { DbExercise, DbRoutine, DbRoutineExercise, DbSessionExercise, DbWorkoutSession, DbWorkoutSet } from "./database.types";
import { createClient } from "./server";
import type { Exercise, ProgressSummary, Routine, RoutineExercise, SessionExercise, WeightUnit, WorkoutSession, WorkoutSet } from "@/features/workouts/types";

function asExercise(row: DbExercise): Exercise {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    instructions: row.instructions,
    primaryMuscleGroup: row.primary_muscle_group as Exercise["primaryMuscleGroup"],
    secondaryMuscles: row.secondary_muscles,
    equipment: row.equipment as Exercise["equipment"],
  };
}

function asRoutineExercise(row: DbRoutineExercise): RoutineExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    position: row.position,
    targetSets: row.target_sets,
    targetRepsMin: row.target_reps_min,
    targetRepsMax: row.target_reps_max,
    restSeconds: row.rest_seconds,
  };
}

function asSet(row: DbWorkoutSet): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    type: row.set_type,
    reps: row.reps,
    weightKg: row.weight_kg,
    completedAt: row.completed_at,
  };
}

function asSessionExercise(row: DbSessionExercise, sets: DbWorkoutSet[]): SessionExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    name: row.exercise_name_snapshot,
    primaryMuscleGroup: row.primary_muscle_group_snapshot,
    position: row.position,
    sets: sets.filter((set) => set.session_exercise_id === row.id).sort((a, b) => a.position - b.position).map(asSet),
  };
}

async function loadRoutineExercises(routines: DbRoutine[]): Promise<Routine[]> {
  if (!routines.length) return [];
  const supabase = await createClient();
  const { data: members, error: membersError } = await supabase
    .from("routine_exercises").select("*").in("routine_id", routines.map((routine) => routine.id)).order("position");
  if (membersError) throw new Error("We could not load the routine exercises.");
  return routines.map((routine) => ({
    id: routine.id,
    name: routine.name,
    description: routine.description,
    createdAt: routine.created_at,
    updatedAt: routine.updated_at,
    exercises: (members ?? []).filter((member) => member.routine_id === routine.id).map(asRoutineExercise),
  }));
}

async function loadSessionExercises(sessions: DbWorkoutSession[]): Promise<WorkoutSession[]> {
  if (!sessions.length) return [];
  const supabase = await createClient();
  const { data: exercises, error: exerciseError } = await supabase
    .from("workout_session_exercises").select("*").in("session_id", sessions.map((session) => session.id)).order("position");
  if (exerciseError) throw new Error("We could not load the workout exercises.");
  const exerciseIds = (exercises ?? []).map((exercise) => exercise.id);
  const { data: sets, error: setError } = exerciseIds.length
    ? await supabase.from("workout_sets").select("*").in("session_exercise_id", exerciseIds).order("position")
    : { data: [], error: null };
  if (setError) throw new Error("We could not load the workout sets.");

  return sessions.map((session) => ({
    id: session.id,
    routineId: session.source_routine_id,
    status: session.status,
    weightUnit: session.weight_unit,
    startedAt: session.started_at,
    finishedAt: session.finished_at,
    exercises: (exercises ?? []).filter((exercise) => exercise.session_id === session.id).map((exercise) => asSessionExercise(exercise, sets ?? [])),
  }));
}

export async function listExercises(): Promise<Exercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercise_catalog").select("*").order("name").limit(250);
  if (error) throw new Error("We could not load the exercise catalogue.");
  return (data ?? []).map(asExercise);
}

export async function findExerciseBySlug(slug: string): Promise<Exercise | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercise_catalog").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error("We could not load this exercise.");
  return data ? asExercise(data) : null;
}

export async function listRoutines(ownerId: string): Promise<Routine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workout_routines").select("*").eq("owner_id", ownerId).order("updated_at", { ascending: false });
  if (error) throw new Error("We could not load your routines.");
  return loadRoutineExercises(data ?? []);
}

export async function getRoutine(ownerId: string, routineId: string): Promise<Routine | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workout_routines").select("*").eq("owner_id", ownerId).eq("id", routineId).maybeSingle();
  if (error) throw new Error("We could not load this routine.");
  if (!data) return null;
  return (await loadRoutineExercises([data]))[0] ?? null;
}

export async function createRoutine(ownerId: string, name: string, description: string | null): Promise<Routine> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workout_routines").insert({ owner_id: ownerId, name, description }).select("*").single();
  if (error) throw new Error("We could not create this routine.");
  return { id: data.id, name: data.name, description: data.description, createdAt: data.created_at, updatedAt: data.updated_at, exercises: [] };
}

export async function updateRoutine(ownerId: string, routineId: string, name: string, description: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_routines").update({ name, description, updated_at: new Date().toISOString() }).eq("owner_id", ownerId).eq("id", routineId);
  if (error) throw new Error("We could not update this routine.");
}

export async function deleteRoutine(ownerId: string, routineId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_routines").delete().eq("owner_id", ownerId).eq("id", routineId);
  if (error) throw new Error("We could not delete this routine.");
}

export async function duplicateRoutine(ownerId: string, routineId: string): Promise<Routine> {
  const original = await getRoutine(ownerId, routineId);
  if (!original) throw new Error("Routine not found.");
  const copy = await createRoutine(ownerId, `${original.name} copy`, original.description);
  if (original.exercises.length) {
    const supabase = await createClient();
    const { error } = await supabase.from("routine_exercises").insert(original.exercises.map((exercise, position) => ({
      routine_id: copy.id,
      exercise_id: exercise.exerciseId,
      position,
      target_sets: exercise.targetSets,
      target_reps_min: exercise.targetRepsMin,
      target_reps_max: exercise.targetRepsMax,
      rest_seconds: exercise.restSeconds,
    })));
    if (error) {
      await deleteRoutine(ownerId, copy.id);
      throw new Error("We could not duplicate this routine.");
    }
  }
  return (await getRoutine(ownerId, copy.id)) ?? copy;
}

export async function addRoutineExercise(ownerId: string, routineId: string, exerciseId: string): Promise<RoutineExercise> {
  const supabase = await createClient();
  const { data: last, error: lookupError } = await supabase.from("routine_exercises").select("position").eq("routine_id", routineId).order("position", { ascending: false }).limit(1);
  if (lookupError) throw new Error("We could not update this routine.");
  const { data, error } = await supabase.from("routine_exercises").insert({ routine_id: routineId, exercise_id: exerciseId, position: (last?.[0]?.position ?? -1) + 1 }).select("*").single();
  if (error) throw new Error("We could not add this exercise to the routine.");
  await touchRoutine(ownerId, routineId);
  return asRoutineExercise(data);
}

async function touchRoutine(ownerId: string, routineId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("workout_routines").update({ updated_at: new Date().toISOString() }).eq("owner_id", ownerId).eq("id", routineId);
}

export async function removeRoutineExercise(ownerId: string, routineId: string, memberId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("routine_exercises").delete().eq("routine_id", routineId).eq("id", memberId);
  if (error) throw new Error("We could not remove this exercise.");
  await touchRoutine(ownerId, routineId);
}

export async function updateRoutineExercise(ownerId: string, routineId: string, memberId: string, values: Pick<RoutineExercise, "targetSets" | "targetRepsMin" | "targetRepsMax" | "restSeconds">): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("routine_exercises").update({ target_sets: values.targetSets, target_reps_min: values.targetRepsMin, target_reps_max: values.targetRepsMax, rest_seconds: values.restSeconds }).eq("routine_id", routineId).eq("id", memberId);
  if (error) throw new Error("We could not update this exercise target.");
  await touchRoutine(ownerId, routineId);
}

export async function reorderRoutineExercises(routineId: string, exerciseIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_routine_exercises", { p_routine_id: routineId, p_exercise_ids: exerciseIds });
  if (error) throw new Error("We could not reorder the routine exercises.");
}

export async function startWorkout(ownerId: string, routineId: string | null, weightUnit: WeightUnit): Promise<WorkoutSession> {
  const supabase = await createClient();
  if (routineId) {
    const { data: sessionId, error } = await supabase.rpc("start_workout_from_routine", { p_routine_id: routineId, p_weight_unit: weightUnit });
    if (error || !sessionId) throw new Error("We could not start a workout from this routine.");
    const session = await getWorkoutSession(ownerId, sessionId);
    if (!session) throw new Error("We could not load the new workout.");
    return session;
  }
  const { data, error } = await supabase.from("workout_sessions").insert({ owner_id: ownerId, weight_unit: weightUnit }).select("*").single();
  if (error) throw new Error(error.message.includes("workout_sessions_one_active_per_owner_idx") ? "You already have a workout in progress." : "We could not start a workout.");
  return { id: data.id, routineId: null, status: data.status, weightUnit: data.weight_unit, startedAt: data.started_at, finishedAt: data.finished_at, exercises: [] };
}

export async function getWorkoutSession(ownerId: string, sessionId: string): Promise<WorkoutSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workout_sessions").select("*").eq("owner_id", ownerId).eq("id", sessionId).maybeSingle();
  if (error) throw new Error("We could not load this workout.");
  if (!data) return null;
  return (await loadSessionExercises([data]))[0] ?? null;
}

export async function getActiveWorkout(ownerId: string): Promise<WorkoutSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workout_sessions").select("*").eq("owner_id", ownerId).eq("status", "in_progress").maybeSingle();
  if (error) throw new Error("We could not load your active workout.");
  return data ? (await loadSessionExercises([data]))[0] ?? null : null;
}

export async function addExerciseToWorkout(ownerId: string, sessionId: string, exerciseId: string): Promise<SessionExercise> {
  const supabase = await createClient();
  const session = await getWorkoutSession(ownerId, sessionId);
  const exercise = await supabase.from("exercise_catalog").select("*").eq("id", exerciseId).single();
  if (exercise.error) throw new Error("We could not find that exercise.");
  const { data, error } = await supabase.from("workout_session_exercises").insert({ session_id: sessionId, exercise_id: exerciseId, exercise_name_snapshot: exercise.data.name, primary_muscle_group_snapshot: exercise.data.primary_muscle_group, position: session?.exercises.length ?? 0 }).select("*").single();
  if (error) throw new Error("We could not add this exercise to the workout.");
  const { data: setRows, error: setsError } = await supabase.from("workout_sets").insert([0, 1, 2].map((position) => ({ session_exercise_id: data.id, position, set_type: "working" as const }))).select("*");
  if (setsError) throw new Error("Exercise added, but its starting sets could not be created.");
  return asSessionExercise(data, (setRows ?? []));
}

export async function addWorkoutSet(ownerId: string, sessionId: string, sessionExerciseId: string, setType: "warmup" | "working"): Promise<WorkoutSet> {
  const session = await getWorkoutSession(ownerId, sessionId);
  const exercise = session?.exercises.find((item) => item.id === sessionExerciseId);
  if (!exercise) throw new Error("We could not find that workout exercise.");
  const supabase = await createClient();
  const { data: last, error: lookupError } = await supabase.from("workout_sets").select("position").eq("session_exercise_id", sessionExerciseId).order("position", { ascending: false }).limit(1);
  if (lookupError) throw new Error("We could not add a set.");
  const { data, error } = await supabase.from("workout_sets").insert({ session_exercise_id: sessionExerciseId, position: (last?.[0]?.position ?? -1) + 1, set_type: setType }).select("*").single();
  if (error) throw new Error("We could not add a set.");
  return asSet(data);
}

export async function updateWorkoutSet(ownerId: string, sessionId: string, sessionExerciseId: string, setId: string, values: { reps: number | null; weightKg: number | null; completedAt: string | null }): Promise<void> {
  const session = await getWorkoutSession(ownerId, sessionId);
  if (!session || session.status !== "in_progress" || !session.exercises.some((exercise) => exercise.id === sessionExerciseId)) {
    throw new Error("This workout is no longer active.");
  }
  const supabase = await createClient();
  const { error } = await supabase.from("workout_sets").update({ reps: values.reps, weight_kg: values.weightKg, completed_at: values.completedAt }).eq("id", setId).eq("session_exercise_id", sessionExerciseId);
  if (error) throw new Error("We could not save this set.");
}

export async function deleteWorkoutSet(sessionExerciseId: string, setId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_sets").delete().eq("id", setId).eq("session_exercise_id", sessionExerciseId);
  if (error) throw new Error("We could not delete this set.");
}

export async function finishWorkout(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_workout", { p_session_id: sessionId });
  if (error) throw new Error(error.message.includes("Complete at least") ? "Complete a working set before finishing your workout." : "We could not finish this workout.");
}

export async function cancelWorkout(ownerId: string, sessionId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_sessions").update({ status: "cancelled", finished_at: new Date().toISOString() }).eq("id", sessionId).eq("owner_id", ownerId).eq("status", "in_progress");
  if (error) throw new Error("We could not cancel this workout.");
}

export async function listWorkoutHistory(ownerId: string, limit = 50): Promise<WorkoutSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("workout_sessions").select("*").eq("owner_id", ownerId).eq("status", "completed").order("finished_at", { ascending: false }).limit(limit);
  if (error) throw new Error("We could not load workout history.");
  return loadSessionExercises(data ?? []);
}

export async function getExerciseProgress(ownerId: string, exerciseId: string): Promise<ProgressSummary> {
  const supabase = await createClient();
  const { data: exerciseRows, error: exerciseError } = await supabase.from("workout_session_exercises").select("id, session_id").eq("exercise_id", exerciseId);
  if (exerciseError) throw new Error("We could not load exercise progression.");
  if (!exerciseRows?.length) return { previous: null, record: null };
  const sessionExerciseIds = exerciseRows.map((item) => item.id);
  const sessionIdByExercise = new Map(exerciseRows.map((item) => [item.id, item.session_id]));
  const { data: sessions, error: sessionsError } = await supabase.from("workout_sessions").select("id, started_at, finished_at").eq("owner_id", ownerId).eq("status", "completed").in("id", exerciseRows.map((item) => item.session_id)).order("finished_at", { ascending: false });
  if (sessionsError) throw new Error("We could not load exercise progression.");
  if (!sessions?.length) return { previous: null, record: null };
  const { data: sets, error: setsError } = await supabase.from("workout_sets").select("session_exercise_id, reps, weight_kg, completed_at").in("session_exercise_id", sessionExerciseIds).eq("set_type", "working").not("completed_at", "is", null);
  if (setsError) throw new Error("We could not load exercise progression.");
  const candidates = (sets ?? []).filter((set) => set.reps !== null && set.weight_kg !== null).map((set) => {
    const sessionId = sessionIdByExercise.get(set.session_exercise_id);
    const session = sessions.find((item) => item.id === sessionId);
    return session ? { date: session.finished_at ?? session.started_at, weightKg: set.weight_kg ?? 0, reps: set.reps ?? 0, sessionId: session.id } : null;
  }).filter((item): item is { date: string; weightKg: number; reps: number; sessionId: string } => item !== null);
  const previousSession = sessions[0];
  const previousTop = candidates.filter((item) => item.sessionId === previousSession?.id).sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];
  const record = [...candidates].sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];
  return {
    previous: previousSession && previousTop ? { date: previousSession.finished_at ?? previousSession.started_at, topWeightKg: previousTop.weightKg, reps: previousTop.reps } : null,
    record: record ? { weightKg: record.weightKg, reps: record.reps, date: record.date } : null,
  };
}
