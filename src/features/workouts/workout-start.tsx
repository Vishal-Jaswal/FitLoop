"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useDemoWorkout } from "./demo-workout-store";
import type { Exercise, Routine, SessionExercise, WeightUnit, WorkoutSession } from "./types";
import { Notice, PageHeading, Tag } from "./workout-ui";
import { startWorkoutAction } from "./actions";

function newId(): string { return globalThis.crypto.randomUUID(); }

export function WorkoutStart({ routines: initialRoutines, exercises, initialRoutineId, initialExerciseId, demoMode }: { routines: Routine[]; exercises: Exercise[]; initialRoutineId: string | null; initialExerciseId: string | null; demoMode: boolean }) {
  const store = useDemoWorkout();
  const router = useRouter();
  const [routineId, setRoutineId] = useState(initialRoutineId ?? "");
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const activeSession = demoMode ? store.data.sessions.find((session) => session.status === "in_progress") ?? null : null;
  const visibleRoutines = demoMode ? store.data.routines : initialRoutines;
  const selectedExercise = useMemo(() => exercises.find((exercise) => exercise.id === initialExerciseId) ?? null, [exercises, initialExerciseId]);

  function begin(routine: Routine | null) {
    setError("");
    startTransition(async () => {
      if (demoMode) {
        const planned = routine?.exercises ?? [];
        const sessionExercises: SessionExercise[] = planned.flatMap((item, position) => {
          const exercise = exercises.find((entry) => entry.id === item.exerciseId);
          if (!exercise) return [];
          return [{
            id: newId(), exerciseId: exercise.id, name: exercise.name,
            primaryMuscleGroup: exercise.primaryMuscleGroup, position,
            sets: Array.from({ length: item.targetSets }, (_, index) => ({ id: newId(), position: index, type: "working" as const, reps: null, weightKg: null, completedAt: null })),
          }];
        });
        if (!routine && selectedExercise) {
          sessionExercises.push({ id: newId(), exerciseId: selectedExercise.id, name: selectedExercise.name, primaryMuscleGroup: selectedExercise.primaryMuscleGroup, position: 0, sets: [0, 1, 2].map((position) => ({ id: newId(), position, type: "working" as const, reps: null, weightKg: null, completedAt: null })) });
        }
        const session: WorkoutSession = { id: newId(), routineId: routine?.id ?? null, status: "in_progress", weightUnit: unit, startedAt: new Date().toISOString(), finishedAt: null, exercises: sessionExercises };
        store.dispatch({ type: "session.start", session });
        router.push(`/workouts/${session.id}`);
        return;
      }
      const result = await startWorkoutAction(routine?.id ?? null, unit);
      if (!result.ok) { setError(result.error); return; }
      let session = result.data;
      if (!routine && selectedExercise) {
        const { addExerciseToWorkoutAction } = await import("./actions");
        const added = await addExerciseToWorkoutAction(session.id, selectedExercise.id);
        if (!added.ok) { setError(added.error); return; }
        session = { ...session, exercises: [added.data] };
      }
      router.push(`/workouts/${session.id}`);
    });
  }

  if (demoMode && !store.ready) return <Container className="py-12"><Card className="p-8 text-center text-sm text-muted" aria-live="polite">Loading your local workout space…</Card></Container>;

  return (
    <Container className="py-8 sm:py-11 lg:py-14">
      <PageHeading eyebrow="Make today count" title="Start a workout" description="Pick up where you left off, follow a saved routine, or start with a blank session." />
      {demoMode && <div className="mb-5"><Notice kind="info">Demo workouts stay in this browser and never write to the database.</Notice></div>}
      {error && <div className="mb-5"><Notice>{error}</Notice></div>}
      {activeSession ? <Card className="mb-5 flex flex-col justify-between gap-4 border-accent/30 bg-accent-soft p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent-bright">Workout in progress</p><h2 className="mt-1 text-lg font-semibold">You have a session ready to continue</h2><p className="mt-1 text-sm text-muted">Started {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(activeSession.startedAt))}</p></div><Link className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-semibold text-white" href={`/workouts/${activeSession.id}`}>Continue workout <span aria-hidden="true" className="ml-2">↗</span></Link></Card> : null}
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="h-fit p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Quick start</p><h2 className="mt-2 text-xl font-semibold">Choose your units</h2><p className="mt-2 text-sm leading-6 text-muted">Your entries are stored in a consistent format and shown in the unit you choose here.</p>
          <fieldset className="mt-5"><legend className="mb-2 text-sm font-medium">Weight unit</legend><div className="grid grid-cols-2 gap-2">{(["kg", "lb"] as const).map((option) => <button aria-pressed={unit === option} className={`min-h-11 rounded-control border text-sm font-semibold uppercase ${unit === option ? "border-accent bg-accent-soft text-accent-bright" : "border-border bg-surface-raised text-muted"}`} key={option} onClick={() => setUnit(option)} type="button">{option}</button>)}</div></fieldset>
          <Button className="mt-5 w-full" disabled={pending} onClick={() => begin(null)}>{pending ? "Starting…" : selectedExercise ? `Start ${selectedExercise.name}` : "Start blank workout"}<span aria-hidden="true">↗</span></Button>
          {selectedExercise && <p className="mt-3 text-xs leading-5 text-muted">We’ll add {selectedExercise.name} to your new session.</p>}
        </Card>
        <section aria-labelledby="routine-choice-heading"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Your plan</p><h2 className="mt-1 text-xl font-semibold" id="routine-choice-heading">Start from a routine</h2></div><Link className="text-sm font-semibold text-accent-bright underline underline-offset-4" href="/routines">Manage routines</Link></div>
          {visibleRoutines.length ? <div className="grid gap-3">{visibleRoutines.map((routine) => <Card className={`p-5 transition ${routine.id === routineId ? "border-accent/50" : ""}`} key={routine.id}><button aria-pressed={routineId === routine.id} className="w-full text-left" onClick={() => setRoutineId(routine.id)} type="button"><span className="flex items-start justify-between gap-3"><span><span className="block font-semibold">{routine.name}</span><span className="mt-1 block text-sm text-muted">{routine.description || "A saved training plan"}</span></span><span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs text-accent-bright">{routine.id === routineId ? "✓" : ""}</span></span><span className="mt-4 flex flex-wrap gap-2"><Tag>{routine.exercises.length} exercises</Tag><Tag>{routine.exercises.reduce((sum, item) => sum + item.targetSets, 0)} sets</Tag></span></button><Button className="mt-4 w-full" disabled={pending} onClick={() => begin(routine)} variant={routine.id === routineId ? "primary" : "secondary"}>{pending ? "Starting…" : `Start ${routine.name}`}</Button></Card>)}</div> : <Card className="p-7 text-center"><p className="font-semibold">No saved routines yet</p><p className="mt-2 text-sm text-muted">Build one from your favorite exercises, or start a blank workout now.</p><Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-accent-bright underline underline-offset-4" href="/routines">Create a routine</Link></Card>}
        </section>
      </div>
    </Container>
  );
}
